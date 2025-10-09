// static/js/autofill_cargo.js
document.addEventListener('DOMContentLoaded', function() {
    console.log("autofill_cargo.js loaded");

    function parseNumber(val) {
        if (!val) return 0;
        return parseFloat(val.toString().replace(/[$,]/g, '')) || 0;
    }

    async function autoFillCargo(context) {
        console.log(`Starting auto-fill for ${context} cargo...`);

        const productTableContainer = document.getElementById('product-table-container');
        if (!productTableContainer) {
            console.error("Product table container not found.");
            return;
        }

        const availablePayloadEl = context === 'outbound' ? document.getElementById('available_payload') : document.getElementById('available_payload_return');
        const availablePayload = parseNumber(availablePayloadEl.value);

        if (availablePayload <= 0) {
            console.warn("Available payload is 0 or not set. Aborting auto-fill.");
            return;
        }

        const rows = Array.from(productTableContainer.querySelectorAll('tr'));
        if (rows.length === 0) {
            console.warn("No products in the table to auto-fill.");
            return;
        }

        // Step 1: Set all amounts to 1 and trigger calculations to get initial costs.
        // We need to wait for these calculations to complete.
        const calculationPromises = rows.map(row => {
            return new Promise(resolve => {
                const amountInput = row.querySelector('.product-amount-input');
                if (amountInput) {
                    amountInput.value = 1;
                    // Dispatch an input event to trigger all calculations for the row.
                    amountInput.dispatchEvent(new Event('input', { bubbles: true }));
                }
                // Give a short timeout for the DOM to update and calculations to run.
                setTimeout(resolve, 50);
            });
        });

        await Promise.all(calculationPromises);
        console.log("Initial calculations complete. All amounts set to 1.");

        // Step 2: Rank products
        let rankedProducts = [];
        rows.forEach(row => {
            const productCode = row.querySelector('.product-amount-input')?.dataset.productCode;
            if (!productCode) return;

            const datKgCostEl = document.getElementById(`dat-kg-cost-${productCode}`);
            const comparativePriceEl = document.getElementById(`comparative-price-${productCode}`);
            const packWeight = parseFloat(row.querySelector('.product-amount-input').dataset.packWeight) || 0;

            const datKgCost = parseNumber(datKgCostEl.textContent);
            const comparativePrice = parseNumber(comparativePriceEl.textContent);

            let rank = 0;
            if (comparativePrice > 0 && datKgCost > 0 && datKgCost < comparativePrice) {
                const percentageCheaper = (1 - (datKgCost / comparativePrice)) * 100;
                rank = Math.floor(percentageCheaper / 10);
            }

            if (packWeight > 0) {
                rankedProducts.push({
                    productCode,
                    rank,
                    packWeight,
                    row
                });
            }
        });

        // Sort products from highest rank to lowest
        rankedProducts.sort((a, b) => b.rank - a.rank);
        console.log("Ranked products:", rankedProducts);

        // Step 3: Iteratively fill payload
        let currentTotalWeight = 0;
        rankedProducts.forEach(product => {
            const { rank, packWeight, row } = product;
            const amountInput = row.querySelector('.product-amount-input');
            if (!amountInput) return;

            // Determine max weight for this product based on its rank (500kg to 2500kg)
            const maxWeightForProduct = 500 + (rank / 10) * (2500 - 500);

            // Determine available weight for this product
            const remainingPayload = availablePayload - currentTotalWeight;
            const weightAllowance = Math.min(maxWeightForProduct, remainingPayload);

            let amount = 0;
            if (weightAllowance > 0 && packWeight > 0) {
                amount = Math.floor(weightAllowance / packWeight);
            }

            amountInput.value = amount;
            // We'll dispatch the event after the top-up phase
            currentTotalWeight += amount * packWeight;
        });

        console.log("After initial distribution, weight is:", currentTotalWeight);

        // Step 4: Top-up phase to fill remaining payload
        let remainingPayload = availablePayload - currentTotalWeight;
        let smallestPackWeight = Math.min(...rankedProducts.map(p => p.packWeight).filter(w => w > 0));

        while (remainingPayload >= smallestPackWeight) {
            let itemAddedInLoop = false;
            for (const product of rankedProducts) {
                const { packWeight, row } = product;
                if (packWeight > 0 && remainingPayload >= packWeight) {
                    const amountInput = row.querySelector('.product-amount-input');
                    let currentAmount = parseInt(amountInput.value, 10) || 0;
                    
                    amountInput.value = currentAmount + 1;
                    currentTotalWeight += packWeight;
                    remainingPayload -= packWeight;
                    
                    itemAddedInLoop = true;
                    break; // Restart with the highest-ranked product
                }
            }
            if (!itemAddedInLoop) {
                break; // No product could fit in the remaining space
            }
        }

        // Step 5: Trigger all input events at the end
        rows.forEach(row => {
            const amountInput = row.querySelector('.product-amount-input');
            if (amountInput) {
                amountInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });

        console.log("Auto-fill complete. Final total weight:", currentTotalWeight);
    }

    // Expose the function to the global window object so it can be called from shipment_management.js
    window.autoFillCargo = autoFillCargo;
});
