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
          ? '$' + cargoLoadCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          : '-';
      }
    });
  }

  // Update when shipper changes or when product amounts change
  if (shipperSelect) {
    shipperSelect.addEventListener('change', updateCargoLoadCost);
  }
  document.querySelectorAll('input[type="number"][name^="amount_"]').forEach(function(input) {
    input.addEventListener('input', updateCargoLoadCost);
  });

  // Initial calculation
  updateCargoLoadCost();
});
