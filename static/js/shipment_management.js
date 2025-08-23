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
        const departureRouteField = document.getElementById('departure_route');
        const addCargoToField = document.getElementById('add_cargo_to_route');

        // Clear previous route info if a port is deselected
        if (!selectedDeparturePort || !selectedArrivalPort) {
            if (departureRouteField) departureRouteField.value = '';
            if (addCargoToField) addCargoToField.value = '';
            return;
        }

        const csrfTokenInput = document.querySelector('input[name="csrf_token"]');
        const checkRouteUrl = document.getElementById('container-2').dataset.checkRouteUrl;

        if (!csrfTokenInput || !checkRouteUrl) {
            console.error('CSRF token or check-route URL not found.');
            return;
        }

        fetch(checkRouteUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfTokenInput.value
            },
            body: JSON.stringify({
                departure_iata: selectedDeparturePort,
                arrival_iata: selectedArrivalPort
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

        if (data.exists && data.route_data) {
            if (departureRouteField) departureRouteField.value = data.route_data.departure_route;
            if (addCargoToField) addCargoToField.value = data.route_data.departure_route;
        } else {
            if (departureRouteField) departureRouteField.value = '';
            if (addCargoToField) addCargoToField.value = '';
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
            const countryCodesWithBranches = [...new Set(originalBranchOptions.map(opt => opt.dataset.country.toLowerCase()))];
            const filteredCountries = selectedRegion ? originalCountryOptions.filter(countryOpt => {
                const regionMatch = countryOpt.dataset.region && countryOpt.dataset.region.trim().toLowerCase() === selectedRegion.trim().toLowerCase();
                const hasBranch = countryCodesWithBranches.includes(countryOpt.value.toLowerCase());
                return regionMatch && hasBranch;
            }) : [];
            updateDropdown(countrySelect, filteredCountries, 'Select Country...');
            updateDropdown(branchSelect, [], 'Select Branch...');
            updateDropdown(portSelect, [], 'Select Port...');
            if (regionalManagerInput) regionalManagerInput.value = '';
        });

        countrySelect.addEventListener('change', function() {
            const selectedCountryCode = this.value;
            const filteredBranches = selectedCountryCode ? originalBranchOptions.filter(opt =>
                opt.dataset.country && opt.dataset.country.toLowerCase() === selectedCountryCode.toLowerCase()
            ) : [];
            updateDropdown(branchSelect, filteredBranches, 'Select Branch...');
            updateDropdown(portSelect, [], 'Select Port...');
            if (regionalManagerInput) regionalManagerInput.value = '';
        });

        branchSelect.addEventListener('change', function() {
            const selectedBranchOption = this.options[this.selectedIndex];
            const airportIata = selectedBranchOption ? selectedBranchOption.dataset.airportIata : null;
            const managerName = selectedBranchOption ? selectedBranchOption.dataset.managerName || '' : '';
            if (regionalManagerInput) regionalManagerInput.value = managerName;
            const filteredPorts = airportIata ? originalPortOptions.filter(opt => opt.value === airportIata) : [];
            updateDropdown(portSelect, filteredPorts, 'Select Port...');
            if (portSelect.options.length === 2) {
                portSelect.selectedIndex = 1;
                portSelect.dispatchEvent(new Event('change')); // Trigger change event for auto-selected port
            }
        });

        // NEW: Integrated port selection listener
        portSelect.addEventListener('change', function() {
            if (index === 0) { // This is the shipper/departure row
                selectedDeparturePort = this.value;
            } else { // This is the consignee/arrival row
                selectedArrivalPort = this.value;
            }
            triggerRouteChangeCheck();
        });
    }
});
