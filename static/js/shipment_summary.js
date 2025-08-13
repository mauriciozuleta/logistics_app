// Calculate and update Avg. Kg / P-L and related summary values
document.addEventListener('DOMContentLoaded', function() {
  // Inject airport data from Flask
  const airportData = window.airportData;
  const traderData = window.traderData;
  const shipperSelect = document.getElementById('shipper');

  // Helper to find the airport ID by city (case-insensitive)
  function getDepartureAirportIdByShipperCity() {
    const shipperId = shipperSelect.value;
    if (!shipperId || !traderData[shipperId]) return null;
    const shipperCity = traderData[shipperId].city;
    for (const airportId in airportData) {
      if (
        airportData[airportId].city &&
        airportData[airportId].city.toLowerCase().trim() === shipperCity.toLowerCase().trim()
      ) {
        return airportId;
      }
    }
    return null;
  }

  // Function to update Cargo Load Cost for all product rows
  function updateCargoLoadCost() {
    const departureAirportId = getDepartureAirportIdByShipperCity();
    let handlingCost = 0;
    if (departureAirportId && airportData[departureAirportId]) {
      handlingCost = parseFloat(airportData[departureAirportId].cargo_handling_cost_kg) || 0;
    }

    document.querySelectorAll('div[data-product-type]').forEach(function(row) {
      // Get total product weight from the corresponding cell
      const weightCell = row.querySelector('[id^="total_weight_"]');
      const cargoLoadCostCell = row.querySelector('[id^="cargo_load_cost_"]');
      let totalWeight = 0;
      if (weightCell && weightCell.textContent && weightCell.textContent !== '-') {
        const match = weightCell.textContent.match(/([\d.,]+)\s*kg/);
        if (match) {
          let weightStr = match[1].replace(/,/g, ''); // Remove thousands separator
          totalWeight = parseFloat(weightStr) || 0;
        }
      }
      const cargoLoadCost = totalWeight * handlingCost;
      if (cargoLoadCostCell) {
        cargoLoadCostCell.textContent = cargoLoadCost
          ? '$' + cargoLoadCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          : '-';
      }
    });
  }
  window.updateCargoLoadCost = updateCargoLoadCost; // Expose to global scope

  // Function to update Avg. Kg / P-L with color and restrictions
  function updateDepartureAvgKgPL() {
    // Helper to normalize numbers (US format)
    function normalizeNumber(str) {
      // Updated to handle '$' and commas
      return parseFloat(String(str).replace(/[$,]/g, '')) || 0;
    }

    // Helper to get total weight for the DEPARTURE context
    function getDepartureTotalWeight() {
      let totalWeight = 0;
      if (window.shipmentContext && window.shipmentContext.productData && window.shipmentContext.productData.departure) {
        const departureAmounts = window.shipmentContext.productData.departure;
        for (const productId in departureAmounts) {
          const amount = departureAmounts[productId];
          if (amount > 0) {
            const productRow = document.querySelector(`div[data-product-id="${productId}"]`);
            if (productRow) {
              const packWeight = parseFloat(productRow.getAttribute('data-pack-weight')) || 0;
              totalWeight += amount * packWeight;
            }
          }
        }
      }
      return totalWeight;
    }

    // Helper to get the calculated outbound cost, mirroring logic from product_table.js
    function getOutboundCost() {
        const outboundPercentInput = document.getElementById('outbound_percent');
        const totalFlightCostElement = document.getElementById('total_flight_cost');
        const outboundVal = normalizeNumber(outboundPercentInput?.value);
        const totalFlightCost = normalizeNumber(totalFlightCostElement?.textContent);
        return totalFlightCost * (outboundVal / 100);
    }

    const outboundCost = getOutboundCost();
    const totalProductWeight = getDepartureTotalWeight();

    // Correctly parse the target cargo load in KG from the label, not the percentage from the input
    const targetCargoLabel = document.getElementById('outbound_extra_label');
    let targetCargoLoadInKg = 0;
    if (targetCargoLabel && targetCargoLabel.textContent) {
      // Use textContent to strip out the inner <span> tag used for styling in shipment_form.js.
      // This makes the regex robust, as it now only has to parse the text, not the HTML.
      // e.g., it will parse "(5,000.00 kg)" correctly.
      const match = targetCargoLabel.textContent.match(/\(([\d,.]+)\s*kg\)/);
      if (match && match[1]) {
        targetCargoLoadInKg = normalizeNumber(match[1]);
      }
    }

    const availablePayloadStr = document.getElementById('first_leg_payload').textContent || '';
    const availablePayload = normalizeNumber(availablePayloadStr);

    // Calculate Avg. Kg / P-L using the correct cost-based logic
    let avgKgPL = 0;
    let displayValue = '-';
    if (totalProductWeight > 0) {
      avgKgPL = outboundCost / totalProductWeight;
      // Adopted currency formatting from product_table.js
      displayValue = '$' + avgKgPL.toLocaleString('en-US', {minimumFractionDigits: 3, maximumFractionDigits: 3});
    }

    // Restriction: Exceeding Available Payload
    if (totalProductWeight > availablePayload && availablePayload > 0) {
      displayValue = 'Exceeding Available P/L';
    }

    // Color logic
    let color = '#00bcd4'; // default row color for 'equal'
    // Only apply colors if we have valid weights to compare
    if (totalProductWeight > 0 && targetCargoLoadInKg > 0) {
      if (totalProductWeight < targetCargoLoadInKg) {
        color = '#ff4444'; // red
      } else if (totalProductWeight > targetCargoLoadInKg) {
        color = '#80d8acff'; // greenish
      }
    }

    // Update cell
    const cell = document.getElementById('summary_dep_avg_kg');
    if (cell) {
      cell.textContent = displayValue;
      cell.style.color = color;
    }
  }
  window.updateDepartureAvgKgPL = updateDepartureAvgKgPL; // Expose to global scope

  // Function to update Return Avg. Kg / P-L with color and restrictions
  function updateReturnAvgKgPL() {
    // Helper to normalize numbers (US format)
    function normalizeNumber(str) {
      return parseFloat(String(str).replace(/[$,]/g, '')) || 0;
    }

    // Helper to get total weight for the RETURN context
    function getReturnTotalWeight() {
      let totalWeight = 0;
      if (window.shipmentContext && window.shipmentContext.productData && window.shipmentContext.productData.return) {
        const returnAmounts = window.shipmentContext.productData.return;
        for (const productId in returnAmounts) {
          const amount = returnAmounts[productId];
          if (amount > 0) {
            const productRow = document.querySelector(`div[data-product-id="${productId}"]`);
            if (productRow) {
              const packWeight = parseFloat(productRow.getAttribute('data-pack-weight')) || 0;
              totalWeight += amount * packWeight;
            }
          }
        }
      }
      return totalWeight;
    }

    const returnTypeSelect = document.getElementById('return_type');
    const cell = document.getElementById('summary_ret_avg_kg');
    if (!cell || !returnTypeSelect) return;

    const returnType = returnTypeSelect.value;

    if (returnType === 'full') {
      cell.textContent = 'Not Compensated';
      cell.style.color = '#e0e0e0'; // Neutral text color
      return;
    }

    if (returnType !== 'compensated') {
      cell.textContent = '-';
      cell.style.color = '#4caf50'; // Default return route color
      return;
    }

    // --- Logic for 'compensated' return type ---
    function getReturnCost() {
      const returnPercentInput = document.getElementById('return_percent');
      const totalFlightCostElement = document.getElementById('total_flight_cost');
      const returnVal = normalizeNumber(returnPercentInput?.value);
      const totalFlightCost = normalizeNumber(totalFlightCostElement?.textContent);
      return totalFlightCost * (returnVal / 100);
    }

    const returnCost = getReturnCost();
    const totalProductWeight = getReturnTotalWeight();

    const targetCargoLabel = document.getElementById('return_extra_label');
    let targetCargoLoadInKg = 0;
    if (targetCargoLabel && targetCargoLabel.textContent) {
      const match = targetCargoLabel.textContent.match(/\(([\d,.]+)\s*kg\)/);
      if (match && match[1]) {
        targetCargoLoadInKg = normalizeNumber(match[1]);
      }
    }

    const availablePayloadStr = document.getElementById('second_leg_payload').textContent || '';
    const availablePayload = normalizeNumber(availablePayloadStr);

    let avgKgPL = 0;
    let displayValue = '-';
    if (totalProductWeight > 0 && returnCost > 0) {
      avgKgPL = returnCost / totalProductWeight;
      displayValue = '$' + avgKgPL.toLocaleString('en-US', {minimumFractionDigits: 3, maximumFractionDigits: 3});
    }

    if (totalProductWeight > availablePayload && availablePayload > 0) {
      displayValue = 'Exceeding Available P/L';
    }

    let color = '#4caf50'; // default return route color for 'equal'
    if (totalProductWeight > 0 && targetCargoLoadInKg > 0) {
      if (totalProductWeight < targetCargoLoadInKg) color = '#ff4444'; // red
      else if (totalProductWeight > targetCargoLoadInKg) color = '#80d8acff'; // greenish
    }

    cell.textContent = displayValue;
    cell.style.color = color;
  }
  window.updateReturnAvgKgPL = updateReturnAvgKgPL; // Expose to global scope

  // Event listeners for updating summary values
  if (shipperSelect) {
    shipperSelect.addEventListener('change', function() {
      updateCargoLoadCost();
      updateDepartureAvgKgPL();
    });
  }

  const outboundPercentInput = document.getElementById('outbound_percent');
  const outboundExtraInput = document.getElementById('outbound_extra');
  if (outboundPercentInput) {
    outboundPercentInput.addEventListener('input', updateDepartureAvgKgPL);
  }
  if (outboundExtraInput) {
    outboundExtraInput.addEventListener('input', updateDepartureAvgKgPL);
  }

  // Listeners for return route summary
  const returnTypeSelect = document.getElementById('return_type');
  const returnPercentInput = document.getElementById('return_percent');
  const returnExtraInput = document.getElementById('return_extra');

  if (returnTypeSelect) {
    returnTypeSelect.addEventListener('change', updateReturnAvgKgPL);
  }
  if (returnPercentInput) {
    returnPercentInput.addEventListener('input', updateReturnAvgKgPL);
  }
  if (returnExtraInput) {
    returnExtraInput.addEventListener('input', updateReturnAvgKgPL);
  }

  // Initial calculation
  updateCargoLoadCost();
  updateDepartureAvgKgPL();
  updateReturnAvgKgPL();
});