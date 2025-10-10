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
                rank = parseFloat((percentageCheaper / 10).toFixed(1));
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

        // Add/Update rank display next to amount input
        rows.forEach(row => {
            const amountInput = row.querySelector('.product-amount-input');
            if (!amountInput) return;

            const productCode = amountInput.dataset.productCode;
            const productData = rankedProducts.find(p => p.productCode === productCode);
            
            // Remove existing rank display if any
            let existingRank = amountInput.parentElement.querySelector('.rank-display');
            if (existingRank) {
                existingRank.remove();
            }

            if (productData) {
                const { rank } = productData;
                const rankDisplay = document.createElement('span');
                rankDisplay.className = 'rank-display';
                rankDisplay.textContent = `[${rank}]`;
                let color = 'cyan'; // Default for >6
                if (rank <= 2) color = 'red';
                else if (rank <= 3) color = 'orange';
                else if (rank <= 4) color = 'yellow';
                else if (rank <= 6) color = 'green';
                rankDisplay.style.color = color;
                rankDisplay.style.marginLeft = '5px';
                rankDisplay.style.fontWeight = 'bold';
                rankDisplay.style.fontSize = '0.9em';
                amountInput.parentElement.insertBefore(rankDisplay, amountInput.nextSibling);
            }
        });

        // --- New "Meet-in-the-Middle" Autofill Logic ---

        // Step 3: Initial Setup
        let currentTotalWeight = 0;
        const fillableProducts = rankedProducts.filter(p => p.rank > 2); // Products profitable enough to consider
        const excludedProducts = rankedProducts.filter(p => p.rank <= 2);
        const productAmounts = new Map(); // Use a map to store calculated amounts before setting them

        // Set amounts for all products to 0 initially
        rankedProducts.forEach(p => productAmounts.set(p.productCode, 0));
        excludedProducts.forEach(product => {
            productAmounts.set(product.productCode, 0);
        });

        // Step 4: "Meet-in-the-Middle" Allocation
        let topIndex = 0;
        let bottomIndex = fillableProducts.length - 1;
        const allocatedProducts = new Set();

        while (topIndex <= bottomIndex && currentTotalWeight < availablePayload) {
            // 1. Allocate for the TOP-ranked product
            const topProduct = fillableProducts[topIndex];
            if (topIndex <= bottomIndex && !allocatedProducts.has(topProduct.productCode)) {
                const weightToAllocate = Math.min(2500, availablePayload - currentTotalWeight);
                if (weightToAllocate <= 0) break;

                const amount = Math.floor(weightToAllocate / topProduct.packWeight);
                if (amount > 0) {
                    productAmounts.set(topProduct.productCode, amount);
                    currentTotalWeight += amount * topProduct.packWeight;
                    allocatedProducts.add(topProduct.productCode);
                }
            }
            topIndex++;

            // If top and bottom are the same product, don't process it twice
            if (topIndex > bottomIndex) break;

            // 2. Allocate for the BOTTOM-ranked product
            const bottomProduct = fillableProducts[bottomIndex];
            if (topIndex <= bottomIndex && !allocatedProducts.has(bottomProduct.productCode)) {
                // Ensure we allocate at least 500kg, but not more than the remaining payload
                const weightToAllocate = Math.min(500, availablePayload - currentTotalWeight);
                if (weightToAllocate <= 0) break;

                const amount = Math.floor(weightToAllocate / bottomProduct.packWeight);
                if (amount > 0) {
                    productAmounts.set(bottomProduct.productCode, amount);
                    currentTotalWeight += amount * bottomProduct.packWeight;
                    allocatedProducts.add(bottomProduct.productCode);
                }
            }
            bottomIndex--;
        }

        // Step 5: Final Top-Up phase to fill any small remaining gaps
        let remainingPayload = availablePayload - currentTotalWeight;
        console.log(`After meet-in-the-middle, remaining payload is: ${remainingPayload}`);

        // Sort by highest rank to prioritize top-up
        const topUpCandidates = fillableProducts.filter(p => allocatedProducts.has(p.productCode));
        topUpCandidates.sort((a, b) => b.rank - a.rank);

        let smallestPackWeight = Math.min(...topUpCandidates.map(p => p.packWeight).filter(w => w > 0));
        if (smallestPackWeight === Infinity) smallestPackWeight = 0;

        while (remainingPayload >= smallestPackWeight && smallestPackWeight > 0) {
            let itemAddedInLoop = false;
            for (const product of topUpCandidates) {
                const currentAmount = productAmounts.get(product.productCode) || 0;
                const currentWeight = currentAmount * product.packWeight;

                // Check if we can add one more pack without exceeding the 2500kg limit for this product
                if (remainingPayload >= product.packWeight && (currentWeight + product.packWeight) <= 2500) {
                    productAmounts.set(product.productCode, currentAmount + 1);
                    currentTotalWeight += product.packWeight;
                    remainingPayload -= product.packWeight;
                    itemAddedInLoop = true;
                    break; // Restart the loop to prioritize the highest-ranked products again
                }
            }
            if (!itemAddedInLoop) break; // No product could be added
        }

        // Final Step: Apply all calculated amounts to the DOM and trigger events
        console.log("Applying final amounts to DOM...");
        rows.forEach(row => {
            const amountInput = row.querySelector('.product-amount-input');
            if (amountInput && productAmounts.has(amountInput.dataset.productCode)) {
                amountInput.value = productAmounts.get(amountInput.dataset.productCode);
                amountInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });

        console.log("Auto-fill complete. Final total weight:", currentTotalWeight);
    }

    // Expose the function to the global window object so it can be called from shipment_management.js
    window.autoFillCargo = autoFillCargo;
});
