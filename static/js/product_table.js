document.addEventListener('DOMContentLoaded', function() {
    // --- CACHE DOM ELEMENTS ---
    const productTypeFilter = document.getElementById('product_type_filter');
    const productRows = document.querySelectorAll('#product-cost-section .product-cost-col > div[style*="display: flex"][data-product-type]');
    const header = document.getElementById('product-list-header');
    const depBtn = document.getElementById('add_cargo_departure_btn');
    const retBtn = document.getElementById('add_cargo_return_btn');
    const amountInputs = document.querySelectorAll('input[type="number"][name^="amount_"]');
    const shipperSelect = document.getElementById('shipper');
    const consigneeSelect = document.getElementById('consignee');
    const outboundPercentInput = document.getElementById('outbound_percent');
    const totalFlightCostElement = document.getElementById('total_flight_cost');
    const avgKgCell = document.getElementById('summary_dep_avg_kg');
    const exchangeRateInput = document.getElementById('exchange_rate');

    // --- LOCAL STORAGE & DRAFT LOGIC ---
    const SHIPMENT_DRAFT_KEY = 'shipmentDraft';

    function getShipmentDraft() {
        const data = localStorage.getItem(SHIPMENT_DRAFT_KEY);
        return data ? JSON.parse(data) : {};
    }
    function saveShipmentDraft(draft) {
        localStorage.setItem(SHIPMENT_DRAFT_KEY, JSON.stringify(draft));
    }

    // --- CONTEXT-AWARE PRODUCT DATA STORE ---
    const productInputs = {
        departure: {},
        return: {},
        exchangeRate: 0
    };
    let currentContext = null; // "departure" or "return"

    // --- INITIALIZATION ---

    // 1. Highlight products selected from the previous page
    const draft = getShipmentDraft();
    const selectedProducts = draft.selected_products;
    if (selectedProducts && Array.isArray(selectedProducts) && selectedProducts.length > 0) {
        console.log(`Found ${selectedProducts.length} products sent from the selection page.`);
        const selectedProductIds = new Set(selectedProducts.map(p => String(p.prod_id)));
        document.querySelectorAll('#product-cost-section div[data-product-id]').forEach(row => {
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
  const outboundPercentInput = document.getElementById('outbound_percent');
  const totalFlightCostElement = document.getElementById('total_flight_cost');
  const avgKgCell = document.getElementById('summary_dep_avg_kg');

  function getOutboundCost() {
    // Get outbound % and total flight cost
    const outboundVal = parseFloat(outboundPercentInput?.value) || 0;
    let totalFlightCost = 0;
    if (totalFlightCostElement && totalFlightCostElement.textContent && totalFlightCostElement.textContent !== 'N/A' && !totalFlightCostElement.textContent.includes('Error')) {
      totalFlightCost = parseFloat(totalFlightCostElement.textContent.replace(/[$,]/g, '')) || 0;
    }
    return totalFlightCost * (outboundVal / 100);
  }

  function getTotalProductWeight() {
    let totalWeightSum = 0;
    document.querySelectorAll('div[id^="total_weight_"]').forEach(cell => {
      if (cell.textContent && cell.textContent !== '-') {
        const match = cell.textContent.match(/([\d.,]+)\s*kg/);
        if (match) {
          let weightStr = match[1].replace(/,/g, ''); // Remove thousands separator
          const weight = parseFloat(weightStr) || 0;
          totalWeightSum += weight;
        }
      }
    });
    return totalWeightSum;
  }

  function updateAvgKgPerPL() {
    const outboundCost = getOutboundCost();
    const totalWeightSum = getTotalProductWeight();
    let avgKg = 0;
    if (totalWeightSum > 0) {
      avgKg = outboundCost / totalWeightSum;
    }
    if (avgKgCell) {
      avgKgCell.style.textAlign = 'center';
      avgKgCell.textContent = avgKg > 0
        ? '$' + avgKg.toLocaleString(undefined, {minimumFractionDigits: 3, maximumFractionDigits: 3})
        : '-';
    }
  }

  // Listen for changes in outbound %, total flight cost, and product weights
  if (outboundPercentInput) outboundPercentInput.addEventListener('input', updateAvgKgPerPL);
  if (totalFlightCostElement) new MutationObserver(updateAvgKgPerPL).observe(totalFlightCostElement, {childList: true, characterData: true, subtree: true});
  document.querySelectorAll('input[type="number"][name^="amount_"]').forEach(function(input) {
    input.addEventListener('input', updateAvgKgPerPL);
  });

  // Initial calculation
  updateAvgKgPerPL();
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
    if (typeof updateAvgKgPerPL === 'function') updateAvgKgPerPL();
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
  if (typeof updateAvgKgPerPL === 'function') updateAvgKgPerPL();
  // Add any other calculation functions here
  }

  // Initial state: disable inputs, no context selected
  recalcAll();
});

// Context-aware FCA cost calculation for each product row
