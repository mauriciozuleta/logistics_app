document.addEventListener('DOMContentLoaded', function() {
    // Helper to format numbers, now globally accessible within this file's scope
    function formatNumber(num) {
        return num ? num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-';
    }

    // --- Function to calculate Air Freight Cost ---
    // This function is now globally available to be called from other scripts.
    window.updateAirFreightCost = function(context) {
        const productTableContainer = document.getElementById('product-table-container');
        const footerTotalWeightCell = document.getElementById('footer-total-weight');

        // Determine which cost value to use based on the context
        let costSourceElement;
        if (context === 'outbound') {
            costSourceElement = document.getElementById('outbound_cost_weight_value');
        } else if (context === 'return') {
            costSourceElement = document.getElementById('return_cost_weight_value');
        } else {
            // If no context is set, we cannot calculate the cost.
            return; 
        }

        if (!costSourceElement || !footerTotalWeightCell || !productTableContainer) return;

        // The value is from an <input>, so we use .value instead of .textContent
        const relevantFlightCost = parseFloat(costSourceElement.value.replace(/[$,]/g, '')) || 0;
        const totalWeight = parseFloat(footerTotalWeightCell.textContent.replace(/[^\d.-]/g, '')) || 0;

        // This is the "temporary kg cost"
        const costPerKg = (totalWeight > 0) ? (relevantFlightCost / totalWeight) : 0;

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

    // --- Function to calculate Cargo Load Cost ---
    // This function is now globally available to be called from other scripts.
    window.updateCargoLoadCost = function(context, handlingCost) {
        const productTableContainer = document.getElementById('product-table-container');
        if (!productTableContainer || !context || handlingCost === undefined) return;

        console.log(`Updating Cargo Load Cost for context: ${context} with cost/kg: ${handlingCost}`);

        // Iterate over each product row to calculate and update its cargo load cost
        const rows = productTableContainer.querySelectorAll('tr');
        rows.forEach(row => {
            const productCode = row.querySelector('.product-amount-input')?.dataset.productCode;
            if (!productCode) return;

            const weightCell = document.getElementById(`total-weight-${productCode}`);
            const cargoLoadCostCell = document.getElementById(`cargo-load-cost-${productCode}`);

            if (weightCell && cargoLoadCostCell) {
                const rowWeight = parseFloat(weightCell.textContent.replace(/[^\d.-]/g, '')) || 0;
                
                // Calculate the cost for the row
                const cargoLoadCost = rowWeight * handlingCost;

                // Update the cell
                cargoLoadCostCell.textContent = (cargoLoadCost > 0) ? `$${formatNumber(cargoLoadCost)}` : '-';
            }
        });
    }

    // --- Function to calculate Cargo Unload Cost ---
    // This function is globally available to be called from other scripts.
    window.updateCargoUnloadCost = function(context, handlingCost) {
        const productTableContainer = document.getElementById('product-table-container');
        if (!productTableContainer || !context || handlingCost === undefined) return;

        console.log(`Updating Cargo Unload Cost for context: ${context} with cost/kg: ${handlingCost}`);

        // Iterate over each product row to calculate and update its cargo unload cost
        const rows = productTableContainer.querySelectorAll('tr');
        rows.forEach(row => {
            const productCode = row.querySelector('.product-amount-input')?.dataset.productCode;
            if (!productCode) return;

            const weightCell = document.getElementById(`total-weight-${productCode}`);
            const cargoUnloadCostCell = document.getElementById(`cargo-unload-cost-${productCode}`);

            if (weightCell && cargoUnloadCostCell) {
                const rowWeight = parseFloat(weightCell.textContent.replace(/[^\d.-]/g, '')) || 0;
                const cargoUnloadCost = rowWeight * handlingCost;
                cargoUnloadCostCell.textContent = (cargoUnloadCost > 0) ? `$${formatNumber(cargoUnloadCost)}` : '-';
            }
        });
    }

    // --- Function to calculate CIP Cost ---
    // This function is globally available to be called from other scripts.
    window.updateCipCost = function() {
        const productTableContainer = document.getElementById('product-table-container');
        if (!productTableContainer) return;

        // Helper to parse numbers from cells
        const parseNumberFromCell = (cell) => {
            if (!cell || !cell.textContent) return 0;
            return parseFloat(cell.textContent.replace(/[$,]/g, '')) || 0;
        };

        const rows = productTableContainer.querySelectorAll('tr');
        rows.forEach(row => {
            const productCode = row.querySelector('.product-amount-input')?.dataset.productCode;
            if (!productCode) return;

            const fcaUsd = parseNumberFromCell(document.getElementById(`fca-usd-${productCode}`));
            const cargoLoadCost = parseNumberFromCell(document.getElementById(`cargo-load-cost-${productCode}`));
            const airFreightCost = parseNumberFromCell(document.getElementById(`air-freight-cost-${productCode}`));
            const cargoUnloadCost = parseNumberFromCell(document.getElementById(`cargo-unload-cost-${productCode}`));

            const cipCost = fcaUsd + cargoLoadCost + airFreightCost + cargoUnloadCost;

            const cipCostCell = document.getElementById(`cip-cost-${productCode}`);
            if (cipCostCell) {
                cipCostCell.textContent = (cipCost > 0) ? `$${formatNumber(cipCost)}` : '-';
            }
        });
    }
});