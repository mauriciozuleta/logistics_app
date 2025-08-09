document.addEventListener('DOMContentLoaded', function() {
    const SHIPMENT_DRAFT_KEY = 'shipmentDraft';

    // Helper to get the current draft object from localStorage
    function getShipmentDraft() {
        const data = localStorage.getItem(SHIPMENT_DRAFT_KEY);
        return data ? JSON.parse(data) : {};
    }

    // Helper to save the draft object to localStorage
    function saveShipmentDraft(draft) {
        localStorage.setItem(SHIPMENT_DRAFT_KEY, JSON.stringify(draft));
    }

    /**
     * Main function triggered by the "Send to Shipment" button.
     * It collects products, shows a confirmation modal, and then saves/redirects.
     */
    function showConfirmationAndSend() {
        // 1. Collect data from all selected products in the table.
        const selectedProducts = collectSelectedProductData();

        if (selectedProducts.length === 0) {
            alert('Please select at least one product to add to the shipment.');
            return;
        }

        // 2. Create a temporary draft object for display in the modal.
        const draft = getShipmentDraft();
        // Use a temporary key to avoid overwriting the main draft until confirmed.
        const tempDraft = JSON.parse(JSON.stringify(draft)); // Deep copy
        if (!tempDraft.selected_products) {
            tempDraft.selected_products = [];
        }
        // Add only the newly selected products for display
        tempDraft.newly_selected_products = selectedProducts;

        // 3. Get modal elements
        const modal = document.getElementById('product-confirmation-modal');
        const modalContent = document.getElementById('product-modal-data-content');
        const confirmBtn = document.getElementById('product-modal-confirm-btn');
        const cancelBtn = document.getElementById('product-modal-cancel-btn');

        if (!modal || !modalContent || !confirmBtn || !cancelBtn) {
            console.error('Product confirmation modal elements not found!');
            // Fallback for safety: save and redirect without confirmation
            if (!draft.selected_products) draft.selected_products = [];
            draft.selected_products.push(...selectedProducts);
            saveShipmentDraft(draft);
            window.location.href = '/operations/add-shipment';
            return;
        }

        // 4. Populate Modal
        modalContent.innerHTML = formatDataForProductModal(tempDraft);

        // 5. Show Modal
        modal.style.display = 'block';

        // 6. Handle Actions
        confirmBtn.onclick = () => {
            modal.style.display = 'none';
            // Save the final draft and redirect
            if (!draft.selected_products) draft.selected_products = [];
            draft.selected_products.push(...selectedProducts);
            saveShipmentDraft(draft);
            console.log('Products confirmed and added to draft. Redirecting...');
            window.location.href = '/operations/add-shipment'; // Adjust URL if necessary
        };

        cancelBtn.onclick = () => {
            modal.style.display = 'none';
        };
    }

    /**
     * Formats the draft data into HTML for the product confirmation modal.
     * @param {object} draft - The shipment draft object.
     * @returns {string} HTML string to be injected into the modal.
     */
    function formatDataForProductModal(draft) {
        let html = '<table style="width: 100%; border-collapse: collapse;">';
        
        // Display core shipment info
        html += `
            <tr style="border-bottom: 1px solid #3a3e45;">
                <td style="padding: 8px; font-weight: bold; color: #aaa; width: 40%;">Shipment Reference</td>
                <td style="padding: 8px; color: #fff;">${draft.shipment_reference || 'N/A'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #3a3e45;">
                <td style="padding: 8px; font-weight: bold; color: #aaa; width: 40%;">Aircraft</td>
                <td style="padding: 8px; color: #fff;">${draft.available_aircraft || 'N/A'}</td>
            </tr>
        `;

        // Separator
        html += `<tr><td colspan="2" style="padding: 15px 0 5px 0; font-weight: bold; color: #FF5C00; font-size: 1.1em;">Products to be Added:</td></tr>`;

        // Display newly selected products
        if (draft.newly_selected_products && draft.newly_selected_products.length > 0) {
            html += '<tr><td colspan="2" style="padding: 8px;">';
            html += '<table style="width: 100%; border-collapse: collapse; background: #1e2228;">';
            html += '<thead><tr style="color: #ccc; font-size: 0.9em; text-align: left;"><th style="padding: 5px;">ID</th><th style="padding: 5px;">Name</th><th style="padding: 5px;">Pack Weight</th></tr></thead>';
            html += '<tbody>';
            draft.newly_selected_products.forEach(p => {
                html += `<tr style="border-top: 1px solid #3a3e45;">
                            <td style="padding: 5px;">${p.prod_id || '-'}</td>
                            <td style="padding: 5px;">${p.prod_name || '-'}</td>
                            <td style="padding: 5px;">${p.prod_pack_weight || '-'}</td>
                         </tr>`;
            });
            html += '</tbody></table>';
            html += '</td></tr>';
        }

        html += '</table>';
        return html;
    }

    /**
     * Hypothetical function to get data from your product table.
     * This needs to be adapted to your actual HTML structure.
     * @returns {Array} An array of product objects.
     */
    function collectSelectedProductData() {
        // This is a placeholder. You must adapt this function to read
        // data from your actual product table, likely by finding
        // rows with checked checkboxes.
        console.warn("`collectSelectedProductData` is a placeholder and needs to be implemented.");
        // Example data:
        return [
            { prod_id: 'PROD-001', prod_name: 'Sample Product A', prod_pack_weight: '10kg' },
            { prod_id: 'PROD-002', prod_name: 'Sample Product B', prod_pack_weight: '25kg' }
        ];
    }

    // Attach the main function to your button's click event.
    const sendButton = document.getElementById('send-to-shipment-btn');
    if (sendButton) {
        sendButton.addEventListener('click', showConfirmationAndSend);
    } else {
        console.error('"Send to Shipment" button with id "send-to-shipment-btn" not found.');
    }
});

