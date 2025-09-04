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
        // Update first option text for both selects
        if (portOfShipping.options.length > 0) {
            portOfShipping.options[0].text = placeholder;
            portOfShipping.options[0].value = '';
        }
        if (portOfArrival.options.length > 0) {
            portOfArrival.options[0].text = placeholder;
            portOfArrival.options[0].value = '';
        }
    }

    typeOfFreight.addEventListener('change', updatePortPlaceholders);
    // Initialize on page load
    updatePortPlaceholders();
});
