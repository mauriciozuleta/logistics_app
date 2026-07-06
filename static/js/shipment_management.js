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
    const portsWrapper = document.getElementById('ports-wrapper');

    if (tradingInfoContent) tradingInfoContent.style.display = 'none';
    if (tradingToggleBtn) tradingToggleBtn.disabled = true;
    if (logisticInfoContent) logisticInfoContent.style.display = 'none';
    if (logisticToggleBtn) logisticToggleBtn.disabled = true;
    if (productsContentWrapper) productsContentWrapper.style.display = 'none';
    if (productsToggleBtn) productsToggleBtn.disabled = true;
    if (portsWrapper) portsWrapper.style.display = 'none';

    // Expand trading info when type_of_freight is selected
    if (typeOfFreight) {
        typeOfFreight.addEventListener('change', function() {
            if (typeOfFreight.value && tradingInfoContent) {
                tradingInfoContent.style.display = '';
                if (tradingToggleBtn) tradingToggleBtn.disabled = false;
            }
            // Also show the new ports wrapper
            if (typeOfFreight.value && portsWrapper) {
                portsWrapper.style.display = 'contents';
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

    // --- Cargo Handling Cost Fetcher ---
    async function fetchCargoHandlingCost(iataCode) {
        if (!iataCode) return 0;
        try {
            const response = await fetch(`/api/airport-details?iata_code=${iataCode}`);
            if (!response.ok) {
                console.error(`Failed to fetch airport details for ${iataCode}`);
                return 0;
            }
            const data = await response.json();
            return data.cargo_handling_cost_kg || 0;
        } catch (error) {
            console.error(`Error fetching cargo handling cost for ${iataCode}:`, error);
            return 0;
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
                    if (data.total_cost) totalCost += data.total_cost; // Use the correct field 'total_cost'
                    if (data.airport_fee) totalCost += data.airport_fee; 
                    if (data.turnaround_cost) totalCost += data.turnaround_cost;
                    if (returnRouteCostField) {
                        returnRouteCostField.value = totalCost ? ('$' + totalCost.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})) : '';
                    }

                    // Sum both route cost values and populate total flight cost
                    const outboundRouteCostField = document.getElementById('route_cost');
                    const totalFlightCostDisplay = document.getElementById('total_flight_cost_display');
                    let outboundCost = outboundRouteCostField ? parseNumber(outboundRouteCostField.value) : 0;
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
    const filterCategoryInput = document.getElementById('filter_category');
    let currentCargoContext = null; // To track if we are editing outbound or return cargo

    // Filter the rendered product rows by category as the user types
    function applyCategoryFilter() {
        if (!filterCategoryInput || !productTableContainer) return;
        const term = filterCategoryInput.value.trim().toLowerCase();
        productTableContainer.querySelectorAll('tr[data-product-id]').forEach(row => {
            const category = (row.getAttribute('data-category') || '').toLowerCase();
            row.style.display = (!term || category.includes(term)) ? '' : 'none';
        });
    }

    if (filterCategoryInput) {
        filterCategoryInput.addEventListener('input', applyCategoryFilter);
    }
    
    // Global variables for cargo handling costs
    let outboundCargoHandlingCost = 0;
    let returnCargoHandlingCost = 0;

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
                    consigneeCountryCodeField.dataset.importTaxes = data.import_taxes || 0;
                    consigneeCountryCodeField.dataset.importOtherTaxes = data.import_other_taxes || 0;
                }

                // --- Generate Shipment Reference ---
                generateShipmentReference();
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
                    shipperCountryCodeField.dataset.importTaxes = data.import_taxes || 0;
                    shipperCountryCodeField.dataset.importOtherTaxes = data.import_other_taxes || 0;
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
                if (data.route_cost) {
                    routeCostField.value = '$' + data.route_cost.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
                } else {
                    routeCostField.value = '';
                }
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
        addCargoOutboundBtn.addEventListener('click', async function() {
            const countryCode = shipperCountryCodeField.value;
            if (countryCode) {
                currentCargoContext = 'outbound'; // Set context
                
                // Get IATA codes for both departure and arrival airports
                const departureIata = document.getElementById('port_of_shipping').value.trim().toUpperCase();
                const arrivalIata = document.getElementById('consignee_port_of_shipping').value.trim().toUpperCase();
                
                // Fetch and store handling costs for BOTH airports
                outboundCargoHandlingCost = await fetchCargoHandlingCost(departureIata);
                returnCargoHandlingCost = await fetchCargoHandlingCost(arrivalIata);
                console.log(`Outbound context: Departure Cost=${outboundCargoHandlingCost}, Arrival Cost=${returnCargoHandlingCost}`);
                
                // Load products for country
                await loadProductsForCountry(countryCode);

                if (typeof window.autoFillCargo === 'function') {
                    await window.autoFillCargo('outbound');
                }
                
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
        addCargoReturnBtn.addEventListener('click', async function() {
            const countryCode = consigneeCountryCodeField.value;
            if (countryCode) {
                currentCargoContext = 'return'; // Set context
                
                // Get IATA codes for both departure and arrival airports
                const departureIata = document.getElementById('port_of_shipping').value.trim().toUpperCase();
                const arrivalIata = document.getElementById('consignee_port_of_shipping').value.trim().toUpperCase();
                
                // Fetch and store handling costs for BOTH airports
                outboundCargoHandlingCost = await fetchCargoHandlingCost(departureIata);
                returnCargoHandlingCost = await fetchCargoHandlingCost(arrivalIata);
                console.log(`Return context: Departure Cost=${outboundCargoHandlingCost}, Arrival Cost=${returnCargoHandlingCost}`);
                
                // Load products for country
                await loadProductsForCountry(countryCode);

                if (typeof window.autoFillCargo === 'function') {
                    await window.autoFillCargo('return');
                }
                
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
        const comparativePrice = product.comparative_price ? `$${formatNumber(product.comparative_price)}` : '-';
        return `
            <tr data-product-id="${product.id || product.product_id}" data-category="${product.product_type || ''}">
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
                           data-product-code="${product.product_code}"
                           data-units-per-pack="${product.units_per_pack || 1}">
                </td>
                <td id="total-weight-${product.product_code}" style="text-align: right; color: #b64545;">-</td>
                <td id="total-cost-${product.product_code}" style="text-align: right; color: #b64545;">-</td>
                <td id="export-taxes-${product.product_code}" style="text-align: right; color: #b64545;">-</td>
                <td id="exporter-profit-${product.product_code}" style="text-align: right; color: #b64545;">-</td>
                <td id="fca-cost-${product.product_code}" style="text-align: right; color: #b64545;">-</td>
                <td id="fca-usd-${product.product_code}" style="text-align: right; color: #8f7d16;">-</td>
                <td id="cargo-load-cost-${product.product_code}" style="text-align: right; color: #8f7d16;">-</td>
                <td id="air-freight-cost-${product.product_code}" style="text-align: right; color: #8f7d16;">-</td>
                <td id="cargo-unload-cost-${product.product_code}" style="text-align: right; color: #8f7d16;">-</td>
                <td id="cip-cost-${product.product_code}" style="text-align: right; color: #8f7d16;">-</td>
                <td id="import-taxes-${product.product_code}" style="text-align: right; color: #8f7d16;">-</td>
                <td id="dat-kg-cost-${product.product_code}" style="text-align: right; color: #8f7d16;">-</td>
                <td id="dat-ea-cost-${product.product_code}" style="text-align: right; color: #8f7d16;">-</td>
                <td id="comparative-price-${product.product_code}" style="text-align: right; color: #8f7d16;">${comparativePrice}</td>
                <td id="sug-prod-prof-${product.product_code}" style="text-align: right; color: #8f7d16;">-</td>
                <td id="product-profit-container-${product.product_code}" style="text-align: center; color: #8f7d16; white-space: nowrap;">
                    <input type="number" class="product-profit-pct-input" data-product-code="${product.product_code}" style="width: 60px; text-align: right;" placeholder="%"> % /
                    <span id="product-profit-amount-${product.product_code}" style="margin: 0 5px; font-weight: bold; color: cyan;"></span> /
                    <span id="product-profit-price-${product.product_code}" style="font-weight: bold;"></span>
                </td>
                <td id="final-dat-price-${product.product_code}" style="text-align: right; color: #8f7d16; white-space: nowrap;">-</td>
                <td id="total-pr-cost-dat-${product.product_code}" style="text-align: right; color: #8f7d16;">-</td>
                <td id="total-dat-profit-${product.product_code}" style="text-align: right; color: #8f7d16;">-</td>
                <td id="total-shipment-dat-cost-${product.product_code}" style="text-align: right; color: #8f7d16;">-</td>
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
            
            let products = data.products;

            // --- Fetch competitive prices for the destination country ---
            let destinationCountryCode;
            if (currentCargoContext === 'outbound') {
                destinationCountryCode = document.getElementById('consignee_country_code').value;
            } else if (currentCargoContext === 'return') {
                destinationCountryCode = document.getElementById('shipper_country_code').value;
            }

            if (destinationCountryCode) {
                const pricesResponse = await fetch(`/api/product_prices?consignee_country_code=${destinationCountryCode}`);
                if (pricesResponse.ok) {
                    const priceMap = await pricesResponse.json();
                    // Add the competitive price to each product object
                    products = products.map(p => {
                        p.comparative_price = priceMap[p.id] || null;
                        return p;
                    });
                }
            }
            
            // Render products in the table
            productTableContainer.innerHTML = (products && products.length > 0)
                ? products.map(createProductRow).join('')
                : `<tr><td colspan="29" style="text-align: center;">No products found for this country.</td></tr>`;

            // Re-apply any active category filter to the newly rendered rows
            applyCategoryFilter();

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
                        
                        if (exchangeRateField && exchangeRateData.rate > 0) {
                            const directRate = exchangeRateData.rate;
                            const inverseRate = 1 / directRate;

                            const directRateStr = directRate.toFixed(4);
                            const inverseRateStr = inverseRate.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0});

                            const displayText = `${directRateStr} usd / ${inverseRateStr} ${currencyCode.toLowerCase()}`;
                            exchangeRateField.textContent = displayText;
                            
                            console.log(`Updated exchange rate display: ${displayText}`);
                            
                            // Hide manual search button if visible
                            const manualButton = document.getElementById('manual_exchange_search');
                            if (manualButton) {
                                manualButton.style.display = 'none'; // Hide button on success
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
                    exchangeRateField.textContent = '1.0000 usd / 1.00 usd';
                    console.log('Currency is USD, set exchange rate to 1.0000');
                    
                    // Hide manual search button if visible
                    const manualButton = document.getElementById('manual_exchange_search');
                    if (manualButton) {
                        manualButton.style.display = 'none'; // Hide button on success
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

        // Change the text to "Enter Manually" and make it clickable
        exchangeRateField.textContent = 'Enter Manually';
        exchangeRateField.style.cursor = 'pointer';
        exchangeRateField.style.textDecoration = 'underline';

        // Remove any existing click listener to avoid duplicates
        if (exchangeRateField.manualSearchListener) {
            exchangeRateField.removeEventListener('click', exchangeRateField.manualSearchListener);
        }

        // Define the new listener
        exchangeRateField.manualSearchListener = function() {
            window.open(`/operations/exchange_search?from_currency=${currencyCode}&to_currency=USD`, '_blank', 'width=800,height=600');
        };

        // Add the new click listener
        exchangeRateField.addEventListener('click', exchangeRateField.manualSearchListener);
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
                
                // Calculate FCA Cost (sum of totalCost + exportTaxes + exporterProfit)
                const fcaCost = totalCost + exportTaxes + exporterProfit;
                
                // Calculate FCA USD (fcaCost * exchange_rate)
                const exchangeRateDiv = document.getElementById('exchange_rate');
                let exchangeRate = 0;
                if (exchangeRateDiv && exchangeRateDiv.textContent) {
                    // Parse the rate from text like "0.0003 usd / 3,800 cop"
                    const rateMatch = exchangeRateDiv.textContent.match(/^[0-9.]+/);
                    exchangeRate = rateMatch ? parseFloat(rateMatch[0]) : 0;
                }
                
                const fcaUsd = (exchangeRate > 0) ? fcaCost * exchangeRate : 0;

                // Find the corresponding cells to update
                const totalWeightCell = document.getElementById(`total-weight-${productCode}`);
                const totalCostCell = document.getElementById(`total-cost-${productCode}`);
                const exportTaxesCell = document.getElementById(`export-taxes-${productCode}`);
                const exporterProfitCell = document.getElementById(`exporter-profit-${productCode}`);
                const fcaCostCell = document.getElementById(`fca-cost-${productCode}`);
                const fcaUsdCell = document.getElementById(`fca-usd-${productCode}`);

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
                if (fcaCostCell) {
                    fcaCostCell.textContent = fcaCost > 0 ? `$${formatNumber(fcaCost)}` : '-';
                }
                if (fcaUsdCell) {
                    fcaUsdCell.textContent = fcaUsd > 0 ? `$${formatNumber(fcaUsd)}` : '-';
                }

                // After updating the row, update the footer totals
                updateTableTotals(); // This call updates the row's Total Weight cell.

                // Now that Total Weight is updated, calculate the costs that depend on it.
                const cargoHandlingCost = (currentCargoContext === 'outbound') ? outboundCargoHandlingCost : returnCargoHandlingCost;
                if (typeof window.updateCargoLoadCost === 'function') {
                    window.updateCargoLoadCost(currentCargoContext, cargoHandlingCost);
                }

                const cargoUnloadHandlingCost = (currentCargoContext === 'outbound') ? returnCargoHandlingCost : outboundCargoHandlingCost;
                if (typeof window.updateCargoUnloadCost === 'function') {
                    window.updateCargoUnloadCost(currentCargoContext, cargoUnloadHandlingCost);
                }

                if (typeof window.updateAirFreightCost === 'function') {
                    window.updateAirFreightCost(currentCargoContext);
                }

                // After all individual costs are calculated, update the footer totals again
                // to sum the new cargo load/unload and air freight costs.
                updateTableTotals();

                // After all other costs are calculated, update the CIP cost
                if (typeof window.updateCipCost === 'function') {
                    window.updateCipCost();
                }

                // After CIP cost is calculated, update the Import Taxes and DAT cost
                if (typeof window.updateImportTaxesAndDAT === 'function') {
                    window.updateImportTaxesAndDAT(currentCargoContext);
                }

                updateTableTotals(); // Final call to sum CIP costs into the footer
            }
        });

        // --- Event delegation for new Product Profit % input ---
        productTableContainer.addEventListener('input', function(event) {
            if (event.target.classList.contains('product-profit-pct-input')) {
                const input = event.target;
                const productCode = input.dataset.productCode;
                const profitPct = parseFloat(input.value) || 0;

                // --- Rebuilt logic for 'final DAT price (KG/EA)' ---
                const amountInput = document.querySelector(`.product-amount-input[data-product-code="${productCode}"]`);
                const datKgCostCell = document.getElementById(`dat-kg-cost-${productCode}`);
                const profitAmountCell = document.getElementById(`product-profit-amount-${productCode}`);
                const profitPriceCell = document.getElementById(`product-profit-price-${productCode}`);
                const finalDatPriceCell = document.getElementById(`final-dat-price-${productCode}`);
                const totalShipmentDatCostCell = document.getElementById(`total-shipment-dat-cost-${productCode}`);
                const totalDatProfitCell = document.getElementById(`total-dat-profit-${productCode}`);
                const totalWeightCell = document.getElementById(`total-weight-${productCode}`);
                const totalPrCostDatCell = document.getElementById(`total-pr-cost-dat-${productCode}`);

                if (amountInput && datKgCostCell && profitAmountCell && profitPriceCell && finalDatPriceCell && totalShipmentDatCostCell && totalDatProfitCell && totalWeightCell && totalPrCostDatCell) {
                    const datKgCost = parseNumber(datKgCostCell.textContent);
                    const packWeight = parseFloat(amountInput.dataset.packWeight) || 0;
                    const unitsPerPack = parseFloat(amountInput.dataset.unitsPerPack) || 1;

                    if (datKgCost > 0) {
                        // 1. Calculate the final price per KG ($ Kg.)
                        const finalKgPrice = datKgCost * (1 + (profitPct / 100));
                        profitPriceCell.textContent = `$${formatNumber(finalKgPrice)}`; // This is the $ Kg value

                        // 2. Calculate the profit amount ($ Profit)
                        const profitAmount = finalKgPrice - datKgCost;
                        profitAmountCell.textContent = `$${formatNumber(profitAmount)}`;

                        // 3. Calculate the final price per EA using the new logic.
                        const finalEaPrice = (packWeight > 0 && unitsPerPack > 0) ? (finalKgPrice * packWeight) / unitsPerPack : 0;
                        finalDatPriceCell.innerHTML = `$${formatNumber(finalKgPrice)} / <span style="color: cyan;">$${formatNumber(finalEaPrice)}</span>`;

                        // 4. Calculate "Total Shipment DAT cost"
                        const totalWeight = parseNumber(totalWeightCell.textContent);
                        const totalShipmentDatCost = finalKgPrice * totalWeight;
                        totalShipmentDatCostCell.textContent = `$${formatNumber(totalShipmentDatCost)}`;

                        // 5. Calculate "Total DAT Profit"
                        const totalPrCostDat = parseNumber(totalPrCostDatCell.textContent);
                        const totalDatProfit = totalShipmentDatCost - totalPrCostDat;
                        totalDatProfitCell.textContent = `$${formatNumber(totalDatProfit)}`;
                    } else {
                        profitAmountCell.textContent = '';
                        profitPriceCell.textContent = '';
                        finalDatPriceCell.textContent = '-';
                        totalShipmentDatCostCell.textContent = '-';
                        totalDatProfitCell.textContent = '-';
                    }

                    // Trigger a footer update after these calculations
                    updateTableTotals();
                }
            }
        });

        // --- Event delegation for the new copy-profit arrow ---
        productTableContainer.addEventListener('click', function(event) {
            if (event.target.classList.contains('copy-profit-arrow')) {
                const productCode = event.target.dataset.productCode;
                const sugProfitCell = document.getElementById(`sug-prod-prof-${productCode}`);
                const profitPctInput = document.querySelector(`.product-profit-pct-input[data-product-code="${productCode}"]`);

                if (sugProfitCell && profitPctInput) {
                    const sugProfitText = sugProfitCell.innerText; // Use innerText to get only the visible text
                    const percentageMatch = sugProfitText.match(/^(-?\d+\.?\d*)/);
                    profitPctInput.value = percentageMatch ? percentageMatch[1] : '';
                    profitPctInput.dispatchEvent(new Event('input', { bubbles: true })); // Trigger calculation
                }
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
        let totalFcaCost = 0;
        let totalFcaUsd = 0;
        let totalCargoLoadCost = 0;
        let totalAirFreightCost = 0;
        let totalCargoUnloadCost = 0;
        let totalCipCost = 0;
        let totalImportTaxes = 0;
        let totalPrCostDat = 0;
        let totalDatProfit = 0;
        let totalShipmentDatCost = 0;

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
            
            // Sum FCA Cost
            const fcaCostCell = document.getElementById(`fca-cost-${productCode}`);
            if (fcaCostCell && fcaCostCell.textContent !== '-') {
                totalFcaCost += parseFloat(fcaCostCell.textContent.replace(/[^\d.-]/g, '')) || 0;
            }
            
            // Sum FCA USD
            const fcaUsdCell = document.getElementById(`fca-usd-${productCode}`);
            if (fcaUsdCell && fcaUsdCell.textContent !== '-') {
                totalFcaUsd += parseFloat(fcaUsdCell.textContent.replace(/[^\d.-]/g, '')) || 0;
            }
            
            // Sum Cargo Load Cost
            const cargoLoadCostCell = document.getElementById(`cargo-load-cost-${productCode}`);
            if (cargoLoadCostCell && cargoLoadCostCell.textContent !== '-') {
                totalCargoLoadCost += parseFloat(cargoLoadCostCell.textContent.replace(/[^\d.-]/g, '')) || 0;
            }

            // Sum Air Freight Cost
            const airFreightCostCell = document.getElementById(`air-freight-cost-${productCode}`);
            if (airFreightCostCell && airFreightCostCell.textContent !== '-') {
                totalAirFreightCost += parseFloat(airFreightCostCell.textContent.replace(/[^\d.-]/g, '')) || 0;
            }

            // Sum Cargo Unload Cost
            const cargoUnloadCostCell = document.getElementById(`cargo-unload-cost-${productCode}`);
            if (cargoUnloadCostCell && cargoUnloadCostCell.textContent !== '-') {
                totalCargoUnloadCost += parseFloat(cargoUnloadCostCell.textContent.replace(/[^\d.-]/g, '')) || 0;
            }

            // Sum CIP Cost
            const cipCostCell = document.getElementById(`cip-cost-${productCode}`);
            if (cipCostCell && cipCostCell.textContent !== '-') {
                totalCipCost += parseFloat(cipCostCell.textContent.replace(/[^\d.-]/g, '')) || 0;
            }

            // Sum Import Taxes
            const importTaxesCell = document.getElementById(`import-taxes-${productCode}`);
            if (importTaxesCell && importTaxesCell.textContent !== '-') {
                totalImportTaxes += parseFloat(importTaxesCell.textContent.replace(/[^\d.-]/g, '')) || 0;
            }

            // Sum Total Pr. Cost DAT
            const totalPrCostDatCell = document.getElementById(`total-pr-cost-dat-${productCode}`);
            if (totalPrCostDatCell && totalPrCostDatCell.textContent !== '-') {
                totalPrCostDat += parseFloat(totalPrCostDatCell.textContent.replace(/[^\d.-]/g, '')) || 0;
            }

            // Sum Total DAT Profit
            const totalDatProfitCell = document.getElementById(`total-dat-profit-${productCode}`);
            if (totalDatProfitCell && totalDatProfitCell.textContent !== '-') {
                totalDatProfit += parseFloat(totalDatProfitCell.textContent.replace(/[^\d.-]/g, '')) || 0;
            }

            // Sum Total Shipment DAT Cost
            const totalShipmentDatCostCell = document.getElementById(`total-shipment-dat-cost-${productCode}`);
            if (totalShipmentDatCostCell && totalShipmentDatCostCell.textContent !== '-') {
                totalShipmentDatCost += parseFloat(totalShipmentDatCostCell.textContent.replace(/[^\d.-]/g, '')) || 0;
            }
        });

        // Update the footer cells with the calculated totals
        const footerWeightCell = document.getElementById('footer-total-weight');
        const footerCostCell = document.getElementById('footer-total-cost');
        const footerTaxesCell = document.getElementById('footer-export-taxes');
        const footerProfitCell = document.getElementById('footer-exporter-profit');
        const footerFcaCostCell = document.getElementById('footer-fca-cost');
        const footerFcaUsdCell = document.getElementById('footer-fca-usd');
        const footerCargoLoadCostCell = document.getElementById('footer-cargo-load-cost');
        const footerAirFreightCostCell = document.getElementById('footer-air-freight-cost');
        const footerCargoUnloadCostCell = document.getElementById('footer-cargo-unload-cost');
        const footerCipCostCell = document.getElementById('footer-cip-cost');
        const footerImportTaxesCell = document.getElementById('footer-import-taxes');
        const footerTotalPrCostDatCell = document.getElementById('footer-total-pr-cost-dat');
        const footerTotalDatProfitCell = document.getElementById('footer-total-dat-profit');
        const footerTotalShipmentDatCostCell = document.getElementById('footer-total-shipment-dat-cost');

        if (footerWeightCell) footerWeightCell.textContent = totalWeight > 0 ? `${formatNumber(totalWeight)} kg` : '-';
        if (footerCostCell) footerCostCell.textContent = totalCost > 0 ? `$${formatNumber(totalCost)}` : '-';
        if (footerTaxesCell) footerTaxesCell.textContent = totalExportTaxes > 0 ? `$${formatNumber(totalExportTaxes)}` : '-';
        if (footerProfitCell) footerProfitCell.textContent = totalExporterProfit > 0 ? `$${formatNumber(totalExporterProfit)}` : '-';
        if (footerFcaCostCell) footerFcaCostCell.textContent = totalFcaCost > 0 ? `$${formatNumber(totalFcaCost)}` : '-';
        if (footerFcaUsdCell) footerFcaUsdCell.textContent = totalFcaUsd > 0 ? `$${formatNumber(totalFcaUsd)}` : '-';
        if (footerCargoLoadCostCell) footerCargoLoadCostCell.textContent = totalCargoLoadCost > 0 ? `$${formatNumber(totalCargoLoadCost)}` : '-';
        if (footerAirFreightCostCell) footerAirFreightCostCell.textContent = totalAirFreightCost > 0 ? `$${formatNumber(totalAirFreightCost)}` : '-';
        if (footerCargoUnloadCostCell) footerCargoUnloadCostCell.textContent = totalCargoUnloadCost > 0 ? `$${formatNumber(totalCargoUnloadCost)}` : '-';
        if (footerCipCostCell) footerCipCostCell.textContent = totalCipCost > 0 ? `$${formatNumber(totalCipCost)}` : '-';
        if (footerImportTaxesCell) footerImportTaxesCell.textContent = totalImportTaxes > 0 ? `$${formatNumber(totalImportTaxes)}` : '-';
        if (footerTotalPrCostDatCell) footerTotalPrCostDatCell.textContent = totalPrCostDat > 0 ? `$${formatNumber(totalPrCostDat)}` : '-';
        if (footerTotalDatProfitCell) footerTotalDatProfitCell.textContent = totalDatProfit > 0 ? `$${formatNumber(totalDatProfit)}` : '-';
        if (footerTotalShipmentDatCostCell) footerTotalShipmentDatCostCell.textContent = totalShipmentDatCost > 0 ? `$${formatNumber(totalShipmentDatCost)}` : '-';
    }

    // Function to recalculate all FCA values when exchange rate changes
    function recalculateAllFcaValues() {
        const rows = productTableContainer.querySelectorAll('tr');
        const exchangeRateField = document.getElementById('exchange_rate');
        if (!productTableContainer || !exchangeRateField || !exchangeRateField.textContent) {
            return;
        }

        let exchangeRate = 0;
        if (exchangeRateField.textContent) {
            // Parse the rate from text like "0.0003 usd / 3,800 cop"
            const rateMatch = exchangeRateField.textContent.match(/^[0-9.]+/);
            exchangeRate = rateMatch ? parseFloat(rateMatch[0]) : 0;
        }

        rows.forEach(row => {
            const productCode = row.querySelector('.product-amount-input')?.dataset.productCode;
            if (!productCode) return;

            // Get FCA Cost
            const fcaCostCell = document.getElementById(`fca-cost-${productCode}`);
            if (!fcaCostCell || fcaCostCell.textContent === '-') return;

            // Parse FCA Cost value
            const fcaCost = parseFloat(fcaCostCell.textContent.replace(/[^\d.-]/g, '')) || 0;

            // Calculate new FCA USD value
            const fcaUsd = fcaCost * exchangeRate;

            // Update FCA USD cell
            const fcaUsdCell = document.getElementById(`fca-usd-${productCode}`);
            if (fcaUsdCell) {
                fcaUsdCell.textContent = fcaUsd > 0 ? `$${formatNumber(fcaUsd)}` : '-';
            }
        });

        // Update totals
        updateTableTotals();
        // After totals are updated, recalculate air freight cost
        if (typeof window.updateAirFreightCost === 'function') {
            window.updateAirFreightCost(currentCargoContext);
        }
        updateTableTotals(); // Call again to update the air freight total in the footer.
    }

    // Set up message listener for exchange rate updates from popup window
    window.addEventListener('message', function(event) {
        // Verify the message type
        if (event.data && event.data.type === 'setExchangeRate') {
            const { rate, fromCurrency, toCurrency } = event.data;
            const exchangeRateField = document.getElementById('exchange_rate');

            if (exchangeRateField) {
                // The field is a div, so we need to reconstruct the display text
                if (rate && rate > 0) {
                    const directRate = parseFloat(rate);
                    const inverseRate = 1 / directRate;
                    const directRateStr = directRate.toFixed(4);
                    const inverseRateStr = inverseRate.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0});
                    const displayText = `${directRateStr} usd / ${inverseRateStr} ${fromCurrency.toLowerCase()}`;
                    exchangeRateField.textContent = displayText;
                }
                console.log(`Exchange rate updated from popup: ${fromCurrency} to ${toCurrency} = ${rate}`);

                const manualButton = document.getElementById('manual_exchange_search');
                if (manualButton) {
                    manualButton.style.display = 'none';
                }
                recalculateAllFcaValues();
            }
        }
    });

    // Add event listener to exchange rate field for manual changes
    const exchangeRateField = document.getElementById('exchange_rate');
    if (exchangeRateField) {
        // Since it's a div, we can't use 'input'. We'll use a MutationObserver
        // to detect when its content changes.
        const observer = new MutationObserver(function(mutations) {
            recalculateAllFcaValues();
        });
        observer.observe(exchangeRateField, { childList: true, characterData: true, subtree: true });
        exchangeRateField.addEventListener('change', function() { // Fallback for any programmatic changes
            recalculateAllFcaValues();
        });
    }

    // --- API endpoint for airport details (including cargo handling cost) ---
    // This is a mock-up. You will need to create a real API endpoint in your Flask app.
    // Example: /api/airport-details?iata_code=MIA
    // This should return JSON like: { "cargo_handling_cost_kg": 0.5 }
    // For now, this is just a placeholder.
    // The actual implementation is in the `fetchCargoHandlingCost` function above.
    // No new code needed here if the endpoint exists.
    // If it doesn't, you'll need to add it to your routes.py.
    // Example route in Flask:
    /*
    @operations_api.route('/airport-details')
    def airport_details_api():
        iata_code = request.args.get('iata_code')
        # ... logic to find airport and return its details ...
    */

    // --- Shipment Reference Generation ---
    function generateShipmentReference() {
        const portOfShippingField = document.getElementById('port_of_shipping');
        const portOfArrivalField = document.getElementById('consignee_port_of_shipping');
        const shipmentRefField = document.getElementById('shipment_reference');

        if (!portOfShippingField || !portOfArrivalField || !shipmentRefField) {
            console.warn('Could not generate shipment reference: one or more fields are missing.');
            return;
        }

        const portOfShipping = portOfShippingField.value.toUpperCase();
        const portOfArrival = portOfArrivalField.value.toUpperCase();

        if (portOfShipping && portOfArrival) {
            const now = new Date();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const year = now.getFullYear();
            const dateStr = `${month}-${day}-${year}`;
            
            shipmentRefField.value = `${portOfShipping}-${portOfArrival}-${dateStr}`;
        }
    }
    
    // --- Shipment Save and Edit Functionality ---
    let currentShipmentId = null; // Used to track if we're editing an existing shipment
    
    // Add buttons to the top of the form
    function addActionButtons() {
        const container = document.querySelector('#container-1 .section-title');
        if (!container) return;
        
        // Create button container
        const buttonContainer = document.createElement('div');
        buttonContainer.style.marginLeft = 'auto';
        buttonContainer.style.display = 'flex';
        buttonContainer.style.gap = '10px';
        
        // Save button
        const saveBtn = document.createElement('button');
        saveBtn.type = 'button';
        saveBtn.id = 'save-shipment-btn';
        saveBtn.className = 'btn btn-success';
        saveBtn.textContent = 'Save Shipment';
        saveBtn.addEventListener('click', saveShipment);
        
        // New button
        const newBtn = document.createElement('button');
        newBtn.type = 'button';
        newBtn.id = 'new-shipment-btn';
        newBtn.className = 'btn btn-primary';
        newBtn.textContent = 'New Shipment';
        newBtn.addEventListener('click', resetForm);
        
        // Load button
        const loadBtn = document.createElement('button');
        loadBtn.type = 'button';
        loadBtn.id = 'load-shipment-btn';
        loadBtn.className = 'btn btn-info';
        loadBtn.textContent = 'Load Shipment';
        loadBtn.addEventListener('click', showLoadShipmentModal);
        
        // Add buttons to container
        buttonContainer.appendChild(saveBtn);
        buttonContainer.appendChild(newBtn);
        buttonContainer.appendChild(loadBtn);
        
        // Add button container to the section title
        container.appendChild(buttonContainer);
    }
    
    // Initialize buttons
    addActionButtons();
    
    // Reset form for a new shipment
    function resetForm() {
        document.querySelector('form').reset();
        currentShipmentId = null;
        
        // Clear product table
        const productTableContainer = document.getElementById('product-table-container');
        if (productTableContainer) {
            productTableContainer.innerHTML = '';
        }
        
        // Reset footer totals
        resetFooterTotals();
        
        // Generate new shipment reference
        generateShipmentReference();
        
        // Enable the "Start New Shipment" button
        const startShipmentBtn = document.getElementById('start-shipment-btn');
        if (startShipmentBtn) {
            startShipmentBtn.disabled = false;
        }
    }
    
    // Reset footer total fields
    function resetFooterTotals() {
        const totalFields = [
            'footer-total-weight',
            'footer-total-cost',
            'footer-export-taxes',
            'footer-exporter-profit',
            'footer-fca-cost',
            'footer-fca-usd',
            'footer-cargo-load-cost',
            'footer-air-freight-cost',
            'footer-cargo-unload-cost',
            'footer-cip-cost',
            'footer-import-taxes',
            'footer-total-pr-cost-dat',
            'footer-total-dat-profit',
            'footer-total-shipment-dat-cost'
        ];
        
        totalFields.forEach(id => {
            const field = document.getElementById(id);
            if (field) field.textContent = '-';
        });
    }
    
    // Show modal to load existing shipment
    function showLoadShipmentModal() {
        // Check if modal exists, if not create it
        let modal = document.getElementById('load-shipment-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'load-shipment-modal';
            modal.className = 'modal fade';
            modal.tabIndex = '-1';
            modal.role = 'dialog';
            modal.innerHTML = `
                <div class="modal-dialog modal-lg" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Load Existing Shipment</h5>
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div class="modal-body">
                            <div class="input-group mb-3">
                                <input type="text" id="shipment-search" class="form-control" placeholder="Search by reference, user, country...">
                                <div class="input-group-append">
                                    <button class="btn btn-outline-secondary" type="button" id="search-shipments-btn">Search</button>
                                </div>
                            </div>
                            <div class="table-responsive">
                                <table class="table table-striped table-hover">
                                    <thead>
                                        <tr>
                                            <th>Reference</th>
                                            <th>User</th>
                                            <th>Type</th>
                                            <th>From</th>
                                            <th>To</th>
                                            <th>Created</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody id="shipments-table-body"></tbody>
                                </table>
                            </div>
                            <div id="pagination-controls" class="mt-3"></div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            
            // Initialize search button
            document.getElementById('search-shipments-btn').addEventListener('click', function() {
                loadShipmentsList(1);
            });
            
            // Allow search on enter key
            document.getElementById('shipment-search').addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    loadShipmentsList(1);
                }
            });
        }
        
        // Show the modal and load initial data
        $(modal).modal('show');
        loadShipmentsList(1);
    }
    
    // Load shipments list for the modal
    function loadShipmentsList(page = 1) {
        const searchTerm = document.getElementById('shipment-search').value;
        const tableBody = document.getElementById('shipments-table-body');
        const paginationControls = document.getElementById('pagination-controls');
        
        // Show loading state
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Loading shipments...</td></tr>';
        
        // Fetch shipments from API
        fetch(`/api/shipments?page=${page}&per_page=10&search=${encodeURIComponent(searchTerm)}`)
            .then(response => response.json())
            .then(data => {
                if (data.success && data.shipments) {
                    if (data.shipments.length === 0) {
                        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No shipments found</td></tr>';
                        paginationControls.innerHTML = '';
                        return;
                    }
                    
                    // Populate table with shipments
                    tableBody.innerHTML = '';
                    data.shipments.forEach(shipment => {
                        const row = document.createElement('tr');
                        const createdDate = new Date(shipment.created_at).toLocaleDateString();
                        
                        row.innerHTML = `
                            <td>${shipment.shipment_reference || 'N/A'}</td>
                            <td>${shipment.shipment_user || 'N/A'}</td>
                            <td>${shipment.type_of_freight || 'N/A'}</td>
                            <td>${shipment.trading_country || 'N/A'}</td>
                            <td>${shipment.consignee_country || 'N/A'}</td>
                            <td>${createdDate}</td>
                            <td>
                                <button class="btn btn-sm btn-primary load-btn" data-id="${shipment.id}">Load</button>
                            </td>
                        `;
                        tableBody.appendChild(row);
                    });
                    
                    // Add click handlers to load buttons
                    document.querySelectorAll('.load-btn').forEach(btn => {
                        btn.addEventListener('click', function() {
                            const shipmentId = this.getAttribute('data-id');
                            loadShipmentData(shipmentId);
                            $('#load-shipment-modal').modal('hide');
                        });
                    });
                    
                    // Set up pagination
                    paginationControls.innerHTML = '';
                    if (data.pages > 1) {
                        const paginationNav = document.createElement('nav');
                        paginationNav.innerHTML = '<ul class="pagination justify-content-center"></ul>';
                        const paginationList = paginationNav.querySelector('.pagination');
                        
                        // Previous button
                        const prevItem = document.createElement('li');
                        prevItem.className = `page-item ${page === 1 ? 'disabled' : ''}`;
                        prevItem.innerHTML = `<a class="page-link" href="#" data-page="${page-1}">&laquo; Previous</a>`;
                        paginationList.appendChild(prevItem);
                        
                        // Page numbers
                        for (let i = 1; i <= data.pages; i++) {
                            const pageItem = document.createElement('li');
                            pageItem.className = `page-item ${i === page ? 'active' : ''}`;
                            pageItem.innerHTML = `<a class="page-link" href="#" data-page="${i}">${i}</a>`;
                            paginationList.appendChild(pageItem);
                        }
                        
                        // Next button
                        const nextItem = document.createElement('li');
                        nextItem.className = `page-item ${page === data.pages ? 'disabled' : ''}`;
                        nextItem.innerHTML = `<a class="page-link" href="#" data-page="${page+1}">Next &raquo;</a>`;
                        paginationList.appendChild(nextItem);
                        
                        paginationControls.appendChild(paginationNav);
                        
                        // Add event listeners to pagination links
                        paginationNav.querySelectorAll('.page-link').forEach(link => {
                            link.addEventListener('click', function(e) {
                                e.preventDefault();
                                const pageNum = parseInt(this.getAttribute('data-page'), 10);
                                if (!isNaN(pageNum) && pageNum > 0 && pageNum <= data.pages) {
                                    loadShipmentsList(pageNum);
                                }
                            });
                        });
                    }
                } else {
                    tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Error loading shipments</td></tr>';
                }
            })
            .catch(error => {
                console.error('Error loading shipments:', error);
                tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Error loading shipments</td></tr>';
            });
    }
    
    // Load a specific shipment for editing
    function loadShipmentData(shipmentId) {
        fetch(`/api/shipments/${shipmentId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success && data.shipment) {
                    const shipment = data.shipment;
                    currentShipmentId = shipment.id;
                    
                    // Set the form fields from the shipment data
                    document.getElementById('shipment_reference').value = shipment.shipment_reference || '';
                    document.getElementById('shipment_user').value = shipment.shipment_user || '';
                    
                    // Set type of freight and show appropriate sections
                    const typeOfFreightSelect = document.getElementById('type_of_freight');
                    typeOfFreightSelect.value = shipment.type_of_freight || '';
                    if (shipment.type_of_freight) {
                        document.getElementById('type-of-freight-wrapper').style.display = 'flex';
                        document.getElementById('ports-wrapper').style.display = 'contents';
                        document.getElementById('trading-info-content').style.display = '';
                        document.getElementById('toggle-trading-btn').disabled = false;
                    }
                    
                    // Set ports
                    document.getElementById('port_of_shipping').value = shipment.port_of_shipping || '';
                    document.getElementById('consignee_port_of_shipping').value = shipment.consignee_port_of_shipping || '';
                    
                    // Enable logistic section if port of arrival is set
                    if (shipment.consignee_port_of_shipping) {
                        document.getElementById('logistic-info-content').style.display = '';
                        document.getElementById('toggle-logistic-btn').disabled = false;
                    }
                    
                    // Trading info
                    setSelectValue('trading_region', shipment.trading_region);
                    document.getElementById('trading_regional_manager').value = shipment.trading_regional_manager || '';
                    setSelectValue('trading_country', shipment.trading_country);
                    setSelectValue('trading_branch', shipment.trading_branch);
                    
                    setSelectValue('consignee_region', shipment.consignee_region);
                    document.getElementById('consignee_regional_manager').value = shipment.consignee_regional_manager || '';
                    setSelectValue('consignee_country', shipment.consignee_country);
                    setSelectValue('consignee_branch', shipment.consignee_branch);
                    
                    // Logistic info
                    setSelectValue('departure_route', shipment.departure_route);
                    document.getElementById('route_cost').value = shipment.route_cost || '';
                    document.getElementById('available_payload').value = shipment.available_payload || '';
                    setSelectValue('type_of_return', shipment.type_of_return);
                    document.getElementById('outbound_cost_weight').value = shipment.outbound_cost_weight || '';
                    document.getElementById('target_cargo_load').value = shipment.target_cargo_load || '';
                    document.getElementById('est_outb_kg_cost').value = shipment.est_outb_kg_cost || '';
                    
                    // Return route
                    setSelectValue('return_route', shipment.return_route);
                    document.getElementById('route_cost_return').value = shipment.route_cost_return || '';
                    document.getElementById('available_payload_return').value = shipment.available_payload_return || '';
                    document.getElementById('total_flight_cost_display').textContent = formatCurrency(shipment.total_flight_cost_display);
                    document.getElementById('return_cost_weight').value = shipment.return_cost_weight || '';
                    document.getElementById('target_cargo_load_return_percentage').value = shipment.target_cargo_load_return_percentage || '';
                    document.getElementById('est_ret_kg_cost').value = shipment.est_ret_kg_cost || '';
                    
                    // Enable products section if type_of_return is set
                    if (shipment.type_of_return) {
                        document.getElementById('products-content-wrapper').style.display = '';
                        document.getElementById('toggle-products-btn').disabled = false;
                    }
                    
                    // Load products into the table
                    loadProductsToTable(shipment.products || []);
                    
                    // Update calculated fields and footer totals
                    updateCalculatedFields();
                    updateFooterTotals();
                    
                    // Disable the "Start New Shipment" button if editing
                    const startShipmentBtn = document.getElementById('start-shipment-btn');
                    if (startShipmentBtn) {
                        startShipmentBtn.disabled = true;
                    }
                }
            })
            .catch(error => {
                console.error('Error loading shipment:', error);
                alert('Error loading shipment data. Please try again.');
            });
    }
    
    // Helper function to set select values (with proper event triggering if needed)
    function setSelectValue(selectId, value) {
        const select = document.getElementById(selectId);
        if (select && value) {
            select.value = value;
            // Trigger change event if needed for dependent selects
            const event = new Event('change', { bubbles: true });
            select.dispatchEvent(event);
        }
    }
    
    // Helper to format currency values
    function formatCurrency(value) {
        if (!value) return '';
        const num = parseFloat(value);
        if (isNaN(num)) return '';
        return '$' + num.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    }
    
    // Load products into the product table
    function loadProductsToTable(products) {
        const tableBody = document.getElementById('product-table-container');
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        
        if (!products.length) return;
        
        // Global map (attach to window once) to resolve product ids by code
        if (!window.productIdByCode) window.productIdByCode = {};

        products.forEach(product => {
            const row = document.createElement('tr');
            // API returns 'id' not 'product_id'; normalize
            const resolvedId = product.product_id || product.id;
            if (!resolvedId) {
                console.warn('[loadProductsToTable] Product missing id field', product);
            }
            row.dataset.productId = resolvedId || '';
            row.dataset.category = product.product_type || product.product_category || '';
            // Also keep code mapping for later fallback
            const codeForMap = product.product_code || '';
            if (codeForMap) {
                window.productIdByCode[codeForMap] = resolvedId;
            }
            
            row.innerHTML = `
                <td>${product.product_code || ''}</td>
                <td>${product.name || product.product_name || ''}</td>
                <td>${product.product_type || product.product_category || ''}</td>
                <td>${product.country_id || ''}</td>
                <td>${product.packaging || ''}</td>
                <td>${formatNumber(product.packaging_weight || product.pack_weight)}</td>
                <td>${formatNumber(product.units_per_pack)}</td>
                <td>${formatNumber(product.packaging_cost)}</td>
                <td>${product.currency || ''}</td>
                <td><input type="number" class="form-control product-quantity product-amount-input" data-product-code="${product.product_code || ''}" value="${product.quantity || 0}" min="0" step="1"></td>
                <td>${formatNumber(product.total_weight)}</td>
                <td>${formatCurrency(product.total_product_cost)}</td>
                <td>${formatCurrency(product.export_taxes)}</td>
                <td>${formatCurrency(product.exporter_profit)}</td>
                <td>${formatCurrency(product.fca_cost)}</td>
                <td>${formatCurrency(product.fca_usd)}</td>
                <td>${formatCurrency(product.cargo_load_cost)}</td>
                <td>${formatCurrency(product.air_freight_cost)}</td>
                <td>${formatCurrency(product.cargo_unload_cost)}</td>
                <td>${formatCurrency(product.cip_cost)}</td>
                <td>${formatCurrency(product.import_taxes)}</td>
                <td>${formatCurrency(product.dat_kg_cost)}</td>
                <td>${formatCurrency(product.dat_ea_cost)}</td>
                <td>${formatCurrency(product.comparative_price)}</td>
                <td>${formatCurrency(product.sug_prod_prof_ea)}</td>
                <td>${formatNumber(product.product_profit_percentage)}% / ${formatCurrency(product.product_profit_amount)} / ${formatCurrency(product.product_profit_per_kg)}</td>
                <td>${formatCurrency(product.final_dat_price_ea)}</td>
                <td>${formatCurrency(product.total_pr_cost_dat)}</td>
                <td>${formatCurrency(product.total_dat_profit)}</td>
                <td>${formatCurrency(product.total_shipment_dat_cost)}</td>
            `;
            
            tableBody.appendChild(row);
            
            // Add event listener to quantity input
            const quantityInput = row.querySelector('.product-quantity');
            if (quantityInput) {
                quantityInput.addEventListener('change', function() {
                    // Recalculate product values based on new quantity
                    // This would need to call your existing calculation functions
                });
            }
        });
        
        updateFooterTotals();
        applyCategoryFilter();
    }

    // Helper to format numbers
    function formatNumber(value) {
        if (value === null || value === undefined) return '';
        const num = parseFloat(value);
        return isNaN(num) ? '' : num.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    }
    
    // Update footer totals based on product table values
    function updateFooterTotals() {
        // Implementation depends on your table structure and calculation needs
        // This is a placeholder for the actual implementation
        console.log('Updating footer totals...');
        
        // Example implementation:
        const footerFields = {
            'total_weight': 'footer-total-weight',
            'total_product_cost': 'footer-total-cost',
            'export_taxes': 'footer-export-taxes',
            'exporter_profit': 'footer-exporter-profit',
            'fca_cost': 'footer-fca-cost',
            'fca_usd': 'footer-fca-usd',
            'cargo_load_cost': 'footer-cargo-load-cost',
            'air_freight_cost': 'footer-air-freight-cost',
            'cargo_unload_cost': 'footer-cargo-unload-cost',
            'cip_cost': 'footer-cip-cost',
            'import_taxes': 'footer-import-taxes',
            'total_pr_cost_dat': 'footer-total-pr-cost-dat',
            'total_dat_profit': 'footer-total-dat-profit',
            'total_shipment_dat_cost': 'footer-total-shipment-dat-cost'
        };
        
        // Get all product rows
        const rows = document.querySelectorAll('#product-table-container tr');
        
        // Initialize totals
        const totals = {
            'total_weight': 0,
            'total_product_cost': 0,
            'export_taxes': 0,
            'exporter_profit': 0,
            'fca_cost': 0,
            'fca_usd': 0,
            'cargo_load_cost': 0,
            'air_freight_cost': 0,
            'cargo_unload_cost': 0,
            'cip_cost': 0,
            'import_taxes': 0,
            'total_pr_cost_dat': 0,
            'total_dat_profit': 0,
            'total_shipment_dat_cost': 0
        };
        
        // Sum up the values from each row
        // This would need to be adjusted based on your actual table structure
        // and which columns correspond to which totals
    }
    
    // Save the shipment data
    function saveShipment() {
        // Validate form data first
        if (!validateShipmentForm()) {
            return;
        }
        
        // Collect form data
        const formData = collectShipmentFormData();
        
        // Determine if this is a create or update operation
        const url = currentShipmentId ? `/api/shipments/${currentShipmentId}` : '/api/shipments';
        const method = currentShipmentId ? 'PUT' : 'POST';
        
        // Get CSRF token
        const csrfToken = document.querySelector('input[name="csrf_token"]').value;
        
        console.debug('[SAVE_SHIPMENT] About to send request', { method, url, csrfTokenPresent: !!csrfToken, formDataPreview: { ...formData, products: `count:${formData.products.length}` } });

        // Send data to server
        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify(formData)
        })
        .then(response => {
            if (!response.ok) {
                console.error('[SAVE_SHIPMENT] Non-OK HTTP status', response.status, response.statusText);
                return response.text().then(t => { throw new Error(`HTTP ${response.status}: ${t}`); });
            }
            return response.json().catch(err => {
                console.error('[SAVE_SHIPMENT] Failed to parse JSON', err);
                throw new Error('Failed to parse server response as JSON');
            });
        })
        .then(data => {
            console.debug('[SAVE_SHIPMENT] Server response', data);
            if (data.success) {
                alert(`Shipment ${data.shipment_reference || ''} saved successfully!`);
                // If this was a new shipment, update the current ID
                if (!currentShipmentId && data.shipment_id) {
                    currentShipmentId = data.shipment_id;
                }
            } else {
                alert(`Error saving shipment: ${data.error || 'Unknown error'}`);
            }
        })
        .catch(error => {
            console.error('Error saving shipment:', error);
            alert('Error saving shipment. Please try again.');
        });
    }
    
    // Validate the shipment form
    function validateShipmentForm() {
        // Required fields to check
        const requiredFields = [
            { id: 'shipment_user', name: 'Shipment User' },
            { id: 'type_of_freight', name: 'Type of Freight' },
            { id: 'port_of_shipping', name: 'Port of Shipping' },
            { id: 'consignee_port_of_shipping', name: 'Port of Arrival' }
        ];
        
        let isValid = true;
        let errorMessage = 'Please fill in the following required fields:\n';
        
        // Check each required field
        requiredFields.forEach(field => {
            const element = document.getElementById(field.id);
            if (!element || !element.value.trim()) {
                errorMessage += `- ${field.name}\n`;
                isValid = false;
                
                // Highlight the field
                if (element) {
                    element.classList.add('is-invalid');
                    element.addEventListener('input', function() {
                        if (this.value.trim()) {
                            this.classList.remove('is-invalid');
                        }
                    });
                }
            }
        });
        
        if (!isValid) {
            alert(errorMessage);
        }
        
        return isValid;
    }
    
    // Collect form data for submission
    function collectShipmentFormData() {
        const formData = {
            shipment_reference: document.getElementById('shipment_reference').value,
            shipment_user: document.getElementById('shipment_user').value,
            type_of_freight: document.getElementById('type_of_freight').value,
            port_of_shipping: document.getElementById('port_of_shipping').value,
            consignee_port_of_shipping: document.getElementById('consignee_port_of_shipping').value,
            
            // Trading Info
            trading_region: getSelectValue('trading_region'),
            trading_regional_manager: document.getElementById('trading_regional_manager').value,
            trading_country: getSelectValue('trading_country'),
            trading_branch: getSelectValue('trading_branch'),
            consignee_region: getSelectValue('consignee_region'),
            consignee_regional_manager: document.getElementById('consignee_regional_manager').value,
            consignee_country: getSelectValue('consignee_country'),
            consignee_branch: getSelectValue('consignee_branch'),
            
            // Logistic Info
            departure_route: getSelectValue('departure_route'),
            route_cost: parseNumber(document.getElementById('route_cost').value),
            available_payload: parseNumber(document.getElementById('available_payload').value),
            type_of_return: getSelectValue('type_of_return'),
            outbound_cost_weight: parseNumber(document.getElementById('outbound_cost_weight').value),
            target_cargo_load: parseNumber(document.getElementById('target_cargo_load').value),
            est_outb_kg_cost: parseNumber(document.getElementById('est_outb_kg_cost').value),
            return_route: getSelectValue('return_route'),
            route_cost_return: parseNumber(document.getElementById('route_cost_return').value),
            available_payload_return: parseNumber(document.getElementById('available_payload_return').value),
            total_flight_cost_display: parseNumber(document.getElementById('total_flight_cost_display').textContent),
            return_cost_weight: parseNumber(document.getElementById('return_cost_weight').value),
            target_cargo_load_return_percentage: parseNumber(document.getElementById('target_cargo_load_return_percentage').value),
            est_ret_kg_cost: parseNumber(document.getElementById('est_ret_kg_cost').value),
            
            // Footer Totals (get these from the footer cells)
            total_weight: parseNumber(document.getElementById('footer-total-weight').textContent),
            total_product_cost: parseNumber(document.getElementById('footer-total-cost').textContent),
            total_export_taxes: parseNumber(document.getElementById('footer-export-taxes').textContent),
            total_exporter_profit: parseNumber(document.getElementById('footer-exporter-profit').textContent),
            total_fca_cost: parseNumber(document.getElementById('footer-fca-cost').textContent),
            total_fca_usd: parseNumber(document.getElementById('footer-fca-usd').textContent),
            total_cargo_load_cost: parseNumber(document.getElementById('footer-cargo-load-cost').textContent),
            total_air_freight_cost: parseNumber(document.getElementById('footer-air-freight-cost').textContent),
            total_cargo_unload_cost: parseNumber(document.getElementById('footer-cargo-unload-cost').textContent),
            total_cip_cost: parseNumber(document.getElementById('footer-cip-cost').textContent),
            total_import_taxes: parseNumber(document.getElementById('footer-import-taxes').textContent),
            total_pr_cost_dat: parseNumber(document.getElementById('footer-total-pr-cost-dat').textContent),
            total_dat_profit: parseNumber(document.getElementById('footer-total-dat-profit').textContent),
            total_shipment_dat_cost: parseNumber(document.getElementById('footer-total-shipment-dat-cost').textContent),
            
            // Products data
            products: collectProductsData()
        };
        
        return formData;
    }
    
    // Helper to get select value safely
    function getSelectValue(id) {
        const select = document.getElementById(id);
        return select ? select.value : '';
    }
    
    // Collect data from the product table
    function collectProductsData() {
        const products = [];
        const rows = document.querySelectorAll('#product-table-container tr');
        
        rows.forEach(row => {
            // Defensive guards & logging
            if (!row || !row.cells || row.cells.length < 30) {
                console.warn('[collectProductsData] Skipping row due to insufficient cells', row);
                return;
            }
            let qtyInput = row.querySelector('.product-quantity');
            if (!qtyInput) {
                // Try alternate class
                qtyInput = row.querySelector('.product-amount-input');
            }
            if (!qtyInput) {
                console.warn('[collectProductsData] Missing .product-quantity input, using 0. Row index:', Array.prototype.indexOf.call(row.parentNode.children, row));
            }
            // Resolve product id; fallback by product code mapping
            let resolvedProductId = parseInt(row.dataset.productId, 10);
            if (!resolvedProductId || isNaN(resolvedProductId)) {
                const codeCell = row.cells[0].textContent.trim();
                if (codeCell && window.productIdByCode && window.productIdByCode[codeCell]) {
                    resolvedProductId = window.productIdByCode[codeCell];
                }
            }
            if (!resolvedProductId) {
                console.warn('[collectProductsData] Could not resolve product_id for row with code', row.cells[0].textContent.trim());
            }
            // Fallback quantity parse from cell (index 9) if input missing
            let quantityVal = qtyInput ? qtyInput.value : row.cells[9].textContent;
            const product = {
                product_id: parseInt(resolvedProductId, 10) || null,
                product_code: row.cells[0].textContent.trim(),
                product_name: row.cells[1].textContent.trim(),
                product_category: row.cells[2].textContent.trim(),
                country_id: row.cells[3].textContent.trim(),
                packaging: row.cells[4].textContent.trim(),
                pack_weight: parseNumber(row.cells[5].textContent),
                units_per_pack: parseNumber(row.cells[6].textContent),
                packaging_cost: parseNumber(row.cells[7].textContent),
                currency: row.cells[8].textContent.trim(),
                quantity: parseNumber(quantityVal),
                
                // Calculated fields
                total_weight: parseNumber(row.cells[10].textContent),
                total_product_cost: parseNumber(row.cells[11].textContent),
                export_taxes: parseNumber(row.cells[12].textContent),
                exporter_profit: parseNumber(row.cells[13].textContent),
                fca_cost: parseNumber(row.cells[14].textContent),
                fca_usd: parseNumber(row.cells[15].textContent),
                cargo_load_cost: parseNumber(row.cells[16].textContent),
                air_freight_cost: parseNumber(row.cells[17].textContent),
                cargo_unload_cost: parseNumber(row.cells[18].textContent),
                cip_cost: parseNumber(row.cells[19].textContent),
                import_taxes: parseNumber(row.cells[20].textContent),
                dat_kg_cost: parseNumber(row.cells[21].textContent),
                dat_ea_cost: parseNumber(row.cells[22].textContent),
                
                // Pricing and Profitability
                comparative_price: parseNumber(row.cells[23].textContent),
                sug_prod_prof_ea: parseNumber(row.cells[24].textContent),
                product_profit_percentage: parseNumber(row.cells[25].textContent),
                final_dat_price_ea: parseNumber(row.cells[26].textContent),
                total_pr_cost_dat: parseNumber(row.cells[27].textContent),
                total_dat_profit: parseNumber(row.cells[28].textContent),
                total_shipment_dat_cost: parseNumber(row.cells[29].textContent)
            };
            
            products.push(product);
        });
        
        return products;
    }
    
    // Add event listener to the "Start New Shipment" button
    const startNewShipmentBtn = document.getElementById('start-shipment-btn');
    if (startNewShipmentBtn) {
        startNewShipmentBtn.addEventListener('click', function() {
            const typeOfFreightWrapper = document.getElementById('type-of-freight-wrapper');
            if (typeOfFreightWrapper) {
                typeOfFreightWrapper.style.display = 'flex';
            }
            // Generate shipment reference when starting a new shipment
            generateShipmentReference();
        });
    }
});