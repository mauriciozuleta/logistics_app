// shipment_management.js

document.addEventListener('DOMContentLoaded', function() {
    // --- Utility Function to update dropdowns ---
    function updateDropdown(selectElement, newOptions, placeholderText) {
        // Clear existing options
        selectElement.innerHTML = '';

        // Add a placeholder
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = placeholderText;
        selectElement.appendChild(placeholder);

        // Add the new, filtered options
        newOptions.forEach(opt => {
            selectElement.appendChild(opt.cloneNode(true));
        });

        // Enable the dropdown only if there are options available
        selectElement.disabled = newOptions.length === 0;
    }

    // --- Setup for both shipper and consignee sections ---
    const setups = [
        {
            regionSelect: document.getElementById('trading_region'),
            countrySelect: document.getElementById('trading_country'),
            branchSelect: document.getElementById('trading_branch'),
            portSelect: document.getElementById('port_of_shipping'),
            regionalManagerInput: document.getElementById('trading_regional_manager')
        },
        {
            regionSelect: document.getElementById('consignee_region'),
            countrySelect: document.getElementById('consignee_country'),
            branchSelect: document.getElementById('consignee_branch'),
            portSelect: document.getElementById('consignee_port_of_shipping'),
            regionalManagerInput: document.getElementById('consignee_regional_manager')
        }
    ];

    setups.forEach((setup, index) => {
        const { regionSelect, countrySelect, branchSelect, portSelect, regionalManagerInput } = setup;

        // --- Hardened Element Validation ---
        // This is the new, robust check. It verifies that all dropdown elements exist in the HTML.
        // If an element is not found, it prints a specific error to the browser's developer console.
        const elements = { regionSelect, countrySelect, branchSelect, portSelect, regionalManagerInput };
        const expectedIds = {
            regionSelect: index === 0 ? 'trading_region' : 'consignee_region',
            countrySelect: index === 0 ? 'trading_country' : 'consignee_country',
            branchSelect: index === 0 ? 'trading_branch' : 'consignee_branch',
            portSelect: index === 0 ? 'port_of_shipping' : 'consignee_port_of_shipping',
            regionalManagerInput: index === 0 ? 'trading_regional_manager' : 'consignee_regional_manager'
        };

        let hasError = false;
        for (const key in elements) {
            if (!elements[key]) {
                console.error(`Shipment Management Script Error: Could not find element with ID '${expectedIds[key]}'. Please check for a typo in your HTML template.`);
                hasError = true;
            }
        }
        if (hasError) return; // Stop processing this setup to prevent a crash.

        initializeCascadingDropdowns(setup);
    });

    /**
     * Sets up the cascading event listeners for a given set of dropdowns.
     * @param {object} setup - An object containing the DOM elements for the dropdowns.
     */
    function initializeCascadingDropdowns(setup) {
        const { regionSelect, countrySelect, branchSelect, portSelect, regionalManagerInput } = setup;

        // Store original options from the pre-rendered HTML, excluding placeholders
        const originalCountryOptions = Array.from(countrySelect.querySelectorAll('option:not([value=""])'));
        const originalBranchOptions = Array.from(branchSelect.querySelectorAll('option:not([value=""])'));
        const originalPortOptions = Array.from(portSelect.querySelectorAll('option:not([value=""])'));

        // Initially, enable the first dropdown in the chain
        if (regionSelect) {
            regionSelect.disabled = false;
        }

        // 1. Event Listener for Region selection
        regionSelect.addEventListener('change', function() {
            const selectedRegion = this.value;

            // Get a unique list of country codes that have at least one branch.
            const countryCodesWithBranches = [...new Set(originalBranchOptions.map(opt => opt.dataset.country.toLowerCase()))];

            // Filter countries: they must be in the selected region AND have at least one branch.
            const filteredCountries = selectedRegion ? originalCountryOptions.filter(countryOpt => {
                const regionMatch = countryOpt.dataset.region && countryOpt.dataset.region.trim().toLowerCase() === selectedRegion.trim().toLowerCase();
                const hasBranch = countryCodesWithBranches.includes(countryOpt.value.toLowerCase());
                return regionMatch && hasBranch;
            }) : [];

            updateDropdown(countrySelect, filteredCountries, 'Select Country...');

            // Reset dependent dropdowns
            updateDropdown(branchSelect, [], 'Select Branch...');
            updateDropdown(portSelect, [], 'Select Port...');
            if (regionalManagerInput) regionalManagerInput.value = ''; // Clear manager field
        });

        // 2. Event Listener for Country selection
        countrySelect.addEventListener('change', function() {
            const selectedCountryCode = this.value;

            // Filter the original branch list based on the selected country's code
            const filteredBranches = selectedCountryCode ? originalBranchOptions.filter(opt =>
                // Robust comparison for country code
                opt.dataset.country && opt.dataset.country.toLowerCase() === selectedCountryCode.toLowerCase()
            ) : [];
            updateDropdown(branchSelect, filteredBranches, 'Select Branch...');

            // Reset port dropdown
            updateDropdown(portSelect, [], 'Select Port...');
            if (regionalManagerInput) regionalManagerInput.value = ''; // Clear manager field
        });

        // 3. Event Listener for Branch selection
        branchSelect.addEventListener('change', function() {
            const selectedBranchOption = this.options[this.selectedIndex];
            const airportIata = selectedBranchOption ? selectedBranchOption.dataset.airportIata : null;
            const managerName = selectedBranchOption ? selectedBranchOption.dataset.managerName || '' : ''; // Get manager name

            // Filter ports based on the selected branch's airport IATA code
            const filteredPorts = airportIata ? originalPortOptions.filter(opt =>
                opt.value === airportIata
            ) : [];

            // Populate the manager input field
            if (regionalManagerInput) {
                regionalManagerInput.value = managerName;
            }

            updateDropdown(portSelect, filteredPorts, 'Select Port...');

            // If there's only one valid port, select it automatically
            if (portSelect.options.length === 2) { // placeholder + 1 valid option
                portSelect.selectedIndex = 1;
            }
        });
    }
});
