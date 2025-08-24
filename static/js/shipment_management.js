// d:\OneDrive\logistics_app\static\js\shipment_management.js

document.addEventListener('DOMContentLoaded', function() {
    // --- Utility Function to update dropdowns ---
    function updateDropdown(selectElement, newOptions, placeholderText) {
        selectElement.innerHTML = '';
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = placeholderText;
        selectElement.appendChild(placeholder);
        newOptions.forEach(opt => {
            selectElement.appendChild(opt.cloneNode(true));
        });
        selectElement.disabled = newOptions.length === 0;
    }

    // --- Shared state for route checking ---
    let selectedDeparturePort = null;
    let selectedArrivalPort = null;

    // --- Setup for both shipper and consignee sections ---
    const setups = [
        {
            regionSelect: document.getElementById('trading_region'),
            countrySelect: document.getElementById('trading_country'),
            branchSelect: document.getElementById('trading_branch'),
            portSelect: document.getElementById('port_of_shipping'),
            regionalManagerInput: document.getElementById('trading_regional_manager'),
        },
        {
            regionSelect: document.getElementById('consignee_region'),
            countrySelect: document.getElementById('consignee_country'),
            branchSelect: document.getElementById('consignee_branch'),
            portSelect: document.getElementById('consignee_port_of_shipping'),
            regionalManagerInput: document.getElementById('consignee_regional_manager'),
        }
    ];

    setups.forEach((setup, index) => {
        // --- Hardened Element Validation ---
        const elements = { ...setup };
        const expectedIds = {
            regionSelect: index === 0 ? 'trading_region' : 'consignee_region',
            countrySelect: index === 0 ? 'trading_country' : 'consignee_country',
            branchSelect: index === 0 ? 'trading_branch' : 'consignee_branch',
            portSelect: index === 0 ? 'port_of_shipping' : 'consignee_port_of_shipping',
            regionalManagerInput: index === 0 ? 'trading_regional_manager' : 'consignee_regional_manager',
        };

        let hasError = false;
        for (const key in elements) {
            if (!elements[key]) {
                console.error(`Shipment Management Script Error: Could not find element with ID '${expectedIds[key]}'. Please check your HTML template.`);
                hasError = true;
            }
        }
        if (hasError) return;

        initializeCascadingDropdowns(setup, index);
    });

    // --- Route Existence Check Logic ---
    function triggerRouteChangeCheck() {
        const departureRouteSelect = document.getElementById('departure_route');
        const addCargoToSelect = document.getElementById('add_cargo_to_route');

        // Use hidden IATA code inputs for route check
        const departureIataInput = document.getElementById('port_of_shipping_iata');
        const arrivalIataInput = document.getElementById('consignee_port_of_shipping_iata');
        const departureIata = departureIataInput ? departureIataInput.value : selectedDeparturePort;
        const arrivalIata = arrivalIataInput ? arrivalIataInput.value : selectedArrivalPort;

        if (!departureIata || !arrivalIata) {
            if (departureRouteSelect) {
                departureRouteSelect.innerHTML = '';
                departureRouteSelect.disabled = true;
            }
            if (addCargoToSelect) {
                addCargoToSelect.innerHTML = '';
                addCargoToSelect.disabled = true;
            }
            return;
        }

        const csrfTokenInput = document.querySelector('input[name="csrf_token"]');
        const checkRouteUrl = document.getElementById('container-2').dataset.checkRouteUrl;

        if (!csrfTokenInput || !checkRouteUrl) {
            console.error('CSRF token or check-route URL not found.');
            return;
        }

        // Debug: Log the IATA codes being sent
        console.log('Route check request:', {
            departure_iata: departureIata,
            arrival_iata: arrivalIata
        });
        fetch(checkRouteUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfTokenInput.value
            },
            body: JSON.stringify({
                departure_iata: departureIata,
                arrival_iata: arrivalIata
            })
        })
        .then(response => response.json())
        .then(data => {
            handleRouteCheckResponse(data);
        })
        .catch(error => console.error('Error checking route:', error));
    }

    function handleRouteCheckResponse(data) {
        const departureRouteField = document.getElementById('departure_route');
        const addCargoToField = document.getElementById('add_cargo_to_route');

        if (data.exists && data.routes && data.routes.length > 0) {
            // If more than one route, populate dropdowns with all options
            if (departureRouteField && departureRouteField.tagName === 'SELECT') {
                departureRouteField.innerHTML = '';
                // Add default option
                const defaultOpt = document.createElement('option');
                defaultOpt.value = '';
                defaultOpt.textContent = 'Select aircraft';
                departureRouteField.appendChild(defaultOpt);
                // Add route options
                data.routes.forEach(route => {
                    const opt = document.createElement('option');
                    opt.value = route.id;
                    opt.textContent = route.display_name;
                    departureRouteField.appendChild(opt);
                });
                departureRouteField.disabled = false;
                departureRouteField.onchange = function() {
                    const selectedId = this.value;
                    const selectedRoute = data.routes.find(r => r.id == selectedId);
                    if (selectedRoute) {
                        // Format cost as $ and thousand separators (en-US)
                        const totalCost = (selectedRoute.total_cost || 0) + (selectedRoute.airport_fee || 0) + (selectedRoute.turnaround_cost || 0);
                        const formattedCost = `$${totalCost.toLocaleString('en-US')}`;
                        document.getElementById('route_cost').value = formattedCost;

                        // Format available payload as "xx,xxx Lb. / yy,yyy Kg"
                        const payloadLb = selectedRoute.available_payload || 0;
                        const payloadKg = payloadLb ? Math.round(payloadLb * 0.453592) : 0;
                        const formattedPayload = `${payloadLb.toLocaleString('en-US')} Lb. / ${payloadKg.toLocaleString('en-US')} Kg`;
                        document.getElementById('available_payload').value = formattedPayload;

                        // --- Populate Return Route field ---
                        const returnRouteField = document.getElementById('return_route');
                        if (returnRouteField) {
                            // Find available return routes for selected aircraft departing from port of arrival
                            // Assume window.routeData is injected and contains all routes
                            const arrivalIataInput = document.getElementById('consignee_port_of_shipping_iata');
                            const arrivalIata = arrivalIataInput ? arrivalIataInput.value : null;
                            const aircraftShortName = selectedRoute.display_name.split('(')[1]?.replace(')','').trim();
                            let availableReturnRoutes = [];
                            if (window.routeData && arrivalIata && aircraftShortName) {
                                availableReturnRoutes = Object.values(window.routeData).filter(r =>
                                    r.fromAirport === arrivalIata && r.aircraft.includes(aircraftShortName)
                                );
                            }
                            if (availableReturnRoutes.length > 0) {
                                // Populate as a dropdown if more than one route
                                returnRouteField.style.color = '';
                                returnRouteField.style.fontWeight = '';
                                if (availableReturnRoutes.length === 1) {
                                    returnRouteField.value = availableReturnRoutes[0].summary;
                                    // Also create type of return dropdown
                                    createTypeOfReturnDropdown(returnRouteField.parentNode);
                                    // Populate cost/payload for single route
                                    populateReturnRouteFields(availableReturnRoutes[0]);
                                } else {
                                    // Replace input with a select dropdown
                                    const parent = returnRouteField.parentNode;
                                    const select = document.createElement('select');
                                    select.id = 'return_route';
                                    select.className = 'form-control';
                                    select.style.border = '2px solid #2b792b';
                                    // Add top option
                                    const topOpt = document.createElement('option');
                                    topOpt.value = '';
                                    topOpt.textContent = 'Select Return Destination:';
                                    select.appendChild(topOpt);
                                    availableReturnRoutes.forEach(r => {
                                        const opt = document.createElement('option');
                                        opt.value = r.summary;
                                        opt.textContent = r.summary;
                                        select.appendChild(opt);
                                    });
                                    parent.replaceChild(select, returnRouteField);
                                    // Create type of return dropdown
                                    createTypeOfReturnDropdown(parent);
                                    // Add event listener to populate cost/payload on selection
                                    select.addEventListener('change', function() {
                                        const selectedSummary = this.value;
                                        const selectedRoute = availableReturnRoutes.find(r => r.summary === selectedSummary);
                                        if (selectedRoute) {
                                            populateReturnRouteFields(selectedRoute);
                                        } else {
                                            document.getElementById('route_cost_return').value = '';
                                            document.getElementById('available_payload_return').value = '';
                                        }
                                    });
                                }

                                // Helper: populate cost/payload for return route
                                function populateReturnRouteFields(route) {
                                    // Always use destination airport's fees and turnaround cost
                                    let totalCost = route.cost || route.total_cost || 0;
                                    let airportFee = 0;
                                    let turnaroundCost = 0;
                                    // Find destination airport data
                                    if (window.airportData && route.toAirport) {
                                        const destAirport = window.airportData[route.toAirport];
                                        if (destAirport) {
                                            airportFee = destAirport.airport_fee || 0;
                                            turnaroundCost = destAirport.turnaround_cost || 0;
                                        }
                                    } else if (window.routeData && route.toAirport) {
                                        // Fallback: find any route with fromAirport = toAirport and get its fees
                                        const destRoute = Object.values(window.routeData).find(r => r.fromAirport === route.toAirport);
                                        if (destRoute) {
                                            airportFee = destRoute.airport_fee || 0;
                                            turnaroundCost = destRoute.turnaround_cost || 0;
                                        }
                                    }
                                    totalCost += airportFee + turnaroundCost;
                                    const formattedCost = `$${totalCost.toLocaleString('en-US')}`;
                                    document.getElementById('route_cost_return').value = formattedCost;
                                    let payloadLb = route.payload || route.available_payload || 0;
                                    let payloadKg = 0;
                                    if (typeof payloadLb === 'string' && payloadLb.includes('kg')) {
                                        payloadKg = parseInt(payloadLb.replace(/[^\d]/g, ''));
                                        payloadLb = Math.round(payloadKg / 0.453592);
                                    } else {
                                        payloadLb = typeof payloadLb === 'string' ? parseInt(payloadLb.replace(/[^\d]/g, '')) : payloadLb;
                                        payloadKg = payloadLb ? Math.round(payloadLb * 0.453592) : 0;
                                    }
                                    const formattedPayload = `${payloadLb.toLocaleString('en-US')} Lb. / ${payloadKg.toLocaleString('en-US')} Kg`;
                                    document.getElementById('available_payload_return').value = formattedPayload;
                                }

                                // Helper: create type of return dropdown
                                function createTypeOfReturnDropdown(parent) {
                                    // Always create or replace the dropdown in the original form-group
                                    let typeInput = document.getElementById('type_of_return');
                                    if (typeInput) {
                                        // Replace input with select dropdown
                                        const formGroup = typeInput.parentNode;
                                        const label = formGroup.querySelector('label[for="type_of_return"]');
                                        // Remove old input
                                        typeInput.remove();
                                        // Create select dropdown
                                        const typeDropdown = document.createElement('select');
                                        typeDropdown.id = 'type_of_return';
                                        typeDropdown.className = 'form-control';
                                        typeDropdown.style.border = '2px solid #2b792b';
                                        const opt1 = document.createElement('option');
                                        opt1.value = '';
                                        opt1.textContent = 'Select Type of Return';
                                        typeDropdown.appendChild(opt1);
                                        const opt2 = document.createElement('option');
                                        opt2.value = 'Compensated';
                                        opt2.textContent = 'Compensated';
                                        typeDropdown.appendChild(opt2);
                                        const opt3 = document.createElement('option');
                                        opt3.value = 'Full';
                                        opt3.textContent = 'Full';
                                        typeDropdown.appendChild(opt3);
                                        // Insert dropdown after label in form-group
                                        if (label && label.nextSibling) {
                                            formGroup.insertBefore(typeDropdown, label.nextSibling);
                                        } else {
                                            formGroup.appendChild(typeDropdown);
                                        }
                                    }
                                }
                            } else {
                                // Show message in red bold font
                                returnRouteField.style.color = 'red';
                                returnRouteField.style.fontWeight = 'bold';
                                returnRouteField.value = 'NEED TO CREATE A RETURN ROUTE';
                            }
                        }
                    } else {
                        document.getElementById('route_cost').value = '';
                        document.getElementById('available_payload').value = '';
                        const returnRouteField = document.getElementById('return_route');
                        if (returnRouteField) {
                            returnRouteField.value = '';
                            returnRouteField.style.color = '';
                            returnRouteField.style.fontWeight = '';
                        }
                    }
                };
            }
            if (addCargoToField && addCargoToField.tagName === 'SELECT') {
                addCargoToField.innerHTML = '';
                const routeBase = data.routes[0].display_name.split('(')[0].trim();
                const opt = document.createElement('option');
                opt.value = routeBase;
                opt.textContent = routeBase;
                addCargoToField.appendChild(opt);
                addCargoToField.disabled = false;
            }
        } else {
            if (departureRouteField && departureRouteField.tagName === 'SELECT') {
                departureRouteField.innerHTML = '';
                departureRouteField.disabled = true;
            } else if (departureRouteField) {
                departureRouteField.value = '';
            }
            if (addCargoToField && addCargoToField.tagName === 'SELECT') {
                addCargoToField.innerHTML = '';
                addCargoToField.disabled = true;
            } else if (addCargoToField) {
                addCargoToField.value = '';
            }
            showRouteNotFoundModal();
        }
    // ...existing code...
    }

    function showRouteNotFoundModal() {
        const modal = document.getElementById('route-not-found-modal');
        if (modal) {
            modal.style.display = 'block';
        } else {
            alert('Route not found. Please create the route or change the selected ports.');
        }
    }

    /**
     * Sets up all cascading event listeners for a given set of dropdowns.
     * @param {object} setup - An object containing the DOM elements for the dropdowns.
     * @param {number} index - The index of the setup (0 for shipper, 1 for consignee).
     */
    function initializeCascadingDropdowns(setup, index) {
        const { regionSelect, countrySelect, branchSelect, portSelect, regionalManagerInput } = setup;

        const originalCountryOptions = Array.from(countrySelect.querySelectorAll('option:not([value=""])'));
        const originalBranchOptions = Array.from(branchSelect.querySelectorAll('option:not([value=""])'));
        const originalPortOptions = Array.from(portSelect.querySelectorAll('option:not([value=""])'));

        if (regionSelect) regionSelect.disabled = false;

        regionSelect.addEventListener('change', function() {
            const selectedRegion = this.value;
            // Only countries in selected region with branches
            const countryCodesWithBranches = [...new Set(originalBranchOptions.map(opt => opt.dataset.country.toLowerCase()))];
            const filteredCountries = selectedRegion ? originalCountryOptions.filter(countryOpt => {
                const regionMatch = countryOpt.dataset.region && countryOpt.dataset.region.trim().toLowerCase() === selectedRegion.trim().toLowerCase();
                const hasBranch = countryCodesWithBranches.includes(countryOpt.value.toLowerCase());
                return regionMatch && hasBranch;
            }) : [];
            updateDropdown(countrySelect, filteredCountries, 'Select Country...');
            updateDropdown(branchSelect, [], 'Select Branch...');
            updateDropdown(portSelect, [], 'Select Port...');
            // Immediately update Regional Manager field for selected region
            if (regionalManagerInput) {
                // regionManagerMap should be injected globally with region → manager mapping
                if (window.regionManagerMap && selectedRegion && window.regionManagerMap[selectedRegion]) {
                    regionalManagerInput.value = window.regionManagerMap[selectedRegion];
                } else {
                    regionalManagerInput.value = '';
                }
            }
        });

        countrySelect.addEventListener('change', function() {
            const selectedCountryCode = this.value;
            // Only branches in selected country
            const filteredBranches = selectedCountryCode ? originalBranchOptions.filter(opt =>
                opt.dataset.country && opt.dataset.country.toLowerCase() === selectedCountryCode.toLowerCase()
            ) : [];
            updateDropdown(branchSelect, filteredBranches, 'Select Branch...');
            updateDropdown(portSelect, [], 'Select Port...');
            // Do NOT clear the regional manager field here
        });

        branchSelect.addEventListener('change', function() {
            const selectedBranchOption = this.options[this.selectedIndex];
            const airportIata = selectedBranchOption ? selectedBranchOption.dataset.airportIata : null;
            const managerName = selectedBranchOption ? selectedBranchOption.dataset.managerName || '' : '';
            if (regionalManagerInput) regionalManagerInput.value = managerName;
            // Only ports for selected branch
            const filteredPorts = airportIata ? originalPortOptions.filter(opt => opt.value === airportIata) : [];
            updateDropdown(portSelect, filteredPorts, 'Select Port...');
            if (portSelect.options.length === 2) {
                portSelect.selectedIndex = 1;
                portSelect.dispatchEvent(new Event('change'));
            }
        });

        // Update hidden IATA input on port selection (for shipper row only)
        if (index === 0) {
            portSelect.addEventListener('change', function() {
                const iataInput = document.getElementById('port_of_shipping_iata');
                if (iataInput) iataInput.value = portSelect.value;
            });
        } else {
            portSelect.addEventListener('change', function() {
                const iataInput = document.getElementById('consignee_port_of_shipping_iata');
                if (iataInput) iataInput.value = portSelect.value;
            });
        }

        // NEW: Integrated port selection listener
        portSelect.addEventListener('change', function() {
            // Use hidden IATA code input if available
            if (index === 0) { // shipper/departure
                const iataInput = document.getElementById('port_of_shipping_iata');
                selectedDeparturePort = iataInput ? iataInput.value : this.value;
            } else { // consignee/arrival
                const iataInput = document.getElementById('consignee_port_of_shipping_iata');
                selectedArrivalPort = iataInput ? iataInput.value : this.value;
            }
            triggerRouteChangeCheck();
        });
    }
});
