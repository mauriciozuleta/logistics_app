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
                data.routes.forEach(route => {
                    const opt = document.createElement('option');
                    opt.value = route.id;
                    opt.textContent = route.display_name;
                    departureRouteField.appendChild(opt);
                });
                departureRouteField.disabled = false;
            }
            if (addCargoToField && addCargoToField.tagName === 'SELECT') {
                addCargoToField.innerHTML = '';
                // Only show the constructed route (e.g. MDE - MIA), not aircraft
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
