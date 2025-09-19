// Removed duplicate IIFE initialization for target_cargo_load_return_percentage to prevent conflicts
    // Removed duplicate IIFE initialization for target_cargo_load_return_percentage to prevent conflicts
    // --- Logic for target_cargo_load_return_percentage and target_cargo_load_return ---
    const targetCargoLoadReturnPercentage = document.getElementById('target_cargo_load_return_percentage');
    const targetCargoLoadReturn = document.getElementById('target_cargo_load_return');
    const availablePayloadReturn = document.getElementById('available_payload_return');
    const returnCostWeight = document.getElementById('return_cost_weight');
    // Always keep return_cost_weight disabled and remove .input-required-style if present
    if (returnCostWeight) {
        returnCostWeight.disabled = true;
        returnCostWeight.classList.remove('input-required-style');
    }

    if (targetCargoLoadReturnPercentage) {
        // Always ensure enabled
        targetCargoLoadReturnPercentage.removeAttribute('disabled');
        targetCargoLoadReturnPercentage.disabled = false;
        targetCargoLoadReturnPercentage.value = 100;
        if (!targetCargoLoadReturnPercentage.classList.contains('input-required-style')) {
            targetCargoLoadReturnPercentage.classList.add('input-required-style');
        }
        targetCargoLoadReturnPercentage.addEventListener('input', function() {
            targetCargoLoadReturnPercentage.classList.remove('input-required-style');
            if (targetCargoLoadReturn && availablePayloadReturn) {
                let perc = parseFloat(targetCargoLoadReturnPercentage.value);
                let payload = parseFloat(availablePayloadReturn.value);
                if (!isNaN(perc) && !isNaN(payload)) {
                    targetCargoLoadReturn.value = (payload * perc / 100).toFixed(2);
                } else {
                    targetCargoLoadReturn.value = '';
                }
            }
        });
    }
    if (availablePayloadReturn && targetCargoLoadReturnPercentage && targetCargoLoadReturn) {
        availablePayloadReturn.addEventListener('input', function() {
            let perc = parseFloat(targetCargoLoadReturnPercentage.value);
            let payload = parseFloat(availablePayloadReturn.value);
            if (!isNaN(perc) && !isNaN(payload)) {
                targetCargoLoadReturn.value = (payload * perc / 100).toFixed(2);
            } else {
                targetCargoLoadReturn.value = '';
            }
        });
    }
// shipment_management.js
// Place all JS logic for shipment management page here

// Example: Document ready
// document.addEventListener('DOMContentLoaded', function() {
//     // Your JS code here
// });

document.addEventListener('DOMContentLoaded', function() {
    // Declare shared DOM elements once
    const typeOfFreight = document.getElementById('type_of_freight');
    const portOfArrival = document.getElementById('consignee_port_of_shipping');
    const typeOfReturn = document.getElementById('type_of_return');

    // Collapse all main sections and disable toggles at page load
    const tradingInfoContent = document.getElementById('trading-info-content');
    const tradingToggleBtn = document.getElementById('toggle-trading-btn');
    const logisticInfoContent = document.getElementById('logistic-info-content');
    const logisticToggleBtn = document.getElementById('toggle-logistic-btn');
    const productsContentWrapper = document.getElementById('products-content-wrapper');
    const productsToggleBtn = document.getElementById('toggle-products-btn');

    if (tradingInfoContent) tradingInfoContent.style.display = 'none';
    if (tradingToggleBtn) tradingToggleBtn.disabled = true;
    if (logisticInfoContent) logisticInfoContent.style.display = 'none';
    if (logisticToggleBtn) logisticToggleBtn.disabled = true;
    if (productsContentWrapper) productsContentWrapper.style.display = 'none';
    if (productsToggleBtn) productsToggleBtn.disabled = true;

    // Expand trading info when type_of_freight is selected
    if (typeOfFreight) {
        typeOfFreight.addEventListener('change', function() {
            if (typeOfFreight.value && tradingInfoContent) {
                tradingInfoContent.style.display = '';
                if (tradingToggleBtn) tradingToggleBtn.disabled = false;
            }
        });
    }

    // Expand logistic info when Port of Arrival is entered, then enable toggle
    if (portOfArrival) {
        portOfArrival.addEventListener('input', function() {
            if (portOfArrival.value && logisticInfoContent) {
                logisticInfoContent.style.display = '';
                if (logisticToggleBtn) logisticToggleBtn.disabled = false;
            }
        });
    }

    // Expand products section when type_of_return is selected
    if (typeOfReturn) {
        typeOfReturn.addEventListener('change', function() {
            if (typeOfReturn.value && productsContentWrapper) {
                productsContentWrapper.style.display = '';
                if (productsToggleBtn) productsToggleBtn.disabled = false;
            }
        });
    }

    // Toggle button logic for each section
    if (tradingToggleBtn && tradingInfoContent) {
        tradingToggleBtn.addEventListener('click', function() {
            tradingInfoContent.style.display = (tradingInfoContent.style.display === 'none') ? '' : 'none';
        });
    }
    if (logisticToggleBtn && logisticInfoContent) {
        logisticToggleBtn.addEventListener('click', function() {
            logisticInfoContent.style.display = (logisticInfoContent.style.display === 'none') ? '' : 'none';
        });
    }
    if (productsToggleBtn && productsContentWrapper) {
        productsToggleBtn.addEventListener('click', function() {
            productsContentWrapper.style.display = (productsContentWrapper.style.display === 'none') ? '' : 'none';
        });
    }

    // --- Automatic Calculation Logic ---
    function parseNumber(val) {
        if (!val) return 0;
        // Remove $ and commas if present
        return parseFloat(val.toString().replace(/[$,]/g, '')) || 0;
    }

    function updateCalculatedFields() {
        // Get elements
        const totalFlightCostDisplay = document.getElementById('total_flight_cost_display');
        const outboundCostWeight = document.getElementById('outbound_cost_weight');
        const outboundCostWeightValue = document.getElementById('outbound_cost_weight_value');
        const availablePayload = document.getElementById('available_payload');
        const targetCargoLoad = document.getElementById('target_cargo_load');
        const targetCargoLoadDepartureValue = document.getElementById('target_cargo_load_departure_value');
        const returnCostWeight = document.getElementById('return_cost_weight');
        const returnCostWeightValue = document.getElementById('return_cost_weight_value');
        const availablePayloadReturn = document.getElementById('available_payload_return');
        const targetCargoLoadReturnPercentage = document.getElementById('target_cargo_load_return_percentage');
        const targetCargoLoadReturn = document.getElementById('target_cargo_load_return');

        // 1. outbound_cost_weight_value = total_flight_cost_display * outbound_cost_weight (as %)
        const totalFlightCost = parseNumber(totalFlightCostDisplay.textContent);
        const outboundWeightPct = parseNumber(outboundCostWeight.value);
        const outboundCostWeightVal = totalFlightCost * (outboundWeightPct / 100);
        if (outboundCostWeightValue) {
            outboundCostWeightValue.value = outboundCostWeightVal ? ('$' + outboundCostWeightVal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})) : '';
        }

        // 2. target_cargo_load_departure_value = available_payload * target_cargo_load (as %)
        const availablePayloadVal = parseNumber(availablePayload.value);
        const targetCargoLoadPct = parseNumber(targetCargoLoad.value);
        const targetCargoLoadDepartureVal = availablePayloadVal * (targetCargoLoadPct / 100);
        if (targetCargoLoadDepartureValue) {
            targetCargoLoadDepartureValue.value = targetCargoLoadDepartureVal ? targetCargoLoadDepartureVal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '';
        }

        // 3. return_cost_weight = 100 - outbound_cost_weight
        const returnWeightPct = 100 - outboundWeightPct;
        if (returnCostWeight) {
            returnCostWeight.value = returnWeightPct;
        }

        // 4. target_cargo_load_return = available_payload_return * target_cargo_load_return_percentage (as %)
        const availablePayloadReturnVal = parseNumber(availablePayloadReturn.value);
        const targetCargoLoadReturnPct = parseNumber(targetCargoLoadReturnPercentage.value);
        const targetCargoLoadReturnVal = availablePayloadReturnVal * (targetCargoLoadReturnPct / 100);
        if (targetCargoLoadReturn) {
            targetCargoLoadReturn.value = targetCargoLoadReturnVal ? targetCargoLoadReturnVal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '';
        }

        // 5. return_cost_weight_value = total_flight_cost_display * return_cost_weight (as %)
        const returnCostWeightVal = totalFlightCost * (returnWeightPct / 100);
        if (returnCostWeightValue) {
            returnCostWeightValue.value = returnCostWeightVal ? ('$' + returnCostWeightVal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})) : '';
        }
        // 6. est_outb_kg_cost = outbound_cost_weight_value / target_cargo_load_departure_value
        const estOutbKgCostField = document.getElementById('est_outb_kg_cost');
        const outboundCostWeightValueNum = parseNumber(outboundCostWeightValue.value);
        const targetCargoLoadDepartureValueNum = parseNumber(targetCargoLoadDepartureValue.value);
        if (estOutbKgCostField) {
            if (!isNaN(outboundCostWeightValueNum) && !isNaN(targetCargoLoadDepartureValueNum) && targetCargoLoadDepartureValueNum !== 0) {
                estOutbKgCostField.value = (outboundCostWeightValueNum / targetCargoLoadDepartureValueNum).toFixed(2);
            } else {
                estOutbKgCostField.value = '';
            }
        }
        // 7. est_ret_kg_cost = return_cost_weight_value / target_cargo_load_return
        const estRetKgCostField = document.getElementById('est_ret_kg_cost');
        const returnCostWeightValueNum = parseNumber(returnCostWeightValue.value);
        const targetCargoLoadReturnNum = parseNumber(targetCargoLoadReturn.value);
        if (estRetKgCostField) {
            if (!isNaN(returnCostWeightValueNum) && !isNaN(targetCargoLoadReturnNum) && targetCargoLoadReturnNum !== 0) {
                estRetKgCostField.value = (returnCostWeightValueNum / targetCargoLoadReturnNum).toFixed(2);
            } else {
                estRetKgCostField.value = '';
            }
        }
    }

    // Run calculation on page load and whenever relevant fields change
    setInterval(updateCalculatedFields, 500); // Polling for programmatic changes

    [
        'total_flight_cost_display', 'outbound_cost_weight', 'available_payload', 'target_cargo_load',
        'available_payload_return', 'target_cargo_load_return_percentage'
    ].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', updateCalculatedFields);
        }
    });
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
                    if (returnRouteCostField) {
                        returnRouteCostField.value = totalCost ? ('$' + totalCost.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})) : '';
                    }

                    // Sum both route cost values and populate total flight cost
                    const outboundRouteCostField = document.getElementById('route_cost');
                    const totalFlightCostDisplay = document.getElementById('total_flight_cost_display');
                    let outboundCost = outboundRouteCostField && outboundRouteCostField.value ? parseFloat(outboundRouteCostField.value) : 0;
                    let returnCost = totalCost ? totalCost : 0;
                    let totalFlightCost = outboundCost + returnCost;
                    if (totalFlightCostDisplay) {
                        totalFlightCostDisplay.textContent = totalFlightCost ? ('$' + totalFlightCost.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})) : '';
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
    const portOfShipping = document.getElementById('port_of_shipping');
    const regionField = document.getElementById('trading_region');
    const managerField = document.getElementById('trading_regional_manager');
    const countryField = document.getElementById('trading_country');
    const branchField = document.getElementById('trading_branch');
    const consigneeRegionField = document.getElementById('consignee_region');
    const consigneeManagerField = document.getElementById('consignee_regional_manager');
    const consigneeCountryField = document.getElementById('consignee_country');
    const consigneeBranchField = document.getElementById('consignee_branch');
    const shipperCountryCodeField = document.getElementById('shipper_country_code');
    const consigneeCountryCodeField = document.getElementById('consignee_country_code');
    const addCargoOutboundBtn = document.getElementById('add_cargo_outbound_btn');
    const addCargoReturnBtn = document.getElementById('add_cargo_return_btn');
    const productTableContainer = document.getElementById('product-table-container');
    let currentCargoContext = null; // To track if we are editing outbound or return cargo

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

                // --- Store consignee country code and tax/profit percentages ---
                if (consigneeCountryCodeField) {
                    if (data.country_id) {
                        consigneeCountryCodeField.value = data.country_id;
                    }
                    consigneeCountryCodeField.dataset.exportTax = data.export_sales_tax || 0;
                    consigneeCountryCodeField.dataset.exportProfit = data.export_profit_pct || 0;
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
        if (portOfArrival && portOfArrival.tagName === 'SELECT' && portOfArrival.options && portOfArrival.options.length > 0) {
            portOfArrival.options[0].text = placeholder;
            portOfArrival.options[0].value = '';
        } else if (portOfArrival && portOfArrival.tagName === 'INPUT') {
            portOfArrival.placeholder = placeholder;
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

                // --- Store country code and tax/profit percentages but DO NOT load products yet ---
                if (shipperCountryCodeField) {
                    if (data.country_id) {
                        shipperCountryCodeField.value = data.country_id;
                    }
                    shipperCountryCodeField.dataset.exportTax = data.export_sales_tax || 0;
                    shipperCountryCodeField.dataset.exportProfit = data.export_profit_pct || 0;
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
    // --- Type of Return logic for outbound cost weight and target cargo load ---
    const outboundCostWeight = document.getElementById('outbound_cost_weight');
    const outboundCostWeightValue = document.getElementById('outbound_cost_weight_value');
    const totalFlightCostDisplay = document.getElementById('total_flight_cost_display');
    const targetCargoLoad = document.getElementById('target_cargo_load');
    const targetCargoLoadDepartureValue = document.getElementById('target_cargo_load_departure_value');
    const availablePayload = document.getElementById('available_payload');

    function parseNumber(val) {
        if (!val) return 0;
        return parseFloat(val.toString().replace(/[$,]/g, '')) || 0;
    }

    function updateOutboundCostWeightAndCargoLoad() {
        if (!typeOfReturn || !outboundCostWeight || !outboundCostWeightValue || !totalFlightCostDisplay || !targetCargoLoad || !targetCargoLoadDepartureValue || !availablePayload) return;
        if (typeOfReturn.value === 'full') {
            // Outbound cost weight: 100, not editable, not highlighted, transparent background
            outboundCostWeight.value = 100;
            outboundCostWeight.disabled = true;
            outboundCostWeight.classList.remove('input-required-style');
            outboundCostWeight.style.backgroundColor = 'transparent';
            let totalCost = parseNumber(totalFlightCostDisplay.textContent);
            outboundCostWeightValue.value = totalCost ? ('$' + (totalCost * 1).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})) : '';
            // Target cargo load: editable, highlighted, set default value to 0
            targetCargoLoad.disabled = false;
            targetCargoLoad.value = 0;
            targetCargoLoad.classList.add('input-required-style');
        } else if (typeOfReturn.value === 'compensated') {
            outboundCostWeight.value = 100;
            outboundCostWeight.disabled = false;
            outboundCostWeight.classList.add('input-required-style');
            let totalCost = parseNumber(totalFlightCostDisplay.textContent);
            let outboundWeightPct = parseNumber(outboundCostWeight.value);
            outboundCostWeightValue.value = totalCost ? ('$' + (totalCost * (outboundWeightPct / 100)).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})) : '';
            // Target cargo load: editable, highlighted
            targetCargoLoad.disabled = false;
            targetCargoLoad.classList.add('input-required-style');
        } else {
            outboundCostWeight.disabled = false;
            outboundCostWeight.value = '';
            outboundCostWeightValue.value = '';
            outboundCostWeight.classList.remove('input-required-style');
            targetCargoLoad.disabled = true;
            targetCargoLoad.classList.remove('input-required-style');
            targetCargoLoadDepartureValue.value = '';
        }
    }
    if (typeOfReturn) {
        typeOfReturn.addEventListener('change', updateOutboundCostWeightAndCargoLoad);
        updateOutboundCostWeightAndCargoLoad(); // Initial state
    }
    // When user enters data in outbound_cost_weight, remove highlight and recalculate value
    if (outboundCostWeight) {
        outboundCostWeight.addEventListener('input', function() {
            outboundCostWeight.classList.remove('input-required-style');
            let totalCost = parseNumber(totalFlightCostDisplay.textContent);
            let outboundWeightPct = parseNumber(outboundCostWeight.value);
            outboundCostWeightValue.value = totalCost ? ('$' + (totalCost * (outboundWeightPct / 100)).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})) : '';
        });
    }
    // When user enters data in target_cargo_load, calculate and set target_cargo_load_departure_value, and reset background
    if (targetCargoLoad) {
        targetCargoLoad.addEventListener('input', function() {
            targetCargoLoad.classList.remove('input-required-style');
            let availablePayloadVal = parseNumber(availablePayload.value);
            let targetCargoLoadPct = parseNumber(targetCargoLoad.value);
            let result = availablePayloadVal * (targetCargoLoadPct / 100);
            targetCargoLoadDepartureValue.value = result ? result.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '';
        });
    }
    // --- Type of Return logic (correct variable order) ---
    const returnCostWeight = document.getElementById('return_cost_weight');
    const targetCargoLoadReturnPercentage = document.getElementById('target_cargo_load_return_percentage');

    function updateReturnFields() {
        // Defensive: ensure all elements exist
        if (!typeOfReturn || !returnCostWeight || !targetCargoLoadReturnPercentage) return;
        const value = typeOfReturn.value;
        if (value === 'full') {
            returnCostWeight.disabled = false;
            returnCostWeight.classList.remove('input-required-style');
            returnCostWeight.style.backgroundColor = 'transparent';
            returnCostWeight.style.border = '2px solid #2b792b';
            // Always keep target_cargo_load_return_percentage enabled and styled correctly
            targetCargoLoadReturnPercentage.disabled = false;
            targetCargoLoadReturnPercentage.removeAttribute('disabled');
            if (!targetCargoLoadReturnPercentage.classList.contains('input-required-style')) {
                targetCargoLoadReturnPercentage.classList.add('input-required-style');
            }
        } else if (value === 'compensated') {
            returnCostWeight.disabled = true;
            returnCostWeight.classList.remove('input-required-style');
            returnCostWeight.style.backgroundColor = 'transparent';
            returnCostWeight.style.border = '2px solid #cccccc';
            // Always keep target_cargo_load_return_percentage enabled and styled correctly
            targetCargoLoadReturnPercentage.disabled = false;
            targetCargoLoadReturnPercentage.removeAttribute('disabled');
            if (!targetCargoLoadReturnPercentage.classList.contains('input-required-style')) {
                targetCargoLoadReturnPercentage.classList.add('input-required-style');
            }
        } else {
            returnCostWeight.disabled = true;
            returnCostWeight.classList.remove('input-required-style');
            returnCostWeight.style.backgroundColor = 'transparent';
            returnCostWeight.style.border = '';
            // Always keep target_cargo_load_return_percentage enabled and styled correctly
            targetCargoLoadReturnPercentage.disabled = false;
            targetCargoLoadReturnPercentage.removeAttribute('disabled');
            if (!targetCargoLoadReturnPercentage.classList.contains('input-required-style')) {
                targetCargoLoadReturnPercentage.classList.add('input-required-style');
            }
        }
    }
    if (typeOfReturn) {
        typeOfReturn.addEventListener('change', updateReturnFields);
        updateReturnFields(); // Initial state
    }
    const startShipmentBtn = document.getElementById('start-shipment-btn');
    const typeOfFreightWrapper = document.getElementById('type-of-freight-wrapper');
    if (startShipmentBtn && typeOfFreightWrapper) {
        startShipmentBtn.addEventListener('click', function() {
            typeOfFreightWrapper.style.display = 'flex';
        });
    }
        // Sync add_cargo_outbound with port_of_shipping
        const portOfShippingInput = document.getElementById('port_of_shipping');
        const addCargoOutboundInput = document.getElementById('add_cargo_outbound');
        if (portOfShippingInput && addCargoOutboundInput) {
            portOfShippingInput.addEventListener('input', function() {
                addCargoOutboundInput.value = portOfShippingInput.value;
            });
        }

        // Sync add_cargo_return with consignee_port_of_shipping
        const consigneePortOfShippingInput = document.getElementById('consignee_port_of_shipping');
        const addCargoReturnInput = document.getElementById('add_cargo_return');
        if (consigneePortOfShippingInput && addCargoReturnInput) {
            consigneePortOfShippingInput.addEventListener('input', function() {
                addCargoReturnInput.value = consigneePortOfShippingInput.value;
            });
        }

    // --- Helper to change table header color ---
    function setTableHeaderColor(color) {
        const productTableHeaders = document.querySelectorAll('.product-list-table thead th');
        productTableHeaders.forEach(th => {
            th.style.backgroundColor = color;
        });
    }

    // --- New listener for the "Load Cargo" button ---
    if (addCargoOutboundBtn) {
        addCargoOutboundBtn.addEventListener('click', function() {
            const countryCode = shipperCountryCodeField.value;
            if (countryCode) {
                currentCargoContext = 'outbound'; // Set context
                loadProductsForCountry(countryCode);
                setTableHeaderColor('#257777'); // Shipper-related color
                addCargoOutboundBtn.style.color = '#257777';
                if (addCargoReturnBtn) addCargoReturnBtn.style.color = '#8f7d16'; // Reset other button
            } else {
                alert('Please enter a valid Port of Shipping first to determine the country.');
            }
        });
    }

    // --- Listener for the return "Load Cargo" button ---
    if (addCargoReturnBtn) {
        addCargoReturnBtn.addEventListener('click', function() {
            const countryCode = consigneeCountryCodeField.value;
            if (countryCode) {
                currentCargoContext = 'return'; // Set context
                loadProductsForCountry(countryCode);
                setTableHeaderColor('#2b792b'); // Consignee-related color
                addCargoReturnBtn.style.color = '#2b792b';
                if (addCargoOutboundBtn) addCargoOutboundBtn.style.color = '#8f7d16'; // Reset other button
            } else {
                alert('Please enter a valid Port of Arrival first to determine the country.');
            }
        });
    }

    // --- Product Table Creation Logic ---

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
                <td style="text-align: center;">
                    <input type="number" 
                           class="product-amount-input" 
                           name="amount_${product.product_code}" 
                           value="0" 
                           style="width: 80px; text-align: right;"
                           data-pack-weight="${product.packaging_weight || 0}"
                           data-pack-cost="${product.packaging_cost || 0}"
                           data-product-code="${product.product_code}">
                </td>
                <td id="total-weight-${product.product_code}" style="text-align: right; color: #b64545;">-</td>
                <td id="total-cost-${product.product_code}" style="text-align: right; color: #b64545;">-</td>
                <td id="export-taxes-${product.product_code}" style="text-align: right; color: #b64545;">-</td>
                <td id="exporter-profit-${product.product_code}" style="text-align: right; color: #b64545;">-</td>
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
        console.log(`loadProductsForCountry called with countryCode: ${countryCode}`);
        
        if (!countryCode || !productTableContainer) {
            console.log('Missing countryCode or productTableContainer');
            if(productTableContainer) productTableContainer.innerHTML = '<tr><td colspan="29" style="text-align: center;">Please select a port of shipping to see products.</td></tr>';
            return;
        }
        try {
            // Fetch products for the country
            console.log(`Fetching products for country: ${countryCode}`);
            const response = await fetch(`/api/products-by-country?country_id=${countryCode}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const data = await response.json();
            console.log('API response:', data);
            
            const products = data.products;
            
            // Render products in the table
            productTableContainer.innerHTML = (products && products.length > 0) 
                ? products.map(createProductRow).join('') 
                : `<tr><td colspan="29" style="text-align: center;">No products found for this country.</td></tr>`;
            
            // Initialize/clear totals when table is reloaded
            updateTableTotals();
            
            // Get the currency code directly from the API response
            const currencyCode = data.country_currency;
            console.log(`Country currency code: ${currencyCode}`);
            
            if (!currencyCode) {
                console.error('No currency code found in API response');
                return;
            }
            
            // For testing, set a default value first so the user sees something even if API fails
            const exchangeRateField = document.getElementById('exchange_rate');
            if (exchangeRateField) {
                // Default values based on currency
                let defaultRate;
                if (currencyCode === 'USD') {
                    defaultRate = 1.0;
                } else if (currencyCode === 'EUR') {
                    defaultRate = 1.17;
                } else if (currencyCode === 'GBP') {
                    defaultRate = 1.38;
                } else if (currencyCode === 'JPY') {
                    defaultRate = 0.0091;
                } else if (currencyCode === 'CAD') {
                    defaultRate = 0.8;
                } else if (currencyCode === 'AUD') {
                    defaultRate = 0.75;
                } else {
                    // Default rate for other currencies
                    defaultRate = 0.5;
                }
                
                exchangeRateField.value = defaultRate.toFixed(4);
                console.log(`Set default exchange rate for ${currencyCode} to ${defaultRate.toFixed(4)}`);
            }
            
            // Fetch actual exchange rate
            if (currencyCode && currencyCode !== 'USD') {
                try {
                    console.log(`Fetching exchange rate for ${currencyCode} to USD`);
                    const exchangeRateUrl = `/api/exchange/get_exchange_rate?from_currency=${currencyCode}&to_currency=USD`;
                    console.log(`Exchange rate URL: ${exchangeRateUrl}`);
                    
                    const exchangeRateResponse = await fetch(exchangeRateUrl);
                    console.log('Exchange rate response status:', exchangeRateResponse.status);
                    
                    let exchangeRateData;
                    try {
                        exchangeRateData = await exchangeRateResponse.json();
                        console.log('Exchange rate data:', exchangeRateData);
                    } catch (parseError) {
                        console.error('Error parsing exchange rate response:', parseError);
                        showManualExchangeRateOption(currencyCode);
                        return;
                    }
                    
                    if (exchangeRateData.success) {
                        // Update the exchange rate field
                        const exchangeRateField = document.getElementById('exchange_rate');
                        console.log('Exchange rate field element:', exchangeRateField);
                        
                        if (exchangeRateField) {
                            exchangeRateField.value = exchangeRateData.rate.toFixed(4);
                            console.log(`Updated exchange rate: ${currencyCode} to USD = ${exchangeRateData.rate.toFixed(4)}`);
                            
                            // Hide manual search button if visible
                            const manualButton = document.getElementById('manual_exchange_search');
                            if (manualButton) {
                                manualButton.style.display = 'none';
                            }
                        } else {
                            console.error('Exchange rate field not found in DOM');
                        }
                    } else {
                        console.error('Exchange rate API returned success=false:', exchangeRateData);
                        showManualExchangeRateOption(currencyCode);
                    }
                } catch (error) {
                    console.error('Error fetching exchange rate:', error);
                    showManualExchangeRateOption(currencyCode);
                }
            } else if (currencyCode === 'USD') {
                // If currency is USD, set exchange rate to 1
                const exchangeRateField = document.getElementById('exchange_rate');
                if (exchangeRateField) {
                    exchangeRateField.value = '1.0000';
                    console.log('Currency is USD, set exchange rate to 1.0000');
                    
                    // Hide manual search button if visible
                    const manualButton = document.getElementById('manual_exchange_search');
                    if (manualButton) {
                        manualButton.style.display = 'none';
                    }
                } else {
                    console.error('Exchange rate field not found in DOM');
                }
            } else {
                console.warn('No valid currency code found');
            }
        } catch (error) {
            console.error('Error in loadProductsForCountry:', error);
            productTableContainer.innerHTML = `<tr><td colspan="29" style="text-align: center; color: red;">Error loading products.</td></tr>`;
        }
    }
    
    // Function to show manual exchange rate search option
    function showManualExchangeRateOption(currencyCode) {
        const exchangeRateField = document.getElementById('exchange_rate');
        if (!exchangeRateField) return;
        
        // Set placeholder text
        exchangeRateField.value = '';
        exchangeRateField.placeholder = 'Search Manually for exchange rate';
        
        // Check if button already exists
        let manualButton = document.getElementById('manual_exchange_search');
        
        // If button doesn't exist, create it
        if (!manualButton) {
            // Get the parent container of the exchange rate field
            const container = exchangeRateField.parentElement;
            
            // Create button
            manualButton = document.createElement('button');
            manualButton.id = 'manual_exchange_search';
            manualButton.type = 'button';
            manualButton.className = 'btn btn-sm btn-primary ml-2';
            manualButton.innerHTML = '<i class="fas fa-search"></i> Search';
            manualButton.style.marginLeft = '10px';
            
            // Add event listener to the button
            manualButton.addEventListener('click', function() {
                // Open exchange rate search page in a new window/tab
                window.open(`/operations/exchange_search?from_currency=${currencyCode}&to_currency=USD`, '_blank');
            });
            
            // Add button after the exchange rate field
            container.appendChild(manualButton);
        } else {
            // Update button visibility
            manualButton.style.display = 'inline-block';
        }
    }

    // --- Calculation logic for product table ---
    if (productTableContainer) {
        productTableContainer.addEventListener('input', function(event) {
            // Use event delegation to handle input changes on amount fields
            if (event.target.classList.contains('product-amount-input')) {
                const input = event.target;
                const amount = parseFloat(input.value) || 0;
                const packWeight = parseFloat(input.dataset.packWeight) || 0;
                const packCost = parseFloat(input.dataset.packCost) || 0;
                const productCode = input.dataset.productCode;

                // Calculate total weight and total cost
                const totalWeight = amount * packWeight;
                const totalCost = amount * packCost;

                // Get tax/profit percentages based on the current context
                let taxPct = 0;
                let profitPct = 0;
                if (currentCargoContext === 'outbound' && shipperCountryCodeField) {
                    taxPct = parseFloat(shipperCountryCodeField.dataset.exportTax) || 0;
                    profitPct = parseFloat(shipperCountryCodeField.dataset.exportProfit) || 0;
                } else if (currentCargoContext === 'return' && consigneeCountryCodeField) {
                    // For return, we use the consignee's country's export values
                    taxPct = parseFloat(consigneeCountryCodeField.dataset.exportTax) || 0;
                    profitPct = parseFloat(consigneeCountryCodeField.dataset.exportProfit) || 0;
                }

                // Calculate export taxes and profit
                const exportTaxes = totalCost * (taxPct / 100);
                const exporterProfit = totalCost * (profitPct / 100);

                // Find the corresponding cells to update
                const totalWeightCell = document.getElementById(`total-weight-${productCode}`);
                const totalCostCell = document.getElementById(`total-cost-${productCode}`);
                const exportTaxesCell = document.getElementById(`export-taxes-${productCode}`);
                const exporterProfitCell = document.getElementById(`exporter-profit-${productCode}`);

                // Update the cell content using the existing formatNumber helper
                if (totalWeightCell) {
                    totalWeightCell.textContent = totalWeight > 0 ? `${formatNumber(totalWeight)} kg` : '-';
                }
                if (totalCostCell) {
                    totalCostCell.textContent = totalCost > 0 ? `$${formatNumber(totalCost)}` : '-';
                }
                if (exportTaxesCell) {
                    exportTaxesCell.textContent = exportTaxes > 0 ? `$${formatNumber(exportTaxes)}` : '-';
                }
                if (exporterProfitCell) {
                    exporterProfitCell.textContent = exporterProfit > 0 ? `$${formatNumber(exporterProfit)}` : '-';
                }

                // After updating the row, update the footer totals
                updateTableTotals();
            }
        });
    }

    // --- Function to calculate and update all footer totals ---
    function updateTableTotals() {
        const rows = productTableContainer.querySelectorAll('tr');
        let totalWeight = 0;
        let totalCost = 0;
        let totalExportTaxes = 0;
        let totalExporterProfit = 0;
        // Add other total variables here as they are implemented

        rows.forEach(row => {
            const productCode = row.querySelector('.product-amount-input')?.dataset.productCode;
            if (!productCode) return;

            // Sum Total Weight
            const weightCell = document.getElementById(`total-weight-${productCode}`);
            if (weightCell && weightCell.textContent !== '-') {
                totalWeight += parseFloat(weightCell.textContent.replace(/[^\d.-]/g, '')) || 0;
            }

            // Sum Total Product Cost
            const costCell = document.getElementById(`total-cost-${productCode}`);
            if (costCell && costCell.textContent !== '-') {
                totalCost += parseFloat(costCell.textContent.replace(/[^\d.-]/g, '')) || 0;
            }

            // Sum Export Taxes
            const taxesCell = document.getElementById(`export-taxes-${productCode}`);
            if (taxesCell && taxesCell.textContent !== '-') {
                totalExportTaxes += parseFloat(taxesCell.textContent.replace(/[^\d.-]/g, '')) || 0;
            }

            // Sum Exporter Profit
            const profitCell = document.getElementById(`exporter-profit-${productCode}`);
            if (profitCell && profitCell.textContent !== '-') {
                totalExporterProfit += parseFloat(profitCell.textContent.replace(/[^\d.-]/g, '')) || 0;
            }
        });

        // Update the footer cells with the calculated totals
        const footerWeightCell = document.getElementById('footer-total-weight');
        const footerCostCell = document.getElementById('footer-total-cost');
        const footerTaxesCell = document.getElementById('footer-export-taxes');
        const footerProfitCell = document.getElementById('footer-exporter-profit');

        if (footerWeightCell) footerWeightCell.textContent = totalWeight > 0 ? `${formatNumber(totalWeight)} kg` : '-';
        if (footerCostCell) footerCostCell.textContent = totalCost > 0 ? `$${formatNumber(totalCost)}` : '-';
        if (footerTaxesCell) footerTaxesCell.textContent = totalExportTaxes > 0 ? `$${formatNumber(totalExportTaxes)}` : '-';
        if (footerProfitCell) footerProfitCell.textContent = totalExporterProfit > 0 ? `$${formatNumber(totalExporterProfit)}` : '-';
    }
});

// Set up message listener for exchange rate updates from popup window
window.addEventListener('message', function(event) {
    // Verify the message type
    if (event.data && event.data.type === 'setExchangeRate') {
        const { rate, fromCurrency, toCurrency } = event.data;
        
        // Find the exchange rate field
        const exchangeRateField = document.getElementById('exchange_rate');
        
        // Update the exchange rate value
        if (exchangeRateField) {
            exchangeRateField.value = rate;
            console.log(`Exchange rate updated from popup: ${fromCurrency} to ${toCurrency} = ${rate}`);
            
            // Hide the manual search button if it exists
            const manualButton = document.getElementById('manual_exchange_search');
            if (manualButton) {
                manualButton.style.display = 'none';
            }
        }
    }
});
