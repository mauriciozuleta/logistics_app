// --- Highlight products selected from the previous page ---
document.addEventListener('DOMContentLoaded', function() {
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
        const selectedProductIds = new Set(selectedProducts.map(p => String(p.prod_id))); // Ensure IDs are strings

        // Highlight the corresponding rows in the product table
        document.querySelectorAll('#product-cost-section div[data-product-id]').forEach(row => {
            const productId = row.getAttribute('data-product-id');
            if (selectedProductIds.has(productId)) {
                row.classList.add('product-selected');
                const checkbox = row.querySelector('input[type="checkbox"][name="selected_products"]');
                if (checkbox) {
                    checkbox.checked = true;
                }
            }
        });

        // Clear the selected_products from the draft so they aren't processed again on reload
        delete draft.selected_products;
        saveShipmentDraft(draft);
        console.log('Processed and cleared selected products from the draft.');
    }
});
// ...existing code...
const depBtn = document.getElementById('add_cargo_departure_btn');
const retBtn = document.getElementById('add_cargo_return_btn');


document.addEventListener('DOMContentLoaded', function() {
  const productTypeFilter = document.getElementById('product_type_filter');
  const productRows = document.querySelectorAll('#product-cost-section .product-cost-col > div[style*="display: flex"][data-product-type]');

  if (productTypeFilter) {
    productTypeFilter.addEventListener('change', function() {
      const selectedType = this.value;
      productRows.forEach(row => {
        if (!selectedType || row.getAttribute('data-product-type') === selectedType) {
          row.style.display = 'flex';
        } else {
          row.style.display = 'none';
        }
      });
    });
  }
});

// UI: Change product table header color on route selection
document.addEventListener('DOMContentLoaded', function() {
  const header = document.getElementById('product-list-header');
  const depBtn = document.getElementById('add_cargo_departure_btn');
  const retBtn = document.getElementById('add_cargo_return_btn');

  function setHeaderColor(bg, color) {
    if (!header) return;
    // Set background and color for the header container
    header.style.background = bg;
    header.style.color = color;
    // Set background and color for all header cells
    header.querySelectorAll('div').forEach(cell => {
      cell.style.background = bg;
      cell.style.color = color;
    });
  }

  if (depBtn && header) {
    depBtn.addEventListener('click', function() {
      setHeaderColor('#00bcd4', '#fff');
    });
  }
  if (retBtn && header) {
    retBtn.addEventListener('click', function() {
      setHeaderColor('#4caf50', '#fff');
    });
  }
});

// UI: Disable amount fields by default and show warning until route is selected
document.addEventListener('DOMContentLoaded', function() {
  const depBtn = document.getElementById('add_cargo_departure_btn');
  const retBtn = document.getElementById('add_cargo_return_btn');
  const amountInputs = document.querySelectorAll('input[type="number"][name^="amount_"]');

  // Disable all amount fields by default
  amountInputs.forEach(input => {
    input.disabled = true;

    // Show warning on mouse down (works even if input is disabled)
    input.addEventListener('mousedown', function(e) {
      if (input.disabled) {
        alert('Please select "Add Cargo to" for Departure or Return before entering an amount.');
        e.preventDefault();
      }
    });

    // Fallback for keyboard navigation
    input.addEventListener('focus', function(e) {
      if (input.disabled) {
        alert('Please select "Add Cargo to" for Departure or Return before entering an amount.');
        input.blur();
      }
    });
    input.addEventListener('keydown', function(e) {
      if (input.disabled) {
        alert('Please select "Add Cargo to" for Departure or Return before entering an amount.');
        e.preventDefault();
      }
    });
  });

  function enableAmountInputs() {
    amountInputs.forEach(input => input.disabled = false);
  }

  if (depBtn) depBtn.addEventListener('click', enableAmountInputs);
  if (retBtn) retBtn.addEventListener('click', enableAmountInputs);
});

// Calculate and update Cargo Load Cost for all product rows
document.addEventListener('DOMContentLoaded', function() {
  const depBtn = document.getElementById('add_cargo_departure_btn');
  const retBtn = document.getElementById('add_cargo_return_btn');
  const shipperSelect = document.getElementById('shipper');
  const consigneeSelect = document.getElementById('consignee');

  function updateAddCargoButtons() {
    const enabled = !!shipperSelect.value && !!consigneeSelect.value;
    if (depBtn) depBtn.disabled = !enabled;
    if (retBtn) retBtn.disabled = !enabled;
  }

  if (shipperSelect) shipperSelect.addEventListener('change', updateAddCargoButtons);
  if (consigneeSelect) consigneeSelect.addEventListener('change', updateAddCargoButtons);

  // Initial state
  updateAddCargoButtons();
});

// Context-aware productInputs: manages product amounts and exchange rate for each route context,
// restores values on context/filter switch, disables/enables inputs, and triggers recalculations.
document.addEventListener('DOMContentLoaded', function() {
  // --- Context-aware productInputs ---
  const productInputs = {
    departure: {},
    return: {},
    exchangeRate: 0
  };
  // Expose for other modules to access context-specific data
  window.shipmentContext = {
      productData: productInputs,
      getCurrentContext: () => currentContext
  };
  let currentContext = null; // "departure" or "return"

  const amountInputs = document.querySelectorAll('input[type="number"][name^="amount_"]');
  const exchangeRateInput = document.getElementById('exchange_rate');
  const depBtn = document.getElementById('add_cargo_departure_btn');
  const retBtn = document.getElementById('add_cargo_return_btn');
  const productTypeFilter = document.getElementById('product_type_filter');

  // Initialize both contexts with all products set to 0
  amountInputs.forEach(input => {
    const productId = input.name.replace('amount_', '');
    productInputs.departure[productId] = 0;
    productInputs.return[productId] = 0;
  });
  productInputs.exchangeRate = parseFloat(exchangeRateInput?.value) || 0;

  // Helper: restore input values for a context
 function restoreInputsForContext(context) {
    amountInputs.forEach(input => {
      const productId = input.name.replace('amount_', '');
      input.value = productInputs[context][productId] || 0;
    });
    if (exchangeRateInput) {
      exchangeRateInput.value = productInputs.exchangeRate || 0;
    }
    recalcAll(); // <-- Add this line
  }

  // Enable all amount inputs
  function enableAmountInputs() {
    amountInputs.forEach(input => input.disabled = false);
  }

  // Disable all amount inputs
  function disableAmountInputs() {
    amountInputs.forEach(input => input.disabled = true);
  }

  // Handle Add Cargo to Departure
  function triggerAllCalculations() {
    if (typeof updateFcaCosts === 'function') updateFcaCosts();
    if (typeof updateCargoLoadCost === 'function') updateCargoLoadCost();
    if (typeof updateDepartureAvgKgPL === 'function') updateDepartureAvgKgPL();
    if (typeof updateReturnAvgKgPL === 'function') updateReturnAvgKgPL();
    if (typeof updateCargoUnloadCosts === 'function') updateCargoUnloadCosts();
    if (typeof updateFreightCosts === 'function') updateFreightCosts();
    // Add other calculation functions as needed
  }

  if (depBtn) {
    depBtn.addEventListener('click', function() {
      currentContext = 'departure';
      restoreInputsForContext('departure');
      enableAmountInputs();
      triggerAllCalculations();
    });
  }
  if (retBtn) {
    retBtn.addEventListener('click', function() {
      currentContext = 'return';
      restoreInputsForContext('return');
      enableAmountInputs();
      triggerAllCalculations();
    });
  }

  // Store values in the correct context on input
  amountInputs.forEach(input => {
    input.addEventListener('input', function() {
      if (!currentContext) return;
      const productId = input.name.replace('amount_', '');
      productInputs[currentContext][productId] = parseFloat(input.value) || 0;
      recalcAll();
    });
  });

  // Store exchange rate globally
  if (exchangeRateInput) {
    exchangeRateInput.addEventListener('input', function() {
      productInputs.exchangeRate = parseFloat(exchangeRateInput.value) || 0;
      recalcAll();
    });
  }

  // On filter change, restore values for current context
  if (productTypeFilter) {
    productTypeFilter.addEventListener('change', function() {
      if (!currentContext) return;
      restoreInputsForContext(currentContext);
      recalcAll();
    });
  }

  // Disable amount inputs by default until a context is selected
  disableAmountInputs();

  // Optional: warn user if trying to edit amount before context is selected
  amountInputs.forEach(input => {
    input.addEventListener('mousedown', function(e) {
      if (input.disabled) {
        alert('Please select "Add Cargo to" for Departure or Return before entering an amount.');
        e.preventDefault();
      }
    });
    input.addEventListener('focus', function(e) {
      if (input.disabled) {
        alert('Please select "Add Cargo to" for Departure or Return before entering an amount.');
        input.blur();
      }
    });
    input.addEventListener('keydown', function(e) {
      if (input.disabled) {
        alert('Please select "Add Cargo to" for Departure or Return before entering an amount.');
        e.preventDefault();
      }
    });
  });

  // Dummy recalcAll function (replace with your actual calculation logic)
  function recalcAll() {
  if (typeof updateFcaCosts === 'function') updateFcaCosts();
  if (typeof updateCargoLoadCost === 'function') updateCargoLoadCost();
  if (typeof updateDepartureAvgKgPL === 'function') updateDepartureAvgKgPL();
  if (typeof updateReturnAvgKgPL === 'function') updateReturnAvgKgPL();
  if (typeof updateCargoUnloadCosts === 'function') updateCargoUnloadCosts();
  if (typeof updateFreightCosts === 'function') updateFreightCosts();
  // Add any other calculation functions here
  updateProductTotals()
  }

  // --- Freight Cost Calculation ---
  function updateFreightCosts() {
    const currentContext = window.shipmentContext?.getCurrentContext();

    // Helper to parse currency values from cells, handling '$', ',', and '/kg'
    function parseCostValue(element) {
        if (!element || !element.textContent || !element.textContent.includes('$')) {
            return 0;
        }
        // Remove '$', commas, and anything after '/'
        const cleanString = String(element.textContent).split('/')[0].replace(/[$,]/g, '');
        return parseFloat(cleanString) || 0;
    }

    // Determine which cells to use based on the current context
    const avgKgCellId = currentContext === 'departure' ? 'summary_dep_avg_kg' : 'summary_ret_avg_kg';
    const routeKgCostCellId = currentContext === 'departure' ? 'outbound_kg_cost' : 'return_kg_cost';

    const avgKgCell = document.getElementById(avgKgCellId);
    const routeKgCostCell = document.getElementById(routeKgCostCellId);

    const avgKgValue = parseCostValue(avgKgCell);
    const routeKgCostValue = parseCostValue(routeKgCostCell);

    // Use the higher of the two costs as the multiplier rate
    const freightRate = Math.max(avgKgValue, routeKgCostValue);

    // If the rate is invalid or zero, clear the column and exit
    if (freightRate <= 0) {
        document.querySelectorAll('[id^="freight_cost_"]').forEach(cell => {
            if (!cell.id.startsWith('total_')) cell.textContent = '-';
        });
        return;
    }

    document.querySelectorAll('div[data-product-id]').forEach(row => {
        const productId = row.getAttribute('data-product-id');
        const weightCell = document.getElementById(`total_weight_${productId}`);
        const freightCostCell = document.getElementById(`freight_cost_${productId}`);

        if (weightCell && freightCostCell) {
            // Parse weight, removing ' kg' and commas
            const weightValue = parseFloat(String(weightCell.textContent).replace(/,/g, '')) || 0;
            const freightCost = freightRate * weightValue;

            freightCostCell.textContent = freightCost > 0
                ? '$' + freightCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : '-';
        }
    });
  }
  window.updateFreightCosts = updateFreightCosts;

  // --- Cargo Unload Cost Calculation ---
  function updateCargoUnloadCosts() {
    const currentContext = window.shipmentContext?.getCurrentContext();
    if (!currentContext) return;

    // Determine destination airport based on the current context's selected route
    const firstLegRouteId = document.getElementById('first_leg_route').value;
    const secondLegRouteId = document.getElementById('second_leg_route').value;
    let destinationCity = '';

    if (currentContext === 'departure' && firstLegRouteId && window.routeData[firstLegRouteId]) {
        destinationCity = window.routeData[firstLegRouteId].toCity;
    } else if (currentContext === 'return' && secondLegRouteId && window.routeData[secondLegRouteId]) {
        destinationCity = window.routeData[secondLegRouteId].toCity;
    }

    // Find the destination airport's handling cost
    let handlingCostKg = 0;
    if (destinationCity && window.airportData) {
        for (const airportId in window.airportData) {
            const airport = window.airportData[airportId];
            if (airport.city && airport.city.toLowerCase().trim() === destinationCity.toLowerCase().trim()) {
                handlingCostKg = parseFloat(airport.cargo_handling_cost_kg) || 0;
                break;
            }
        }
    }

    // Calculate and update cost for each product row
    document.querySelectorAll('div[data-product-id]').forEach(row => {
        const productId = row.getAttribute('data-product-id');
        const weightCell = document.getElementById(`total_weight_${productId}`);
        const unloadCostCell = document.getElementById(`cargo_unload_cost_${productId}`);

        if (weightCell && unloadCostCell) {
            const weightValue = parseFloat(String(weightCell.textContent).replace(/,/g, '')) || 0;
            const unloadCost = weightValue * handlingCostKg;

            unloadCostCell.textContent = unloadCost > 0
                ? '$' + unloadCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : '-';
        }
    });
  }
  window.updateCargoUnloadCosts = updateCargoUnloadCosts;

  // Initial state: disable inputs, no context selected
  
  recalcAll();


function updateProductTotals() {
  // Helper to sum all cells by id prefix
  function sumCells(prefix) {
    let sum = 0;
    document.querySelectorAll(`[id^="${prefix}_"]`).forEach(cell => {
      // Remove $ and commas, parse as float
      let val = parseFloat((cell.textContent || '').replace(/[$,]/g, ''));
      if (!isNaN(val)) sum += val;
    });
    return sum;
  }

  // Update each total cell
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

});
