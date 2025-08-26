// d:\OneDrive\logistics_app\static\js\shipment_management.js

document.addEventListener('DOMContentLoaded', function() {
    // Helper: calculation for outbound cost weight and cargo load
    // --- Refactored Calculation and State Management ---

    /**
     * A generic function to get a clean numeric value from a field.
     * @param {string} elementId - The ID of the input element.
     * @param {boolean} isPayload - True if parsing a payload field ("... Kg"), false for currency.
     * @returns {number} The parsed numeric value.
     */
    function getNumericValue(elementId, isPayload = false) {
        const element = document.getElementById(elementId);
        if (!element || !element.value) return 0;

        if (isPayload) {
            const match = element.value.match(/([\d,]+)\s*Kg/);
            return match && match[1] ? parseInt(match[1].replace(/,/g, '')) : 0;
        } else {
            return parseFloat(element.value.replace(/[^\d\.]/g, '')) || 0;
        }
    }

    /**
     * A helper to get the calculated value (the part after the '/') from a display field.
     * @param {string} elementId - The ID of the display element.
     * @returns {number} The parsed numeric value.
     */
    function getCalculatedValueFromField(elementId) {
        const element = document.getElementById(elementId);
        if (!element || !element.value) return 0;
        const parts = element.value.split('/');
        if (parts.length < 2) return 0;
        const valueStr = parts[1].trim();
        return parseFloat(valueStr.replace(/[^\d\.]/g, '')) || 0;
    }

    function updateDepartureAvgCost() {
        const avgCostKgField = document.getElementById('avg_cost_kg_departure');
        if (!avgCostKgField) return;

        const outboundCostValue = getCalculatedValueFromField('outbound_cost_weight_value');
        const cargoValue = getCalculatedValueFromField('target_cargo_load_departure_value');

        avgCostKgField.value = cargoValue > 0 ? `$${(outboundCostValue / cargoValue).toFixed(2)}` : '';
    }

    function updateReturnAvgCost() {
        const avgCostKgField = document.getElementById('avg_cost_kg_return');
        if (!avgCostKgField) return;

        const returnCostValue = getCalculatedValueFromField('return_cost_weight_value');
        const cargoValue = getCalculatedValueFromField('target_cargo_load_value_kilogram');

        avgCostKgField.value = cargoValue > 0 ? `$${(returnCostValue / cargoValue).toFixed(2)}` : '';
    }

    /**
     * Applies one-time UI enhancements to the products table.
     */
    function enhanceProductsTableUI() {
        const table = document.querySelector('#products-table');
        if (!table) return;

        // Make table scrollable after 8 rows
        const tableWrapper = table.parentNode;
        if (tableWrapper) {
            tableWrapper.style.maxHeight = '450px'; // Approx height for 8 rows + header/footer
            tableWrapper.style.overflowY = 'auto';
        }

        // Set "Name" column width
        const nameHeader = table.querySelector('thead th:nth-child(2)');
        if (nameHeader) {
            nameHeader.style.width = '200px';
            nameHeader.style.minWidth = '200px';
            nameHeader.style.maxWidth = '200px';
        }

        // Inject styles for borders and sticky footer
        const style = document.createElement('style');
        style.textContent = `
            #products-table {
                border-collapse: collapse;
            }
            #products-table th, #products-table td {
                border: 1px solid darkblue;
            }
            #products-table tfoot {
                position: sticky;
                bottom: -1px; /* Prevents gap */
                background-color: #fff8e1; /* Match header color */
                z-index: 1;
            }
        `;
        document.head.appendChild(style);

        // Create the sticky totals footer if it doesn't exist
        if (!table.querySelector('tfoot')) {
            const tfoot = table.createTFoot();
            const totalsRow = tfoot.insertRow();
            totalsRow.innerHTML = `
                <td colspan="8" style="text-align: right; font-weight: bold; color: #FF5C00; padding-right: 10px;">Totals:</td>
                <td class="totals-row-weight" style="font-weight: bold; text-align: center; vertical-align: middle;"></td>
                <td class="totals-row-cost" style="font-weight: bold; text-align: center; vertical-align: middle;"></td>
                <td colspan="11"></td>
            `;
        }
    }

    /**
     * Calculates and updates the values in the table's "Totals" footer row.
     */
    function updateTableTotals() {
        // This function is ready to be expanded with calculation logic
        // when the per-row calculations are implemented.
    }

    /**
     * Adds interactive highlighting to an input field.
     * The highlight is removed when the user enters data and blurs the field.
     * @param {HTMLElement} inputElement - The input element to apply highlighting to.
     */
    function addInteractiveHighlighting(inputElement) {
        if (!inputElement) return;

        // Apply highlight styles directly to override any stylesheet rules
        inputElement.style.setProperty('background-color', 'white', 'important');
        inputElement.style.setProperty('color', 'black', 'important'); // Use black for visibility

        inputElement.addEventListener('blur', function() {
            if (this.value.trim() !== '') {
                // Remove highlight styles by reverting to stylesheet defaults
                this.style.backgroundColor = '';
                this.style.color = ''; // Reverts to stylesheet default (yellow)
            } else {
                // Re-apply highlight styles
                this.style.setProperty('background-color', 'white', 'important');
                this.style.setProperty('color', 'black', 'important');
            }
        });
    }

    /**
     * A generic function to calculate and update a derived value field.
     * @param {string} percentInputId - The ID of the percentage input field.
     * @param {number} baseValue - The total value (e.g., total flight cost or payload).
     * @param {string} outputId - The ID of the field to display the result.
     * @param {boolean} isCost - True to format as currency, false to format as weight.
     */
    function updateCalculatedField(percentInputId, baseValue, outputId, isCost) {
        const percentInput = document.getElementById(percentInputId);
        const outputField = document.getElementById(outputId);
        if (!percentInput || !outputField) return;

        const percent = parseInt(percentInput.value) || 0;
        const calculatedValue = Math.round(baseValue * (percent / 100));

        if (isCost) {
            outputField.value = `${percent}% / $${calculatedValue.toLocaleString('en-US')}`;
        } else {
            outputField.value = `${percent}% / ${calculatedValue.toLocaleString('en-US')} Kg.`;
        }
    }

    /**
     * Manages the UI state and event listeners for the Type of Return selection.
     * @param {string} returnType - The selected value from the dropdown ('Full', 'Compensated', etc.).
     */
    function manageReturnTypeState(returnType) {
        // Get all relevant elements
        const fields = {
            outboundCost: { percent: document.getElementById('outbound_cost_weight'), value: document.getElementById('outbound_cost_weight_value') },
            outboundCargo: { percent: document.getElementById('target_cargo_load'), value: document.getElementById('target_cargo_load_departure_value') },
            returnCost: { percent: document.getElementById('return_cost_weight'), value: document.getElementById('return_cost_weight_value') },
            returnCargo: { percent: document.getElementById('target_cargo_load_return_percentage'), value: document.getElementById('target_cargo_load_value_kilogram') }
        };

        // --- Reset all fields to a default state ---
        Object.values(fields).forEach(field => {
            if (field.percent) {
                field.percent.disabled = true;
                field.percent.value = '';
                field.percent.style.backgroundColor = ''; // Reset inline background
                field.percent.style.color = ''; // Reset inline color style
                // Clear any old listeners by replacing the element with a clone
                const newEl = field.percent.cloneNode(true);
                field.percent.parentNode.replaceChild(newEl, field.percent);
                field.percent = newEl; // Update reference to the new element
            }
            if (field.value) field.value.value = '';
        });

        // Also reset the AVG cost fields
        const avgCostDeparture = document.getElementById('avg_cost_kg_departure');
        const avgCostReturn = document.getElementById('avg_cost_kg_return');
        if (avgCostDeparture) avgCostDeparture.value = '';
        if (avgCostReturn) avgCostReturn.value = '';

        // Re-attach the 0-100 enforcement to all fields
        ['outbound_cost_weight', 'target_cargo_load', 'return_cost_weight', 'target_cargo_load_return_percentage'].forEach(enforcePercentInput);

        // Get base values for calculations
        const totalFlightCost = getNumericValue('route_cost') + getNumericValue('route_cost_return');
        const departurePayload = getNumericValue('available_payload', true);
        const returnPayload = getNumericValue('available_payload_return', true);

        // --- Apply logic for the selected type ---
        if (returnType === 'Full') {
            // Outbound Cost: Disabled, set to 100, and calculated
            fields.outboundCost.percent.disabled = true;
            fields.outboundCost.percent.value = 100;
            updateCalculatedField('outbound_cost_weight', totalFlightCost, 'outbound_cost_weight_value', true);

            // Outbound Cargo: Enabled for user input
            fields.outboundCargo.percent.disabled = false;
            addInteractiveHighlighting(fields.outboundCargo.percent);
            fields.outboundCargo.percent.addEventListener('input', () => {
                updateCalculatedField('target_cargo_load', departurePayload, 'target_cargo_load_departure_value', false);
                updateDepartureAvgCost();
            });

        } else if (returnType === 'Compensated') {
            // Outbound Cost: Enabled for user input, triggers return cost calculation
            fields.outboundCost.percent.disabled = false;
            addInteractiveHighlighting(fields.outboundCost.percent);
            fields.outboundCost.percent.addEventListener('input', () => {
                const outboundPercent = parseInt(fields.outboundCost.percent.value) || 0;
                fields.returnCost.percent.value = 100 - outboundPercent;
                updateCalculatedField('outbound_cost_weight', totalFlightCost, 'outbound_cost_weight_value', true);
                updateCalculatedField('return_cost_weight', totalFlightCost, 'return_cost_weight_value', true);
                updateDepartureAvgCost();
                updateReturnAvgCost();
            });

            // Outbound Cargo: Enabled for user input
            fields.outboundCargo.percent.disabled = false;
            addInteractiveHighlighting(fields.outboundCargo.percent);
            fields.outboundCargo.percent.addEventListener('input', () => {
                updateCalculatedField('target_cargo_load', departurePayload, 'target_cargo_load_departure_value', false);
                updateDepartureAvgCost();
            });

            // Return Cost: Disabled, value is derived from outbound
            fields.returnCost.percent.disabled = true;

            // Return Cargo: Enabled for user input
            fields.returnCargo.percent.disabled = false;
            addInteractiveHighlighting(fields.returnCargo.percent);
            fields.returnCargo.percent.addEventListener('input', () => {
                updateCalculatedField('target_cargo_load_return_percentage', returnPayload, 'target_cargo_load_value_kilogram', false);
                updateReturnAvgCost();
            });
        }
    }
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

    // New function to calculate and display total flight cost
    function updateTotalFlightCost() {
        const depCostEl = document.getElementById('route_cost');
        const retCostEl = document.getElementById('route_cost_return');
        const totalCostDisplayEl = document.getElementById('total_flight_cost_display');

        if (!depCostEl || !retCostEl || !totalCostDisplayEl) {
            return; // Exit if any element is not found
        }

        const depCost = parseFloat((depCostEl.value || '').replace(/[^\d\.]/g, '')) || 0;
        const retCost = parseFloat((retCostEl.value || '').replace(/[^\d\.]/g, '')) || 0;
        const totalCost = depCost + retCost;

        // Format with commas and two decimal places
        totalCostDisplayEl.textContent = totalCost > 0 ? `$${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '';
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

                        // Update total cost display
                        updateTotalFlightCost();

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
                                    // Populate cost/payload for single route
                                    populateReturnRouteFields(availableReturnRoutes[0]);
                                    // Create type of return dropdown after return route selection
                                    createTypeOfReturnDropdown(returnRouteField.parentNode);
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
                                    // Add event listener to populate cost/payload and create type of return dropdown on selection
                                    select.addEventListener('change', function() {
                                        const selectedSummary = this.value;
                                        const selectedRoute = availableReturnRoutes.find(r => r.summary === selectedSummary);
                                        if (selectedRoute) {
                                            populateReturnRouteFields(selectedRoute);
                                            createTypeOfReturnDropdown(parent);
                                            // Populate the second 'add cargo to' field (green) with the selected return route, without aircraft type
                                            const addCargoToReturnField = document.getElementById('add_cargo_to_return');
                                            if (addCargoToReturnField) {
                                                // Extract route base (e.g., 'MDE → MIA') from summary
                                                const routeBase = selectedRoute.summary.split('(')[0].trim();
                                                addCargoToReturnField.value = routeBase;
                                            }
                                        } else {
                                            document.getElementById('route_cost_return').value = '';
                                            document.getElementById('available_payload_return').value = '';
                                            const addCargoToReturnField = document.getElementById('add_cargo_to_return');
                                            if (addCargoToReturnField) {
                                                addCargoToReturnField.value = '';
                                            }
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

                                    // Update total cost display
                                    updateTotalFlightCost();
                                }

                                // Helper: create type of return dropdown
                                function createTypeOfReturnDropdown(parent) {
                                    // Always create or replace the dropdown in the original form-group
                                    let typeInput = document.getElementById('type_of_return');
                                    if (typeInput) {
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
                                        if (label && label.nextSibling) {
                                            formGroup.insertBefore(typeDropdown, label.nextSibling);
                                        } else {
                                            formGroup.appendChild(typeDropdown);
                                        }
                                        // Add live event listener for type of return
                                        typeDropdown.addEventListener('change', function() {
                                            // Call the new state manager
                                            manageReturnTypeState(this.value);
                                        });
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

    // Disable departure route cost and available payload fields by default
    const routeCostField = document.getElementById('route_cost');
    if (routeCostField) routeCostField.readOnly = true;
    const availablePayloadField = document.getElementById('available_payload');
    if (availablePayloadField) availablePayloadField.readOnly = true;
    // Disable return route cost and available payload fields by default
    const routeCostReturnField = document.getElementById('route_cost_return');
    if (routeCostReturnField) routeCostReturnField.readOnly = true;
    const availablePayloadReturnField = document.getElementById('available_payload_return');
    if (availablePayloadReturnField) availablePayloadReturnField.readOnly = true;
    // Disable type of return dropdown until a return route is selected
    const typeOfReturnDropdown = document.getElementById('type_of_return');
    if (typeOfReturnDropdown) typeOfReturnDropdown.disabled = true;
    // Remove white background for type of return before cell is enabled
    if (typeOfReturnDropdown) typeOfReturnDropdown.style.background = 'none';
    // Make all left split cells (percentage inputs) accept only values between 0 and 100
    function enforcePercentInput(id) {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', function() {
                let val = parseInt(this.value);
                if (isNaN(val) || val < 0) val = 0;
                if (val > 100) val = 100;
                this.value = val;
            });
        }
    }
    ['outbound_cost_weight', 'target_cargo_load', 'return_cost_weight', 'target_cargo_load_return_percentage'].forEach(enforcePercentInput);

    // Apply one-time UI enhancements to the products table
    enhanceProductsTableUI();

    // --- Product Table Population ---
    const tradingCountrySelect = document.getElementById('trading_country');
    const productsTableBody = document.querySelector('#products-table tbody');
    const productsContainer = document.getElementById('container-5');
    const getProductsUrlTemplate = productsContainer ? productsContainer.dataset.getProductsUrl : null;

    if (tradingCountrySelect && productsTableBody && getProductsUrlTemplate) {
        tradingCountrySelect.addEventListener('change', function() {
            const countryCode = this.value;
            productsTableBody.innerHTML = ''; // Clear table on new selection

            if (!countryCode) {
                return; // Do nothing if no country is selected
            }

            // Show a loading state in the table
            productsTableBody.innerHTML = '<tr><td colspan="21" style="text-align: center;">Loading products...</td></tr>';

            const fetchUrl = getProductsUrlTemplate.replace('__COUNTRY_CODE__', countryCode);

            fetch(fetchUrl)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(products => {
                    productsTableBody.innerHTML = ''; // Clear loading message
                    if (products.length === 0) {
                        productsTableBody.innerHTML = '<tr><td colspan="21" style="text-align: center;">No products found for this country.</td></tr>';
                        return;
                    }

                    products.forEach(product => {
                        const row = document.createElement('tr');
                        // Store hidden data in data-* attributes for later use
                        row.dataset.productType = product.product_type || '';
                        row.dataset.unitsPerPack = product.units_per_pack || 0;

                        const formattedPackCost = product.packaging_cost ? `$${parseFloat(product.packaging_cost).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '';

                        // The order of cells must match the table headers in the HTML
                        row.innerHTML = `
                            <td style="text-align: center; vertical-align: middle;">${product.product_code || ''}</td>
                            <td style="text-align: center; vertical-align: middle;">${product.name || ''}</td>
                            <td style="text-align: center; vertical-align: middle;">${product.trade_unit || ''}</td>
                            <td style="text-align: center; vertical-align: middle;">${product.packaging || ''}</td>
                            <td style="text-align: center; vertical-align: middle;">${product.packaging_weight || ''}</td>
                            <td style="text-align: center; vertical-align: middle;">${formattedPackCost}</td>
                            <td style="text-align: center; vertical-align: middle;">${product.currency || ''}</td>
                            <td><input type="number" class="form-control product-input amount-input" style="width: 100%;"></td>
                            <td class="total-weight" style="text-align: center; vertical-align: middle;"></td>
                            <td class="total-cost" style="text-align: center; vertical-align: middle;"></td>
                            <td><input type="number" class="form-control product-input taxes-input" style="width: 100%;"></td>
                            <td><input type="number" class="form-control product-input profit-input" style="width: 100%;"></td>
                            <td class="fca-cost" style="text-align: center; vertical-align: middle;"></td>
                            <td class="cip-cost" style="text-align: center; vertical-align: middle;"></td>
                            <td class="dat-cost" style="text-align: center; vertical-align: middle;"></td>
                            <td class="dat-kg-usd" style="text-align: center; vertical-align: middle;"></td>
                            <td class="dat-ea-usd" style="text-align: center; vertical-align: middle;"></td>
                            <td class="local-ea-usd" style="text-align: center; vertical-align: middle;"></td>
                            <td><input type="number" class="form-control product-input" style="width: 100%;"></td>
                            <td><input type="number" class="form-control product-input" style="width: 100%;"></td>
                            <td class="final-dat" style="text-align: center; vertical-align: middle;"></td>
                        `;
                        productsTableBody.appendChild(row);
                    });

                    // Update totals after populating the table
                    updateTableTotals();
                })
                .catch(error => {
                    console.error('Error fetching products:', error);
                    productsTableBody.innerHTML = '<tr><td colspan="21" style="text-align: center; color: red;">Error loading products.</td></tr>';
                });
        });
    }
});
