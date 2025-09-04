// shipment_management.js
// Place all JS logic for shipment management page here

// Example: Document ready
// document.addEventListener('DOMContentLoaded', function() {
//     // Your JS code here
// });

document.addEventListener('DOMContentLoaded', function() {
    // Add event listener for return route selection
    const returnRouteSelect = document.getElementById('return_route');
    const returnPayloadField = document.getElementById('available_payload_return');
    const returnRouteCostField = document.getElementById('route_cost_return');

    if (returnRouteSelect) {
        returnRouteSelect.addEventListener('change', function() {
            const selectedReturnRouteId = returnRouteSelect.value;
            const selectedOption = returnRouteSelect.options[returnRouteSelect.selectedIndex];
            let arrivalIata = '';
            if (selectedOption && selectedOption.text) {
                // Example route name: MIA-MDE-A321F
                const parts = selectedOption.text.split('-');
                if (parts.length >= 2) {
                    arrivalIata = parts[1];
                }
            }
            if (!selectedReturnRouteId || !arrivalIata) {
                if (returnPayloadField) returnPayloadField.value = '';
                if (returnRouteCostField) returnRouteCostField.value = '';
                return;
            }
            // Fetch route details for selected return route
            fetch(`/api/route-details?route_id=${encodeURIComponent(selectedReturnRouteId)}&arrival_iata=${encodeURIComponent(arrivalIata)}`)
                .then(response => response.json())
                .then(data => {
                    // Populate available payload (kg)
                    if (returnPayloadField) returnPayloadField.value = data.payload_kg || '';
                    // Calculate and populate route cost
                    let totalCost = 0;
                    if (data.leg1_total_cost_usd) totalCost += data.leg1_total_cost_usd;
                    if (data.airport_fee) totalCost += data.airport_fee;
                    if (data.turnaround_cost) totalCost += data.turnaround_cost;
                    if (returnRouteCostField) returnRouteCostField.value = totalCost ? totalCost.toFixed(2) : '';

                    // Sum both route cost values and populate total flight cost
                    const outboundRouteCostField = document.getElementById('route_cost');
                    const totalFlightCostDisplay = document.getElementById('total_flight_cost_display');
                    let outboundCost = outboundRouteCostField && outboundRouteCostField.value ? parseFloat(outboundRouteCostField.value) : 0;
                    let returnCost = totalCost ? totalCost : 0;
                    let totalFlightCost = outboundCost + returnCost;
                    if (totalFlightCostDisplay) {
                        totalFlightCostDisplay.textContent = totalFlightCost ? totalFlightCost.toFixed(2) : '';
                    }
                })
                .catch(error => {
                    console.error('Error fetching return route details:', error);
                    if (returnPayloadField) returnPayloadField.value = '';
                    if (returnRouteCostField) returnRouteCostField.value = '';
                });
        });
    }
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
        let portCode = portOfArrival.value;
        // Capitalize input automatically
        portCode = portCode.toUpperCase();
        portOfArrival.value = portCode;
        // Only trigger when code is exactly 3 characters (IATA)
        // For Sea and Ground, adjust this length check as needed
        if (!portCode || portCode.length !== 3) return;
        console.log('Port of Arrival code entered:', portCode);
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
        let portCode = portOfShipping.value;
        // Capitalize input automatically
        portCode = portCode.toUpperCase();
        portOfShipping.value = portCode;
        // Only trigger when code is exactly 3 characters (IATA)
        // For Sea and Ground, adjust this length check as needed
        if (!portCode || portCode.length !== 3) return;
        console.log('Port code entered:', portCode);
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

    // Listen for changes in both port fields to populate departure route
    const departureRouteSelect = document.getElementById('departure_route');
    function updateDepartureRouteOptions() {
        let fromCode = portOfShipping.value.toUpperCase();
        let toCode = portOfArrival.value.toUpperCase();
        // Only trigger when both codes are 3 characters
        departureRouteSelect.innerHTML = '';
        let defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.text = 'Select Route';
        departureRouteSelect.appendChild(defaultOption);
        if (fromCode.length !== 3 || toCode.length !== 3) {
            departureRouteSelect.setAttribute('disabled', 'disabled');
            return;
        }
        fetch(`/api/find-routes?from_airport=${encodeURIComponent(fromCode)}&to_airport=${encodeURIComponent(toCode)}`)
            .then(response => response.json())
            .then(data => {
                if (data.routes && data.routes.length > 0) {
                    data.routes.forEach(route => {
                        let option = document.createElement('option');
                        option.value = route.id;
                        option.text = route.name;
                        departureRouteSelect.appendChild(option);
                    });
                    departureRouteSelect.removeAttribute('disabled');
                } else {
                    let option = document.createElement('option');
                    option.value = '';
                    option.text = 'No routes found';
                    departureRouteSelect.appendChild(option);
                    departureRouteSelect.setAttribute('disabled', 'disabled');
                }
            })
            .catch(error => {
                departureRouteSelect.innerHTML = '';
                let errorOption = document.createElement('option');
                errorOption.value = '';
                errorOption.text = 'Error loading routes';
                departureRouteSelect.appendChild(errorOption);
                departureRouteSelect.setAttribute('disabled', 'disabled');
                console.error('Error fetching routes:', error);
            });
    }
    portOfShipping.addEventListener('input', updateDepartureRouteOptions);
    portOfArrival.addEventListener('input', updateDepartureRouteOptions);

    // Listen for route selection and populate payload, route cost, and return routes
    const availablePayloadField = document.getElementById('available_payload');
    const routeCostField = document.getElementById('route_cost');
    const returnRouteField = document.getElementById('return_route');
    departureRouteSelect.addEventListener('change', function() {
        const selectedRouteId = departureRouteSelect.value;
        if (!selectedRouteId) {
            availablePayloadField.value = '';
            routeCostField.value = '';
            returnRouteField.value = '';
            return;
        }
        // Get port of arrival code (should be used for return route search)
        const arrivalIata = portOfArrival.value.toUpperCase();
        // Fetch route details and airport costs
        fetch(`/api/route-details?route_id=${encodeURIComponent(selectedRouteId)}&arrival_iata=${encodeURIComponent(arrivalIata)}`)
            .then(response => response.json())
            .then(data => {
                availablePayloadField.value = data.payload_kg || '';
                routeCostField.value = data.route_cost || '';
            });
        // Get selected aircraft type from route name
        const selectedOption = departureRouteSelect.options[departureRouteSelect.selectedIndex];
        let selectedAircraft = '';
        if (selectedOption && selectedOption.text) {
            // Example route name: MDE-MIA-A321F
            const parts = selectedOption.text.split('-');
            if (parts.length >= 3) {
                selectedAircraft = parts[2];
                console.log('Extracted aircraft type:', selectedAircraft);
            } else {
                console.warn('Could not extract aircraft type from route name:', selectedOption.text);
            }
        }
        // Fetch return routes using port of arrival IATA code
        console.log(`Fetching return routes for departure_iata=${arrivalIata}, aircraft_type=${selectedAircraft}`);
        fetch(`/api/return-routes?departure_iata=${encodeURIComponent(arrivalIata)}&aircraft_type=${encodeURIComponent(selectedAircraft)}`)
            .then(response => response.json())
            .then(data => {
                console.log('Return routes response:', data);
                if (data.routes && data.routes.length > 0) {
                    // Populate as comma-separated destinations
                    // Clear existing options
                    returnRouteField.innerHTML = '';
                    // Add default option
                    const defaultOption = document.createElement('option');
                    defaultOption.value = '';
                    defaultOption.text = 'Select Return Route';
                    returnRouteField.appendChild(defaultOption);
                    // Add route options
                    data.routes.forEach(route => {
                        const option = document.createElement('option');
                        option.value = route.id;
                        option.text = route.name;
                        returnRouteField.appendChild(option);
                    });
                    console.log('Set return routes to:', data.routes.map(r => r.name));
                } else {
                    returnRouteField.value = '';
                    console.log('No return routes found');
                }
            })
            .catch(error => {
                console.error('Error fetching return routes:', error);
                returnRouteField.value = '';
            });
    });
});
