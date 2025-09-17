// shipment_management.js
// Place all JS logic for shipment management page here

// Example: Document ready
// document.addEventListener('DOMContentLoaded', function() {
//     // Your JS code here
// });

document.addEventListener('DOMContentLoaded', function() {
    const typeOfFreight = document.getElementById('type_of_freight');
    const portOfShipping = document.getElementById('port_of_shipping');
    const portOfArrival = document.getElementById('consignee_port_of_shipping');
    const productTableContainer = document.getElementById('product-table-container');

    function updatePortPlaceholders() {
        let placeholder = '';
        switch (typeOfFreight.value) {
            case 'Air':
                placeholder = 'Enter IATA Code';
                break;
            case 'Sea':
                placeholder = 'Enter PORT Code';
                break;
            case 'Ground':
                placeholder = 'Enter TERMINAL Code';
                break;
            default:
                placeholder = 'Select Port';
        }
        // Enable selects if disabled
        portOfShipping.removeAttribute('disabled');
        portOfArrival.removeAttribute('disabled');
        // Update placeholder text for inputs, or first option for selects
        if (portOfShipping.tagName === 'SELECT' && portOfShipping.options.length > 0) {
            portOfShipping.options[0].text = placeholder;
            portOfShipping.options[0].value = '';
        } else if (portOfShipping.tagName === 'INPUT') {
            portOfShipping.placeholder = placeholder;
        }
        if (portOfArrival.tagName === 'SELECT' && portOfArrival.options.length > 0) {
            portOfArrival.options[0].text = placeholder;
            portOfArrival.options[0].value = '';
        } else if (portOfArrival.tagName === 'INPUT') {
            portOfArrival.placeholder = placeholder;
        }
    }

    typeOfFreight.addEventListener('change', updatePortPlaceholders);
    // Initialize on page load
    updatePortPlaceholders();

    // --- New Table Creation Logic ---

    // Helper to format numbers
    function formatNumber(num) {
        return num ? num.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-';
    }

    // Function to build a single product row
    function createProductRow(product) {
        // This function creates the HTML for a single table row based on a product object.
        // The empty cells are placeholders for calculated values.
        return `
            <tr>
                <td style="text-align: center;">${product.product_code || '-'}</td>
                <td style="text-align: left;">${product.name || '-'}</td>
                <td style="text-align: center;">${product.product_type || '-'}</td>
                <td style="text-align: center;">${product.country_id || '-'}</td>
                <td style="text-align: center;">${product.packaging || '-'}</td>
                <td style="text-align: right;">${formatNumber(product.packaging_weight)} kg</td>
                <td style="text-align: center;">${product.units_per_pack || '-'}</td>
                <td style="text-align: right;">$${formatNumber(product.packaging_cost)}</td>
                <td style="text-align: center;">${product.currency || '-'}</td>
                <td style="text-align: center;"><input type="number" name="amount_${product.product_code}" value="0" style="width: 80px; text-align: right;"></td>
                <td style="text-align: center; color: #b64545;">-</td>
                <td style="text-align: center; color: #b64545;">-</td>
                <td style="text-align: center; color: #b64545;">-</td>
                <td style="text-align: center; color: #b64545;">-</td>
                <td style="text-align: center; color: #b64545;">-</td>
                <td style="text-align: center; color: #8f7d16;">-</td>
                <td style="text-align: center; color: #8f7d16;">-</td>
                <td style="text-align: center; color: #8f7d16;">-</td>
                <td style="text-align: center; color: #8f7d16;">-</td>
                <td style="text-align: center; color: #8f7d16;">-</td>
                <td style="text-align: center; color: #8f7d16;">-</td>
                <td style="text-align: center; color: #8f7d16;">-</td>
                <td style="text-align: center; color: #8f7d16;">-</td>
                <td style="text-align: center; color: #8f7d16;">-</td>
                <td style="text-align: center; color: #8f7d16;">-</td>
                <td style="text-align: center; color: #8f7d16;">-</td>
                <td style="text-align: center; color: #8f7d16;">-</td>
                <td style="text-align: center; color: #8f7d16;">-</td>
                <td style="text-align: center; color: #8f7d16;">-</td>
            </tr>
        `;
    }

    // Function to fetch and render products
    async function loadProductsForCountry(countryCode) {
        if (!countryCode || !productTableContainer) {
            if(productTableContainer) productTableContainer.innerHTML = '<tr><td colspan="29" style="text-align: center;">Please select a port of shipping to see products.</td></tr>';
            return;
        }

        try {
            const response = await fetch(`/api/get-products-by-country/${countryCode}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const products = await response.json();

            if (products && products.length > 0) {
                productTableContainer.innerHTML = products.map(createProductRow).join('');
            } else {
                productTableContainer.innerHTML = `<tr><td colspan="29" style="text-align: center;">No products found for this country.</td></tr>`;
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            productTableContainer.innerHTML = `<tr><td colspan="29" style="text-align: center; color: red;">Error loading products.</td></tr>`;
        }
    }

    // For this to work, you need to pass country data from your backend to the template.
    // In your `shippment_management.html`, add:
    // <script>window.countryData = {{ country_list | tojson | safe }};</script>
    // This assumes `country_list` is available in the template context.
    // For now, we'll just load products for a hardcoded country on page load for demonstration.
    // Replace 'US' with dynamic logic based on port selection.
    loadProductsForCountry('US'); // Example: Load US products by default.
});
