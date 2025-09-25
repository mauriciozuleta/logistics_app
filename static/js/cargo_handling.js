document.addEventListener('DOMContentLoaded', function() {
    // Helper to format numbers, now globally accessible within this file's scope
    function formatNumber(num) {
        return num ? num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-';
    }

    // --- Function to calculate Air Freight Cost ---
    // This function is now globally available to be called from other scripts.
    window.updateAirFreightCost = function() {
        const productTableContainer = document.getElementById('product-table-container');
        const totalFlightCostDisplay = document.getElementById('total_flight_cost_display');
        const footerTotalWeightCell = document.getElementById('footer-total-weight');

        if (!totalFlightCostDisplay || !footerTotalWeightCell || !productTableContainer) return;

        const totalFlightCost = parseFloat(totalFlightCostDisplay.textContent.replace(/[$,]/g, '')) || 0;
        const totalWeight = parseFloat(footerTotalWeightCell.textContent.replace(/[^\d.-]/g, '')) || 0;

        // This is the "temporary kg cost"
        const costPerKg = (totalWeight > 0) ? (totalFlightCost / totalWeight) : 0;

        // Iterate over each product row to calculate and update its air freight cost
        const rows = productTableContainer.querySelectorAll('tr');
        rows.forEach(row => {
            const productCode = row.querySelector('.product-amount-input')?.dataset.productCode;
            if (!productCode) return;

            const weightCell = document.getElementById(`total-weight-${productCode}`);
            const airFreightCostCell = document.getElementById(`air-freight-cost-${productCode}`);

            if (weightCell && airFreightCostCell) {
                const rowWeight = parseFloat(weightCell.textContent.replace(/[^\d.-]/g, '')) || 0;
                const airFreightCost = rowWeight * costPerKg;
                airFreightCostCell.textContent = (airFreightCost > 0) ? `$${formatNumber(airFreightCost)}` : '-';
            }
        });
    }
});