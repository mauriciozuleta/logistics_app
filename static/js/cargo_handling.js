document.addEventListener('DOMContentLoaded', function() {
    // Helper to format numbers, now globally accessible within this file's scope
    function formatNumber(num) {
        return num ? num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-';
    }

    // --- Function to calculate Air Freight Cost ---
    // This function is now globally available to be called from other scripts.
    window.updateAirFreightCost = function(context) {
        const productTableContainer = document.getElementById('product-table-container');
        if (!productTableContainer) return;
        let kgCost = 0;
        if (context === 'return') {
            const estRetKgCostField = document.getElementById('est_ret_kg_cost');
            if (estRetKgCostField) {
                kgCost = parseFloat(estRetKgCostField.value || estRetKgCostField.textContent || '0') || 0;
            }
        } else {
            const estOutbKgCostField = document.getElementById('est_outb_kg_cost');
            if (estOutbKgCostField) {
                kgCost = parseFloat(estOutbKgCostField.value || estOutbKgCostField.textContent || '0') || 0;
            }
        }
        const rows = productTableContainer.querySelectorAll('tr');
        rows.forEach(row => {
            const productCode = row.querySelector('.product-amount-input')?.dataset.productCode;
            if (!productCode) return;
            const weightCell = document.getElementById(`total-weight-${productCode}`);
            const airFreightCostCell = document.getElementById(`air-freight-cost-${productCode}`);
            if (weightCell && airFreightCostCell) {
                const rowWeight = parseFloat(weightCell.textContent.replace(/[^\d.-]/g, '')) || 0;
                const airFreightCost = rowWeight * kgCost;
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

    // --- Function to calculate Import Taxes and DAT Cost ---
    window.updateImportTaxesAndDAT = function(context) {
        const productTableContainer = document.getElementById('product-table-container');
        if (!productTableContainer || !context) return;

        // Determine which country's tax rates to use
        const shipperCountryInfo = document.getElementById('shipper_country_code');
        const consigneeCountryInfo = document.getElementById('consignee_country_code');

        let destinationCountryInfo;
        if (context === 'outbound') {
            destinationCountryInfo = consigneeCountryInfo;
        } else if (context === 'return') {
            destinationCountryInfo = shipperCountryInfo;
        } else {
            return; // No context, no calculation
        }

        const importTaxesPct = parseFloat(destinationCountryInfo.dataset.importTaxes) || 0;
        const importOtherTaxesPct = parseFloat(destinationCountryInfo.dataset.importOtherTaxes) || 0;
        const totalImportTaxRate = (importTaxesPct + importOtherTaxesPct) / 100;

        const rows = productTableContainer.querySelectorAll('tr');
        rows.forEach(row => {
            const productCode = row.querySelector('.product-amount-input')?.dataset.productCode;
            if (!productCode) return;

            const cipCostCell = document.getElementById(`cip-cost-${productCode}`);
            const importTaxesCell = document.getElementById(`import-taxes-${productCode}`);
            const datKgCostCell = document.getElementById(`dat-kg-cost-${productCode}`);
            const datEaCostCell = document.getElementById(`dat-ea-cost-${productCode}`);
            const comparativePriceCell = document.getElementById(`comparative-price-${productCode}`);
            const sugProfitCell = document.getElementById(`sug-prod-prof-${productCode}`);
            const weightCell = document.getElementById(`total-weight-${productCode}`);
            const amountInput = document.querySelector(`input[name="amount_${productCode}"]`);

            if (cipCostCell && importTaxesCell && datKgCostCell && datEaCostCell && comparativePriceCell && weightCell && amountInput) {
                const cipCost = parseFloat(cipCostCell.textContent.replace(/[$,]/g, '')) || 0;
                const totalWeight = parseFloat(weightCell.textContent.replace(/[^\d.-]/g, '')) || 0;
                const unitsPerPack = parseFloat(amountInput.dataset.unitsPerPack) || 1;

                const importTaxes = cipCost * totalImportTaxRate;
                const datCost = cipCost + importTaxes;
                const datKgCost = (totalWeight > 0) ? (datCost / totalWeight) : 0;

                // Calculate DAT EA. cost: (Total DAT Cost for the row) / (Total number of units)
                const amount = parseFloat(amountInput.value) || 0;
                const totalUnits = amount * unitsPerPack;
                const datEaCost = (totalUnits > 0) ? (datCost / totalUnits) : 0;

                importTaxesCell.textContent = (importTaxes > 0) ? `$${formatNumber(importTaxes)}` : '-';
                datKgCostCell.textContent = (datKgCost > 0) ? `$${formatNumber(datKgCost)}` : '-';
                datEaCostCell.textContent = (datEaCost > 0) ? `$${formatNumber(datEaCost)}` : '-';

                // --- Calculate "Total Pr. Cost DAT" ---
                const totalPrCostDatCell = document.getElementById(`total-pr-cost-dat-${productCode}`);
                if (totalPrCostDatCell) {
                    const totalPrCostDat = datKgCost * totalWeight;
                    totalPrCostDatCell.textContent = (totalPrCostDat > 0) ? `$${formatNumber(totalPrCostDat)}` : '-';
                    totalPrCostDatCell.style.textAlign = 'right'; // Align right for consistency
                }

                // --- New "Sug. Prod. Prof (EA)" Calculation ---
                if (sugProfitCell) {
                    const rankDisplay = amountInput.parentElement.querySelector('.rank-display');
                    const rank = rankDisplay ? parseFloat(rankDisplay.textContent.replace(/[\[\]]/g, '')) : 0;
                    const comparativePrice = parseFloat(comparativePriceCell.textContent.replace(/[$,]/g, '')) || 0;

                    let targetPriceMultiplier = 0;
                    let fontColor = 'grey';

                    if (rank > 6.0) {
                        targetPriceMultiplier = 0.60;
                        fontColor = 'green';
                    } else if (rank >= 5.1 && rank <= 6.0) {
                        targetPriceMultiplier = 0.70;
                        fontColor = 'yellow';
                    } else if (rank >= 3.0 && rank <= 5.0) {
                        targetPriceMultiplier = 0.75;
                        fontColor = 'orange';
                    }

                    if (targetPriceMultiplier > 0 && comparativePrice > 0 && datEaCost > 0) {
                        const targetSellPrice = comparativePrice * targetPriceMultiplier;
                        // Corrected Logic: Calculate profit based on DAT Kg Cost, not DAT Ea. Cost
                        const datKgCost = parseFloat(datKgCostCell.textContent.replace(/[$,]/g, '')) || 0;
                        const profitPerKg = targetSellPrice - datKgCost;
                        const profitPct = (datKgCost > 0) ? (profitPerKg / datKgCost) * 100 : 0;

                        sugProfitCell.innerHTML = `
                            <span style="color: ${fontColor}; font-weight: bold; white-space: nowrap;">
                                ${profitPct.toFixed(2)}% / $${targetSellPrice.toFixed(2)}
                            </span>
                            <span class="copy-profit-arrow" data-product-code="${productCode}" style="cursor: pointer; color: cyan; margin-left: 8px;" title="Copy to Product Profit %">➔</span>
                        `;
                    } else {
                        sugProfitCell.textContent = '-';
                    }
                }
            }
        });
    }
});