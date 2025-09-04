// shipment_management.js
// Place all JS logic for shipment management page here

// Example: Document ready
// document.addEventListener('DOMContentLoaded', function() {
//     // Your JS code here
// });

document.addEventListener('DOMContentLoaded', function() {
    // Define all DOM elements first
    const typeOfFreight = document.getElementById('type_of_freight');
    const portOfShipping = document.getElementById('port_of_shipping');
    const portOfArrival = document.getElementById('consignee_port_of_shipping');
    const regionField = document.getElementById('trading_region');
    const managerField = document.getElementById('trading_regional_manager');
    const countryField = document.getElementById('trading_country');
    const branchField = document.getElementById('trading_branch');
    const consigneeRegionField = document.getElementById('consignee_region');
    const consigneeManagerField = document.getElementById('consignee_regional_manager');
    const consigneeCountryField = document.getElementById('consignee_country');
    const consigneeBranchField = document.getElementById('consignee_branch');

    // Listen for input events for Port of Arrival
    portOfArrival.addEventListener('input', function() {
        const portCode = portOfArrival.value;
        console.log('Port of Arrival code entered:', portCode);
        if (!portCode) return;
        fetch(`/api/trader-info?port_code=${encodeURIComponent(portCode)}`)
            .then(response => response.json())
            .then(data => {
                // Region
                if (consigneeRegionField) {
                    if (consigneeRegionField.tagName === 'SELECT') {
                        let found = false;
                        for (let i = 0; i < consigneeRegionField.options.length; i++) {
                            if (consigneeRegionField.options[i].text === data.region) {
                                consigneeRegionField.value = consigneeRegionField.options[i].value;
                                found = true;
                                break;
                            }
                        }
                        if (!found && data.region) {
                            let opt = document.createElement('option');
                            opt.value = data.region;
                            opt.text = data.region;
                            consigneeRegionField.appendChild(opt);
                            consigneeRegionField.value = data.region;
                        }
                    } else {
                        consigneeRegionField.value = data.region || '';
                    }
                }
                // Manager
                if (consigneeManagerField) consigneeManagerField.value = data.manager || '';
                // Country
                if (consigneeCountryField) {
                    if (consigneeCountryField.tagName === 'SELECT') {
                        let found = false;
                        for (let i = 0; i < consigneeCountryField.options.length; i++) {
                            if (consigneeCountryField.options[i].text === data.country) {
                                consigneeCountryField.value = consigneeCountryField.options[i].value;
                                found = true;
                                break;
                            }
                        }
                        if (!found && data.country) {
                            let opt = document.createElement('option');
                            opt.value = data.country;
                            opt.text = data.country;
                            consigneeCountryField.appendChild(opt);
                            consigneeCountryField.value = data.country;
                        }
                    } else {
                        consigneeCountryField.value = data.country || '';
                    }
                }
                // Branch
                if (consigneeBranchField) {
                    if (consigneeBranchField.tagName === 'SELECT') {
                        let found = false;
                        for (let i = 0; i < consigneeBranchField.options.length; i++) {
                            if (consigneeBranchField.options[i].text === data.branch) {
                                consigneeBranchField.value = consigneeBranchField.options[i].value;
                                found = true;
                                break;
                            }
                        }
                        if (!found && data.branch) {
                            let opt = document.createElement('option');
                            opt.value = data.branch;
                            opt.text = data.branch;
                            consigneeBranchField.appendChild(opt);
                            consigneeBranchField.value = data.branch;
                        }
                    } else {
                        consigneeBranchField.value = data.branch || '';
                    }
                }
            })
            .catch(error => {
                console.error('Error fetching trader info for arrival:', error);
            });
    });

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
        if (portOfShipping && portOfShipping.tagName === 'SELECT' && portOfShipping.options && portOfShipping.options.length > 0) {
            portOfShipping.options[0].text = placeholder;
            portOfShipping.options[0].value = '';
        } else if (portOfShipping && portOfShipping.tagName === 'INPUT') {
            portOfShipping.placeholder = placeholder;
        }
        if (portOfArrival && portOfArrival.options && portOfArrival.options.length > 0) {
            portOfArrival.options[0].text = placeholder;
            portOfArrival.options[0].value = '';
        }
    }

    typeOfFreight.addEventListener('change', updatePortPlaceholders);
    // Initialize on page load
    updatePortPlaceholders();

    // Listen for input events for instant feedback
    portOfShipping.addEventListener('input', function() {
        const portCode = portOfShipping.value;
        console.log('Port code entered:', portCode);
        if (!portCode) return;
        fetch(`/api/trader-info?port_code=${encodeURIComponent(portCode)}`)
            .then(response => response.json())
            .then(data => {
                // Region
                if (regionField) {
                    if (regionField.tagName === 'SELECT') {
                        let found = false;
                        for (let i = 0; i < regionField.options.length; i++) {
                            if (regionField.options[i].text === data.region) {
                                regionField.value = regionField.options[i].value;
                                found = true;
                                break;
                            }
                        }
                        if (!found && data.region) {
                            let opt = document.createElement('option');
                            opt.value = data.region;
                            opt.text = data.region;
                            regionField.appendChild(opt);
                            regionField.value = data.region;
                        }
                    } else {
                        regionField.value = data.region || '';
                    }
                }
                // Manager
                if (managerField) managerField.value = data.manager || '';
                // Country
                if (countryField) {
                    if (countryField.tagName === 'SELECT') {
                        let found = false;
                        for (let i = 0; i < countryField.options.length; i++) {
                            if (countryField.options[i].text === data.country) {
                                countryField.value = countryField.options[i].value;
                                found = true;
                                break;
                            }
                        }
                        if (!found && data.country) {
                            let opt = document.createElement('option');
                            opt.value = data.country;
                            opt.text = data.country;
                            countryField.appendChild(opt);
                            countryField.value = data.country;
                        }
                    } else {
                        countryField.value = data.country || '';
                    }
                }
                // Branch
                if (branchField) {
                    if (branchField.tagName === 'SELECT') {
                        let found = false;
                        for (let i = 0; i < branchField.options.length; i++) {
                            if (branchField.options[i].text === data.branch) {
                                branchField.value = branchField.options[i].value;
                                found = true;
                                break;
                            }
                        }
                        if (!found && data.branch) {
                            let opt = document.createElement('option');
                            opt.value = data.branch;
                            opt.text = data.branch;
                            branchField.appendChild(opt);
                            branchField.value = data.branch;
                        }
                    } else {
                        branchField.value = data.branch || '';
                    }
                }
            })
            .catch(error => {
                console.error('Error fetching trader info:', error);
            });
    });
});
