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
    document.querySelectorAll('input[type="number"][name^="amount_"]').forEach(input => {
      if (parseFloat(input.value) > 0) amountEntered = true;
    });
    const exchangeRate = parseFloat(exchangeRateInput?.value) || 0;
    if (amountEntered && exchangeRate <= 0) {
      flashElement(exchangeRateInput);
    }

    productRows.forEach(row => {
      const amountInput = row.querySelector('input[name^="amount_"]');
      if (!amountInput) return;
      const packWeight = parseFloat(row.getAttribute('data-pack-weight')) || 0;
      const packCost = parseFloat(row.getAttribute('data-pack-cost')) || 0;
      const amount = parseFloat(amountInput.value.replace(/,/g, '')) || 0;
      const totalWeight = amount * packWeight;
      const totalCost = amount * packCost;
      let taxPct = 0, profitPct = 0;
      const shipperId = shipperSelect ? shipperSelect.value : null;
      if (shipperId && window.traderData[shipperId]) {
        taxPct = parseFloat(window.traderData[shipperId].export_sales_tax) || 0;
        profitPct = parseFloat(window.traderData[shipperId].export_profit_pct) || 0;
      }
      const taxes = totalCost * (taxPct / 100);
      const profit = totalCost * (profitPct / 100);
      const fcaCost = totalCost + taxes + profit;
      const fcaCostUSD = (exchangeRate > 0) ? fcaCost / exchangeRate : 0;

      const weightCell = row.querySelector('[id^="total_weight_"]');
      const costCell = row.querySelector('[id^="total_cost_"]');
      const taxesCell = row.querySelector('[id^="taxes_"]');
      const profitCell = row.querySelector('[id^="profit_"]');
      const fcaCostCell = row.querySelector('[id^="fca_cost_"]');
      const fcaCostUSDCell = row.querySelector('[id^="fca_cost_usd_"]');
      if (weightCell) weightCell.textContent = totalWeight ? totalWeight.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' kg' : '-';
      if (costCell) costCell.textContent = totalCost ? '$' + totalCost.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-';
      if (taxesCell) taxesCell.textContent = taxes ? '$' + taxes.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-';
      if (profitCell) profitCell.textContent = profit ? '$' + profit.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-';
      if (fcaCostCell) fcaCostCell.textContent = fcaCost ? '$' + fcaCost.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-';
      if (fcaCostUSDCell) fcaCostUSDCell.textContent = fcaCostUSD ? '$' + fcaCostUSD.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-';
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

    // 1. Read the calculated Avg. Kg / P-L value
    const avgKgPl = parseCost('summary_dep_avg_kg');

    // 2. Read the calculated Outbound Kg. Cost value
    const outboundKgCost = parseCost('outbound_kg_cost');

    console.log(`Gathered data for freight cost: Avg. Kg/PL=${avgKgPl}, Outbound Kg Cost=${outboundKgCost}`);

    // 3. Loop through each product row
    document.querySelectorAll('div[data-product-id]').forEach(row => {
      const productId = row.getAttribute('data-product-id');
      const totalWeight = parseCost(`total_weight_${productId}`);

      // --- Part 3: Conditional Calculation Logic ---
      const freightCostCell = row.querySelector(`#freight_cost_${productId}`);
      if (freightCostCell) {
        if (totalWeight > 0 && (avgKgPl > 0 || outboundKgCost > 0)) {
          // Use the higher of the two rates as the final rate
          const finalRate = Math.max(avgKgPl, outboundKgCost);
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
      const fcaCostUSD = parseCurrency(`fca_cost_usd_${productId}`);
      const cargoLoadCost = parseCurrency(`cargo_load_cost_${productId}`);
      const freightCost = parseCurrency(`freight_cost_${productId}`);
      const cargoUnloadCost = parseCurrency(`cargo_unload_cost_${productId}`);

      // Sum them to get the CIP cost
      const cipCost = fcaCostUSD + cargoLoadCost + freightCost + cargoUnloadCost;

      // Update the CIP Cost cell
      const cipCostCell = row.querySelector(`#cip_cost_${productId}`);
      if (cipCostCell) {
        cipCostCell.textContent = cipCost > 0 ? '$' + cipCost.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-';
      }
    });
  }
  window.updateCipCosts = updateCipCosts; // Expose to global scope

  function updateProductTotals() {
    function sumCells(prefix) {
      let sum = 0;
      document.querySelectorAll(`[id^="${prefix}_"]`).forEach(cell => {
        if (cell.id.startsWith('total_total_')) return; // Exclude the total cell itself
        let val = parseFloat((cell.textContent || '').replace(/[$,]/g, ''));
        if (!isNaN(val)) sum += val;
      });
      return sum;
    }
    document.getElementById('total_total_weight').textContent = sumCells('total_weight').toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    document.getElementById('total_total_cost').textContent = '$' + sumCells('total_cost').toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    document.getElementById('total_taxes').textContent = '$' + sumCells('taxes').toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    document.getElementById('total_profit').textContent = '$' + sumCells('profit').toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    document.getElementById('total_fca_cost').textContent = '$' + sumCells('fca_cost').toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    document.getElementById('total_fca_cost_usd').textContent = '$' + sumCells('fca_cost_usd').toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    document.getElementById('total_cargo_load_cost').textContent = '$' + sumCells('cargo_load_cost').toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    document.getElementById('total_freight_cost').textContent = '$' + sumCells('freight_cost').toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    document.getElementById('total_cargo_unload_cost').textContent = '$' + sumCells('cargo_unload_cost').toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    document.getElementById('total_cip_cost').textContent = '$' + sumCells('cip_cost').toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    document.getElementById('total_import_taxes').textContent = '$' + sumCells('import_taxes').toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    document.getElementById('total_import_profit').textContent = '$' + sumCells('import_profit').toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    document.getElementById('total_dat_cost').textContent = '$' + sumCells('dat_cost').toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
  }

  function recalcAll() {
    if (typeof updateFcaCosts === 'function') updateFcaCosts();
    if (typeof window.updateCargoLoadCost === 'function') window.updateCargoLoadCost();
    if (typeof window.updateDepartureAvgKgPL === 'function') window.updateDepartureAvgKgPL();
    if (typeof window.updateReturnAvgKgPL === 'function') window.updateReturnAvgKgPL();
    if (typeof window.updateCargoUnloadCosts === 'function') window.updateCargoUnloadCosts();
    if (typeof window.updateFreightCosts === 'function') window.updateFreightCosts();
    if (typeof updateCipCosts === 'function') updateCipCosts();
    updateProductTotals();
  }

  // --- EVENT LISTENERS ---
  if (productTypeFilter) {
    productTypeFilter.addEventListener('change', function() {
      const selectedType = this.value;
      productRows.forEach(row => {
        row.style.display = (!selectedType || row.getAttribute('data-product-type') === selectedType) ? 'flex' : 'none';
      });
      if (currentContext) restoreInputsForContext(currentContext);
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

  if (depBtn) {
    depBtn.addEventListener('click', function() {
      currentContext = 'departure';
      setHeaderColor('#00bcd4', '#fff');
      restoreInputsForContext('departure');
      enableAmountInputs();
    });
  }

  if (retBtn) {
    retBtn.addEventListener('click', function() {
      currentContext = 'return';
      setHeaderColor('#4caf50', '#fff');
      restoreInputsForContext('return');
      enableAmountInputs();
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
      tooltip.innerHTML = `<strong>Total Product Cost:</strong> ${totalCost}<br><strong>Taxes ($Local):</strong> ${taxes}<br><strong>Profit ($Local):</strong> ${profit}`;
      tooltip.style.display = 'block';
    });
    cell.addEventListener('mouseout', () => { tooltip.style.display = 'none'; });
    cell.addEventListener('mousemove', e => { tooltip.style.left = (e.pageX + 15) + 'px'; tooltip.style.top = (e.pageY + 15) + 'px'; });
  });
});
