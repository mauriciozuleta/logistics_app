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
      return parseFloat(str.replace(/,/g, '')) || 0;
    }

    const outboundPercent = normalizeNumber(document.getElementById('outbound_percent').value);
    const totalProductWeight = normalizeNumber(document.getElementById('total_total_weight').textContent);
    const targetCargoLoad = normalizeNumber(document.getElementById('outbound_extra').value);
    const availablePayloadStr = document.getElementById('first_leg_payload').textContent || '';
    const availablePayload = normalizeNumber(availablePayloadStr);

    // Calculate Avg. Kg / P-L
    let avgKgPL = 0;
    let displayValue = '-';
    if (totalProductWeight > 0) {
      avgKgPL = outboundPercent / totalProductWeight;
      displayValue = avgKgPL.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    }

    // Restriction: Exceeding Available Payload
    if (totalProductWeight > availablePayload && availablePayload > 0) {
      displayValue = 'Exceeding Available P/L';
    }

    // Color logic
    let color = '#00bcd4'; // default
    if (totalProductWeight < targetCargoLoad) {
      color = '#ff4444'; // red
    } else if (totalProductWeight > targetCargoLoad) {
      color = '#80d8acff'; // greenish
    }

    // Update cell
    const cell = document.getElementById('summary_dep_avg_kg');
    if (cell) {
      cell.textContent = displayValue;
      cell.style.color = color;
    }
  }
  window.updateDepartureAvgKgPL = updateDepartureAvgKgPL; // Expose to global scope

  // Event listeners for updating summary values
  if (shipperSelect) {
    shipperSelect.addEventListener('change', function() {
      updateCargoLoadCost();
      updateDepartureAvgKgPL();
    });
  }
  document.querySelectorAll('input[type="number"][name^="amount_"]').forEach(function(input) {
    input.addEventListener('input', function() {
      updateCargoLoadCost();
      updateDepartureAvgKgPL();
    });
  });

  const outboundPercentInput = document.getElementById('outbound_percent');
  const outboundExtraInput = document.getElementById('outbound_extra');
  if (outboundPercentInput) {
    outboundPercentInput.addEventListener('input', updateDepartureAvgKgPL);
  }
  if (outboundExtraInput) {
    outboundExtraInput.addEventListener('input', updateDepartureAvgKgPL);
  }
  const totalWeightCell = document.getElementById('total_total_weight');
  if (totalWeightCell) {
    totalWeightCell.addEventListener('DOMSubtreeModified', updateDepartureAvgKgPL);
  }
  const firstLegPayloadCell = document.getElementById('first_leg_payload');
  if (firstLegPayloadCell) {
    firstLegPayloadCell.addEventListener('DOMSubtreeModified', updateDepartureAvgKgPL);
  }

  // Initial calculation
  updateCargoLoadCost();
  updateDepartureAvgKgPL();
});