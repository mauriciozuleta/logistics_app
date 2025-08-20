document.addEventListener('DOMContentLoaded', function() {
  // --- CACHE DOM ELEMENTS ---
  const shipperSelect = document.getElementById('shipper');
  const consigneeSelect = document.getElementById('consignee');
  const exchangeRateInput = document.getElementById('exchange_rate');
  const productTypeFilter = document.getElementById('product_type_filter');
  const productRows = document.querySelectorAll('#product-cost-section div[data-product-id]');
  const header = document.getElementById('product-list-header');
  const depBtn = document.getElementById('add_cargo_departure_btn');
  const retBtn = document.getElementById('add_cargo_return_btn');
  const amountInputs = document.querySelectorAll('input[type="number"][name^="amount_"]');

  // --- SHIPMENT DRAFT LOGIC ---
  const SHIPMENT_DRAFT_KEY = 'shipmentDraft';

  function getShipmentDraft() {
    const data = localStorage.getItem(SHIPMENT_DRAFT_KEY);
    return data ? JSON.parse(data) : {};
  }

  function saveShipmentDraft(draft) {
    localStorage.setItem(SHIPMENT_DRAFT_KEY, JSON.stringify(draft));
  }

  const draft = getShipmentDraft();
  const selectedProducts = draft.selected_products;
  if (selectedProducts && Array.isArray(selectedProducts) && selectedProducts.length > 0) {
    console.log(`Found ${selectedProducts.length} products sent from the selection page.`);
    const selectedProductIds = new Set(selectedProducts.map(p => String(p.prod_id)));
    productRows.forEach(row => {
      const productId = row.getAttribute('data-product-id');
      if (selectedProductIds.has(productId)) {
        row.classList.add('product-selected');
        const checkbox = row.querySelector('input[type="checkbox"][name="selected_products"]');
        if (checkbox) checkbox.checked = true;
      }
    });
    delete draft.selected_products;
    saveShipmentDraft(draft);
    console.log('Processed and cleared selected products from the draft.');
  }

  // --- UI FEEDBACK LOGIC (FLASH AND PERSIST) ---
  function flashElement(element) {
    if (!element || element.classList.contains('input-invalid')) return; // Don't re-flash if already invalid
    element.classList.add('input-flash', 'input-invalid');
    setTimeout(() => {
      element.classList.remove('input-flash');
    }, 1000);
  }

  if (exchangeRateInput) {
    exchangeRateInput.addEventListener('input', function() {
      // Update the state for the currently active context
      if (currentContext) {
        productInputs[currentContext].exchangeRate = parseFloat(this.value) || 0;
      }

      if (parseFloat(this.value) > 0) {
        this.classList.remove('input-invalid');
      }
      recalcAll();
    });
  }

  // --- CONTEXT-AWARE PRODUCT INPUTS ---
  const productInputs = {
    departure: { exchangeRate: 0 },
    return: { exchangeRate: 0 }
  };
  window.shipmentContext = { productData: productInputs, getCurrentContext: () => currentContext };
  let currentContext = null;

  amountInputs.forEach(input => {
    const productId = input.name.replace('amount_', '');
    productInputs.departure[productId] = 0;
    productInputs.return[productId] = 0;
  });
  // Initialize both contexts with the current exchange rate value on the page
  const initialExchangeRate = parseFloat(exchangeRateInput?.value) || 0;
  productInputs.departure.exchangeRate = initialExchangeRate;
  productInputs.return.exchangeRate = initialExchangeRate;

  function restoreInputsForContext(context) {
    amountInputs.forEach(input => {
      const productId = input.name.replace('amount_', '');
      input.value = productInputs[context][productId] || 0;
    });
    if (exchangeRateInput) {
      // Restore the exchange rate for the specific context
      exchangeRateInput.value = productInputs[context].exchangeRate || 0;
    }
    recalcAll();
  }

  function enableAmountInputs() { amountInputs.forEach(input => input.disabled = false); }
  function disableAmountInputs() { amountInputs.forEach(input => input.disabled = true); }

  // --- CALCULATION FUNCTIONS ---
  function updateFcaCosts() {
    let amountEntered = false;
    let nonUsdAmountInputs = [];
    document.querySelectorAll('input[type="number"][name^="amount_"]').forEach(input => {
      if (parseFloat(input.value) > 0) {
        amountEntered = true;
        // Find the corresponding product row and check currency
        const productId = input.name.replace('amount_', '');
        const row = document.querySelector(`div[data-product-id="${productId}"]`);
        if (row) {
          const currency = row.getAttribute('data-currency');
          if (currency && currency !== 'USD') {
            nonUsdAmountInputs.push(input);
          }
        }
      }
    });
    const exchangeRate = parseFloat(exchangeRateInput?.value) || 0;
    if (amountEntered && exchangeRate <= 0) {
      // Always keep input-invalid and input-flash classes while exchange rate is 0
      if (exchangeRateInput) {
        exchangeRateInput.classList.add('input-flash', 'input-invalid');
      }
      nonUsdAmountInputs.forEach(input => {
        input.classList.add('input-flash', 'input-invalid');
      });
    } else {
      // Remove blinking classes when exchange rate is set
      if (exchangeRateInput) {
        exchangeRateInput.classList.remove('input-flash', 'input-invalid');
      }
      document.querySelectorAll('input[type="number"][name^="amount_"]').forEach(input => {
        input.classList.remove('input-flash', 'input-invalid');
      });
    }

    productRows.forEach(row => {
      const amountInput = row.querySelector('input[name^="amount_"]');
      if (!amountInput) return;
      const packWeight = parseFloat(row.getAttribute('data-pack-weight')) || 0;
      const packCost = parseFloat(row.getAttribute('data-pack-cost')) || 0;
      const amount = parseFloat(amountInput.value.replace(/,/g, '')) || 0;
      const currency = row.getAttribute('data-currency');

      const totalWeight = amount * packWeight;
      let totalCost = amount * packCost;

      const context = window.shipmentContext?.getCurrentContext();
      // Determine the exporter based on the current context. Default to shipper if no context.
      const exporterId = (context === 'return') 
        ? (consigneeSelect ? consigneeSelect.value : null) 
        : (shipperSelect ? shipperSelect.value : null);

      let taxPct = 0, profitPct = 0;
      if (exporterId && window.traderData[exporterId]) {
        taxPct = parseFloat(window.traderData[exporterId].export_sales_tax) || 0;
        profitPct = parseFloat(window.traderData[exporterId].export_profit_pct) || 0;
      }
      let taxes = totalCost * (taxPct / 100);
      let profit = totalCost * (profitPct / 100);

      // --- New Currency Conversion Rule ---
      // If the product's currency is not USD, convert its costs using the exchange rate.
      if (currency !== 'USD' && exchangeRate > 0) {
        totalCost = totalCost / exchangeRate;
        taxes = taxes / exchangeRate;
        profit = profit / exchangeRate;
      }

      const fcaCost = totalCost + taxes + profit;

      const weightCell = row.querySelector('[id^="total_weight_"]');
      const costCell = row.querySelector('[id^="total_cost_"]');
      const taxesCell = row.querySelector('[id^="taxes_"]');
      const profitCell = row.querySelector('[id^="profit_"]');
      const fcaCostCell = row.querySelector('[id^="fca_cost_"]');
      if (weightCell) weightCell.textContent = totalWeight ? totalWeight.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' kg' : '-';
      if (costCell) costCell.textContent = totalCost ? '$' + totalCost.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-';
      if (taxesCell) taxesCell.textContent = taxes ? '$' + taxes.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-';
      if (profitCell) profitCell.textContent = profit ? '$' + profit.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-';
      if (fcaCostCell) fcaCostCell.textContent = fcaCost ? '$' + fcaCost.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-';
    });
  }
  window.updateFcaCosts = updateFcaCosts;

  // New function to calculate freight costs based on the conditional logic
  function updateFreightCosts() {
    // Helper to parse numeric values from text content, removing $, kg, and commas
    function parseCost(elementId) {
      const el = document.getElementById(elementId);
      if (!el || !el.textContent || el.textContent === '-' || el.textContent.includes('Error') || el.textContent.includes('Exceeding')) {
        return 0;
      }
      // Remove currency symbols, commas, and units like '/kg'
      const cleanedText = el.textContent.replace(/[$,\/kg]/g, '').trim();
      return parseFloat(cleanedText) || 0;
    }

    const context = window.shipmentContext?.getCurrentContext();
    // This cost is context-dependent, so we do nothing if no context is set.
    if (!context) return;

    // 1. Read the calculated Avg. Kg / P-L and Kg. Cost values based on context
    const avgKgPlId = (context === 'return') ? 'summary_ret_avg_kg' : 'summary_dep_avg_kg';
    const kgCostId = (context === 'return') ? 'return_kg_cost' : 'outbound_kg_cost';
    
    const avgKgPl = parseCost(avgKgPlId);
    const kgCost = parseCost(kgCostId);

    console.log(`Gathered data for freight cost (${context}): Avg. Kg/PL=${avgKgPl}, Kg Cost=${kgCost}`);

    // 3. Loop through each product row
    document.querySelectorAll('div[data-product-id]').forEach(row => {
      const productId = row.getAttribute('data-product-id');
      const totalWeight = parseCost(`total_weight_${productId}`);

      // --- Part 3: Conditional Calculation Logic ---
      const freightCostCell = row.querySelector(`#freight_cost_${productId}`);
      if (freightCostCell) {
        if (totalWeight > 0 && (avgKgPl > 0 || kgCost > 0)) {
          // Use the higher of the two rates as the final rate
          const finalRate = Math.max(avgKgPl, kgCost);
          const freightCost = totalWeight * finalRate;
          freightCostCell.textContent = '$' + freightCost.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
        } else {
          // If there's no weight or no rates, the cost is zero
          freightCostCell.textContent = '-';
        }
      }
    });
  }
  window.updateFreightCosts = updateFreightCosts; // Expose to global scope

  // New function to calculate CIP Cost by summing its components
  function updateCipCosts() {
    // Helper to parse currency values from text content
    function parseCurrency(elementId) {
      const el = document.getElementById(elementId);
      if (!el || !el.textContent || el.textContent === '-') {
        return 0;
      }
      return parseFloat(el.textContent.replace(/[$,]/g, '')) || 0;
    }

    document.querySelectorAll('div[data-product-id]').forEach(row => {
      const productId = row.getAttribute('data-product-id');

      // Read the values of the component costs
      const fcaCostLocal = parseCurrency(`fca_cost_${productId}`);
      const cargoLoadCost = parseCurrency(`cargo_load_cost_${productId}`);
      const freightCost = parseCurrency(`freight_cost_${productId}`);
      const cargoUnloadCost = parseCurrency(`cargo_unload_cost_${productId}`);

      // Sum them to get the CIP cost
      const cipCost = fcaCostLocal + cargoLoadCost + freightCost + cargoUnloadCost;

      // Update the CIP Cost cell
      const cipCostCell = row.querySelector(`#cip_cost_${productId}`);
      if (cipCostCell) {
        cipCostCell.textContent = cipCost > 0 ? '$' + cipCost.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-';
      }
    });
  }
  window.updateCipCosts = updateCipCosts; // Expose to global scope

  // New function to calculate Import Taxes, Import Profit, and DAT Cost
  function updateFinalCosts() {
    const context = window.shipmentContext?.getCurrentContext();
    // This cost is context-dependent, so we do nothing if no context is set.
    if (!context) return;

    // Helper to parse currency values from text content
    function parseCurrency(elementId) {
      const el = document.getElementById(elementId);
      if (!el || !el.textContent || el.textContent === '-') {
        return 0;
      }
      return parseFloat(el.textContent.replace(/[$,]/g, '')) || 0;
    }

    // Determine the destination trader based on the current context
    const destinationTraderId = (context === 'departure') ? consigneeSelect.value : shipperSelect.value;
    
    let importTaxPct = 0;
    let importProfitPct = 0;

    if (destinationTraderId && window.traderData[destinationTraderId]) {
      const destinationTrader = window.traderData[destinationTraderId];
      importTaxPct = parseFloat(destinationTrader.import_taxes) || 0;
      importProfitPct = parseFloat(destinationTrader.import_profit_pct) || 0;
    }

    document.querySelectorAll('div[data-product-id]').forEach(row => {
      const productId = row.getAttribute('data-product-id');
      const cipCost = parseCurrency(`cip_cost_${productId}`);

      // Calculate Import Taxes and Profit
      const importTaxes = cipCost * (importTaxPct / 100);
      const importProfit = cipCost * (importProfitPct / 100);
      const datCost = cipCost + importTaxes;

      // Update the cells
      row.querySelector(`#import_taxes_${productId}`).textContent = importTaxes > 0 ? '$' + importTaxes.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-';
      row.querySelector(`#import_profit_${productId}`).textContent = importProfit > 0 ? '$' + importProfit.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-';
      row.querySelector(`#dat_cost_${productId}`).textContent = datCost > 0 ? '$' + datCost.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-';
      // --- DAT Kg/$ column logic ---
      const datKgCell = row.querySelector(`#dat_kg_usd_${productId}`);
      const totalWeightCell = row.querySelector(`#total_weight_${productId}`);
      let totalWeight = 0;
      if (totalWeightCell && totalWeightCell.textContent && totalWeightCell.textContent !== '-') {
        totalWeight = parseFloat(totalWeightCell.textContent.replace(/[^\d\.]/g, '')) || 0;
      }
      let datKgValue = (datCost > 0 && totalWeight > 0) ? (datCost / totalWeight) : 0;
      if (datKgCell) datKgCell.textContent = (datKgValue > 0) ? '$' + datKgValue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-';
      // --- DAT Ea/$ column logic ---
      const datEaCell = row.querySelector(`#dat_ea_usd_${productId}`);
      // Get units_per_pack from hidden column
      let unitsPerPack = 0;
      const unitsPerPackEl = row.querySelector(`#units_per_pack_${productId}`);
      if (unitsPerPackEl && unitsPerPackEl.textContent) {
        unitsPerPack = parseFloat(unitsPerPackEl.textContent) || 0;
      }
      if (!unitsPerPack || isNaN(unitsPerPack)) {
        unitsPerPack = 1;
      }
      // Get amount from input
      const amountInput = row.querySelector('input[name^="amount_"]');
      let amount = amountInput ? parseFloat(amountInput.value.replace(/,/g, '')) || 0 : 0;
      let denominator = amount * unitsPerPack;
      console.log(`DEBUG DAT Ea/$: productId=${productId}, datCost=${datCost}, amount=${amount}, unitsPerPack=${unitsPerPack}, denominator=${denominator}`);
      let datEaValue = (datCost > 0 && denominator > 0) ? (datCost / denominator) : 0;
      if (datEaCell) datEaCell.textContent = (datEaValue > 0) ? '$' + datEaValue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-';

      // --- Local Ea/$ column logic (displays the pre-fetched competitive price) ---
      try {
        const localEaCell = row.querySelector(`#lcal_ea_usd_${productId}`);
        const priceInput = row.querySelector(`input[name="price_to_compare_${productId}"]`);
        let priceToCompare = 0;

        if (priceInput) {
          priceToCompare = parseFloat(priceInput.value) || 0;
        }

        if (localEaCell) {
          // Only display the value if it's positive AND an amount has been entered for the product.
          localEaCell.textContent = (priceToCompare > 0 && amount > 0) ? priceToCompare.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-';
        }
      } catch (e) {
        console.error('Error calculating Local Ea/$:', e);
      }
    });
  }
  window.updateFinalCosts = updateFinalCosts; // Expose to global scope

  function updateProductTotals() {
    function sumCells(prefix) {
      let sum = 0;
      // The selector `[id^="${prefix}_"]` correctly targets individual product cells,
      // e.g., `[id^="total_weight_"]` gets `total_weight_1`, `total_weight_2`, etc.
      // It does NOT match the totals row cells like `total_total_weight`.
      document.querySelectorAll(`[id^="${prefix}_"]`).forEach(cell => {
        // Find the parent product row for the current cell.
        const productRow = cell.closest('div[data-product-id]');

        // Only add the cell's value to the sum if its parent row is visible.
        // A row is hidden by the filter by setting its display style to 'none'.
        if (productRow && productRow.style.display !== 'none') {
          let val = parseFloat((cell.textContent || '').replace(/[$,]/g, ''));
          if (!isNaN(val)) sum += val;
        }
      });
      return sum;
    }
    document.getElementById('total_total_weight').textContent = sumCells('total_weight').toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    document.getElementById('total_total_cost').textContent = '$' + sumCells('total_cost').toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    document.getElementById('total_taxes').textContent = '$' + sumCells('taxes').toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    document.getElementById('total_profit').textContent = '$' + sumCells('profit').toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    document.getElementById('total_fca_cost').textContent = '$' + sumCells('fca_cost').toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    document.getElementById('total_cargo_load_cost').textContent = '$' + sumCells('cargo_load_cost').toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    document.getElementById('total_freight_cost').textContent = '$' + sumCells('freight_cost').toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    document.getElementById('total_cargo_unload_cost').textContent = '$' + sumCells('cargo_unload_cost').toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    document.getElementById('total_cip_cost').textContent = '$' + sumCells('cip_cost').toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    document.getElementById('total_import_taxes').textContent = '$' + sumCells('import_taxes').toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    document.getElementById('total_import_profit').textContent = '$' + sumCells('import_profit').toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    document.getElementById('total_dat_cost').textContent = '$' + sumCells('dat_cost').toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
      // Local Ea/$ totals row
      // Sum all Local Ea/$ values for visible products
      let totalLocalEa = 0;
      document.querySelectorAll('[id^="lcal_ea_usd_"]').forEach(cell => {
        const productRow = cell.closest('div[data-product-id]');
        if (productRow && productRow.style.display !== 'none') {
          let val = parseFloat((cell.textContent || '').replace(/[$,]/g, ''));
          if (!isNaN(val)) totalLocalEa += val;
        }
      });
      document.getElementById('total_lcal_ea_usd').textContent = totalLocalEa > 0 ? totalLocalEa.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-';
  }

  // --- SUMMARY TABLE UPDATE FUNCTIONS ---
  function updateSummaryCosts() {
    const context = window.shipmentContext?.getCurrentContext();
    if (!context) return;

    // Helper to parse currency from an element's text content
    function parseCurrencyFromElement(elementId) {
        const el = document.getElementById(elementId);
        if (!el || !el.textContent || el.textContent === '-') {
            return 0;
        }
        return parseFloat(el.textContent.replace(/[$,]/g, '')) || 0;
    }

    // Calculate FCA Cost for the summary: Total Product Cost + Taxes
    const totalProductCost = parseCurrencyFromElement('total_total_cost');
    const totalTaxes = parseCurrencyFromElement('total_taxes');
    const fcaCost = totalProductCost + totalTaxes;
    const formattedFcaCost = fcaCost > 0 ? '$' + fcaCost.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-';

    // Calculate FCA Profit for the summary: Total Profit
    const totalProfit = parseCurrencyFromElement('total_profit');
    const formattedFcaProfit = totalProfit > 0 ? '$' + totalProfit.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-';

    // Calculate DAT Cost for the summary: Total CIP Cost + Total Import Taxes
    const totalCipCost = parseCurrencyFromElement('total_cip_cost');
    const totalImportTaxes = parseCurrencyFromElement('total_import_taxes');
    const datCost = totalCipCost + totalImportTaxes;
    const formattedDatCost = datCost > 0 ? '$' + datCost.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-';

    // Calculate DAT Profit for the summary: Total Import Profit
    const totalImportProfit = parseCurrencyFromElement('total_import_profit');
    const formattedDatProfit = totalImportProfit > 0 ? '$' + totalImportProfit.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-';

    // Update the correct cells in the summary table based on context
    const prefix = (context === 'departure') ? 'summary_dep' : 'summary_ret';
    const summaryFcaCostCell = document.getElementById(`${prefix}_fca_cost`);
    const summaryFcaProfitCell = document.getElementById(`${prefix}_fca_profit`);
    const summaryDatCostCell = document.getElementById(`${prefix}_dat_cost`);
    const summaryDatProfitCell = document.getElementById(`${prefix}_dat_profit`);

    if (summaryFcaCostCell) summaryFcaCostCell.textContent = formattedFcaCost;
    if (summaryFcaProfitCell) summaryFcaProfitCell.textContent = formattedFcaProfit;
    if (summaryDatCostCell) summaryDatCostCell.textContent = formattedDatCost;
    if (summaryDatProfitCell) summaryDatProfitCell.textContent = formattedDatProfit;
  }

  function recalcAll() {
    if (typeof updateFcaCosts === 'function') updateFcaCosts();
    if (typeof window.updateCargoLoadCost === 'function') window.updateCargoLoadCost();
    if (typeof window.updateDepartureAvgKgPL === 'function') window.updateDepartureAvgKgPL();
    if (typeof window.updateReturnAvgKgPL === 'function') window.updateReturnAvgKgPL();
    if (typeof window.updateCargoUnloadCosts === 'function') window.updateCargoUnloadCosts();
    if (typeof window.updateFreightCosts === 'function') window.updateFreightCosts();
    if (typeof updateCipCosts === 'function') updateCipCosts();
    if (typeof updateFinalCosts === 'function') updateFinalCosts();
    updateProductTotals();
    updateSummaryCosts(); // Update summary table costs after all calculations
  }
  window.recalcAll = recalcAll; // Expose to global scope for other scripts

  // --- EVENT LISTENERS ---
  document.querySelectorAll('input[type="number"][name^="amount_"]').forEach(input => {
    input.addEventListener('input', function() {
      if (typeof updateFinalCosts === 'function') updateFinalCosts();
    });
  });

  if (productTypeFilter) {
    productTypeFilter.addEventListener('change', function() {
      const selectedType = this.value;
      productRows.forEach(row => {
        row.style.display = (!selectedType || row.getAttribute('data-product-type') === selectedType) ? 'flex' : 'none';
      });
      // After hiding or showing rows, we must always recalculate the totals
      // to ensure they reflect only the visible items. This fixes the bug where
      // totals wouldn't update if a context (Departure/Return) wasn't set.
      recalcAll();
    });
  }

  function setHeaderColor(bg, color) {
    if (!header) return;
    header.style.background = bg;
    header.style.color = color;
    header.querySelectorAll('div').forEach(cell => {
      cell.style.background = bg;
      cell.style.color = color;
    });
  }

  async function fetchExchangeRate(currency) {
    try {
      const resp = await fetch(`/api/exchange/get_exchange_rate?currency=${currency}`);
      const data = await resp.json();
      return data.rate || null;
    } catch (e) {
      return null;
    }
  }

  async function handleAddCargo(context) {
    currentContext = context;
    setHeaderColor(context === 'departure' ? '#00bcd4' : '#4caf50', '#fff');
    restoreInputsForContext(context);
    enableAmountInputs();
    // Get the first non-USD currency from visible products
    let currency = 'USD';
    productRows.forEach(row => {
      if (row.style.display !== 'none') {
        const c = row.getAttribute('data-currency');
        if (c && c !== 'USD') currency = c;
      }
    });
    const rate = await fetchExchangeRate(currency);
    const currentExchangeRateInput = document.getElementById('current_exchange_rate');
    if (currentExchangeRateInput && rate) {
      currentExchangeRateInput.value = rate;
    }
  }

  if (depBtn) {
    depBtn.addEventListener('click', function() {
      handleAddCargo('departure');
    });
  }

  if (retBtn) {
    retBtn.addEventListener('click', function() {
      handleAddCargo('return');
    });
  }

  amountInputs.forEach(input => {
    input.addEventListener('input', function() {
      if (!currentContext) return;
      const productId = input.name.replace('amount_', '');
      productInputs[currentContext][productId] = parseFloat(input.value) || 0;
      recalcAll();
    });
    input.addEventListener('mousedown', function(e) {
      if (this.disabled) {
        alert('Please select "Add Cargo to" for Departure or Return before entering an amount.');
        e.preventDefault();
      }
    });
  });

  function updateAddCargoButtons() {
    const enabled = !!shipperSelect.value && !!consigneeSelect.value;
    if (depBtn) depBtn.disabled = !enabled;
    if (retBtn) retBtn.disabled = !enabled;
  }
  if (shipperSelect) shipperSelect.addEventListener('change', updateAddCargoButtons);
  if (consigneeSelect) consigneeSelect.addEventListener('change', updateAddCargoButtons);

  // --- INITIALIZATION ---
  disableAmountInputs();
  updateAddCargoButtons();
  recalcAll();

  // --- FCA Cost Tooltip Logic ---
  const tooltip = document.createElement('div');
  tooltip.id = 'fca-cost-tooltip';
  tooltip.classList.add('cost-tooltip');
  document.body.appendChild(tooltip);
  const fcaCostCells = document.querySelectorAll('[id^="fca_cost_"]');
  fcaCostCells.forEach(cell => {
    cell.addEventListener('mouseover', function(e) {
      const row = this.closest('div[data-product-id], div#product-totals-row');
      if (!row) return;
      const productId = row.getAttribute('data-product-id');
      let totalCost, taxes, profit;
      if (productId) {
        totalCost = document.getElementById(`total_cost_${productId}`)?.textContent || '-';
        taxes = document.getElementById(`taxes_${productId}`)?.textContent || '-';
        profit = document.getElementById(`profit_${productId}`)?.textContent || '-';
      } else {
        totalCost = document.getElementById('total_total_cost')?.textContent || '-';
        taxes = document.getElementById('total_taxes')?.textContent || '-';
        profit = document.getElementById('total_profit')?.textContent || '-';
      }

      // --- Dynamic Tooltip Coloring (to match CIP tooltip) ---
      const context = window.shipmentContext?.getCurrentContext();
      let tooltipColor = '#2196f3'; // Default/fallback color
      if (context === 'departure') {
        tooltipColor = '#00bcd4'; // Match departure context color
      } else if (context === 'return') {
        tooltipColor = '#4caf50'; // Match return context color
      }
      tooltip.style.borderColor = tooltipColor;
      tooltip.style.color = tooltipColor;

      tooltip.innerHTML = `<strong>Total Product Cost:</strong> ${totalCost}<br><strong>Taxes ($Local):</strong> ${taxes}<br><strong>Profit ($Local):</strong> ${profit}`;
      
      // Position the tooltip relative to the cell, not the mouse
      const rect = this.getBoundingClientRect();
      tooltip.style.left = `${rect.left + window.scrollX}px`;
      tooltip.style.top = `${rect.bottom + window.scrollY + 5}px`;
      tooltip.style.display = 'block';
    });
    cell.addEventListener('mouseout', () => { tooltip.style.display = 'none'; });
  });

  // --- CIP Cost Tooltip Logic ---
  const cipTooltip = document.createElement('div');
  cipTooltip.id = 'cip-cost-tooltip';
  cipTooltip.classList.add('cost-tooltip');
  document.body.appendChild(cipTooltip);

  const cipCostCells = document.querySelectorAll('.cip-tooltip-trigger');
  cipCostCells.forEach(cell => {
    cell.addEventListener('mouseover', function(e) {
      const row = this.closest('div[data-product-id], div#product-totals-row');
      if (!row) return;
      const productId = row.getAttribute('data-product-id');
      let fcaCostLocal, cargoLoadCost, freightCost, cargoUnloadCost;

      if (productId) {
        fcaCostLocal = document.getElementById(`fca_cost_${productId}`)?.textContent || '-';
        cargoLoadCost = document.getElementById(`cargo_load_cost_${productId}`)?.textContent || '-';
        freightCost = document.getElementById(`freight_cost_${productId}`)?.textContent || '-';
        cargoUnloadCost = document.getElementById(`cargo_unload_cost_${productId}`)?.textContent || '-';
      } else { // Totals row
        fcaCostLocal = document.getElementById('total_fca_cost')?.textContent || '-';
        cargoLoadCost = document.getElementById('total_cargo_load_cost')?.textContent || '-';
        freightCost = document.getElementById('total_freight_cost')?.textContent || '-';
        cargoUnloadCost = document.getElementById('total_cargo_unload_cost')?.textContent || '-';
      }
      
      // --- Dynamic Tooltip Coloring ---
      const context = window.shipmentContext?.getCurrentContext();
      let tooltipColor = '#2196f3'; // Default/fallback color
      if (context === 'departure') {
        tooltipColor = '#00bcd4'; // Match departure context color
      } else if (context === 'return') {
        tooltipColor = '#4caf50'; // Match return context color
      }
      // Set both the border and the font color for the values
      cipTooltip.style.borderColor = tooltipColor;
      cipTooltip.style.color = tooltipColor;

      cipTooltip.innerHTML = `<strong>FCA Cost ($Local):</strong> ${fcaCostLocal}<br><strong>Cargo Load Cost:</strong> ${cargoLoadCost}<br><strong>Freight Cost:</strong> ${freightCost}<br><strong>Cargo Unload Cost:</strong> ${cargoUnloadCost}`;
      
      // Position the tooltip relative to the cell
      const rect = this.getBoundingClientRect();
      cipTooltip.style.left = `${rect.left + window.scrollX}px`;
      cipTooltip.style.top = `${rect.bottom + window.scrollY + 5}px`;
      cipTooltip.style.display = 'block';
    });
    cell.addEventListener('mouseout', () => { cipTooltip.style.display = 'none'; });
  });

  // --- DAT Cost Tooltip Logic ---
  const datTooltip = document.createElement('div');
  datTooltip.id = 'dat-cost-tooltip';
  datTooltip.classList.add('cost-tooltip');
  document.body.appendChild(datTooltip);

  const datCostCells = document.querySelectorAll('.dat-tooltip-trigger');
  datCostCells.forEach(cell => {
    cell.addEventListener('mouseover', function(e) {
      const row = this.closest('div[data-product-id], div#product-totals-row');
      if (!row) return;
      const productId = row.getAttribute('data-product-id');
      let cipCost, importTaxes;

      if (productId) {
        cipCost = document.getElementById(`cip_cost_${productId}`)?.textContent || '-';
        importTaxes = document.getElementById(`import_taxes_${productId}`)?.textContent || '-';
      } else { // Totals row
        cipCost = document.getElementById('total_cip_cost')?.textContent || '-';
        importTaxes = document.getElementById('total_import_taxes')?.textContent || '-';
      }

      const context = window.shipmentContext?.getCurrentContext();
      let tooltipColor = '#2196f3'; // Default
      if (context === 'departure') tooltipColor = '#00bcd4';
      else if (context === 'return') tooltipColor = '#4caf50';
      datTooltip.style.borderColor = tooltipColor;
      datTooltip.style.color = tooltipColor;

      datTooltip.innerHTML = `<strong>CIP Cost:</strong> ${cipCost}<br><strong>Import Taxes:</strong> ${importTaxes}`;
      
      // Position the tooltip relative to the cell
      const rect = this.getBoundingClientRect();
      datTooltip.style.left = `${rect.left + window.scrollX}px`;
      datTooltip.style.top = `${rect.bottom + window.scrollY + 5}px`;
      datTooltip.style.display = 'block';
    });
    cell.addEventListener('mouseout', () => { datTooltip.style.display = 'none'; });
  });
});
