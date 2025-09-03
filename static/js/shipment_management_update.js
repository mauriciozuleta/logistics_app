// Updated shipment_management.js - Modified to work with the Trader model for all regional/branch data

document.addEventListener('DOMContentLoaded', function() {
    // Initialize trading section functionality
    initTradingSelects();
    
    // Other existing initializations
    // ...
});

/**
 * Initializes the trading section selects (region, country, branch) for both shipper and consignee
 */
function initTradingSelects() {
    // Setup for shipper (trading) section
    setupRegionCountryBranchSelects({
        regionSelect: document.getElementById('trading_region'),
        countrySelect: document.getElementById('trading_country'),
        branchSelect: document.getElementById('trading_branch'),
        portSelect: document.getElementById('port_of_shipping'),
        regionalManagerInput: document.getElementById('trading_regional_manager')
    }, 0);

    // Setup for consignee section  
    setupRegionCountryBranchSelects({
        regionSelect: document.getElementById('consignee_region'),
        countrySelect: document.getElementById('consignee_country'),
        branchSelect: document.getElementById('consignee_branch'),
        portSelect: document.getElementById('consignee_port_of_shipping'),
        regionalManagerInput: document.getElementById('consignee_regional_manager')
    }, 1);
}

/**
 * Sets up the cascading dropdown functionality for region->country->branch
 * @param {Object} setup - Object containing references to all needed elements
 * @param {number} index - 0 for shipper, 1 for consignee
 */
function setupRegionCountryBranchSelects(setup, index) {
    const selectors = {
        regionSelect: index === 0 ? 'trading_region' : 'consignee_region',
        countrySelect: index === 0 ? 'trading_country' : 'consignee_country',
        branchSelect: index === 0 ? 'trading_branch' : 'consignee_branch',
        portSelect: index === 0 ? 'port_of_shipping' : 'consignee_port_of_shipping',
        regionalManagerInput: index === 0 ? 'trading_regional_manager' : 'consignee_regional_manager',
    };

    const { regionSelect, countrySelect, branchSelect, portSelect, regionalManagerInput } = setup;
    if (!regionSelect || !countrySelect || !branchSelect) return;

    // Store original options to filter
    const originalCountryOptions = Array.from(countrySelect.querySelectorAll('option:not([value=""])'));
    const originalBranchOptions = Array.from(branchSelect.querySelectorAll('option:not([value=""])'));
    const originalPortOptions = portSelect ? Array.from(portSelect.querySelectorAll('option:not([value=""])')) : [];

    // When region changes
    regionSelect.addEventListener('change', function() {
        const selectedRegion = regionSelect.value;
        
        // Update regional manager field
        if (regionalManagerInput && window.regionManagerMap && selectedRegion) {
            regionalManagerInput.value = window.regionManagerMap[selectedRegion] || '';
        } else if (regionalManagerInput) {
            regionalManagerInput.value = '';
        }

        // Reset country and branch
        countrySelect.disabled = !selectedRegion;
        branchSelect.disabled = true;
        if (portSelect) portSelect.disabled = true;

        if (selectedRegion) {
            // Safely get a unique list of country codes that have branches.
            // This prevents errors if a branch option is missing its `data-country` attribute,
            // which could cause the entire filtering process to fail or produce incorrect results.
            const countryCodesWithBranches = [...new Set(
                originalBranchOptions
                    .map(opt => opt.dataset.country) // Get the country code, which might be undefined
                    .filter(Boolean) // Filter out any undefined/null/empty values
                    .map(code => code.toLowerCase()) // Convert valid codes to lowercase
            )];
            
            // Filter countries by region and ensure they have associated branches.
            const filteredCountries = originalCountryOptions.filter(countryOpt => {
                // Safely check the region and that the country has a branch.
                const regionMatch = countryOpt.dataset.region && countryOpt.dataset.region === selectedRegion;
                const hasBranch = countryCodesWithBranches.includes(countryOpt.value.toLowerCase());
                return regionMatch && hasBranch;
            });
            
            updateDropdown(countrySelect, filteredCountries, 'Select Country...');
            // If only one country is found, auto-select it to trigger the cascade to the branch level.
            // This improves UX by not forcing a selection when there's only one choice.
            if (filteredCountries.length === 1) {
                countrySelect.selectedIndex = 1;
                countrySelect.dispatchEvent(new Event('change'));
            }
        } else {
            updateDropdown(countrySelect, [], 'Select Country...');
            updateDropdown(branchSelect, [], 'Select Branch...');
            if (portSelect) updateDropdown(portSelect, [], 'Select Port...');
        }
    });

    // When country changes
    countrySelect.addEventListener('change', function() {
        // --- Restore product list population for trading section ---
        if (index === 0 && selectedCountry) {
            // Fetch products for selected country (AJAX or from window.productData)
            if (window.productData && window.productData[selectedCountry]) {
                populateProductList(window.productData[selectedCountry]);
            } else {
                // Example AJAX fetch (adjust endpoint as needed)
                fetch(`/api/products_by_country?country_code=${selectedCountry}`)
                    .then(res => res.json())
                    .then(products => {
                        populateProductList(products);
                    });
            }
        }
    // --- Restore 'add cargo to return route' population ---
    var addCargoToReturnField = document.getElementById('add_cargo_to_return');
    if (addCargoToReturnField && route && route.summary) {
        var routeBaseReturn = route.summary.split('(')[0].trim();
        addCargoToReturnField.value = routeBaseReturn;
    }
        const selectedCountry = countrySelect.value;
        branchSelect.disabled = !selectedCountry;
        if (portSelect) portSelect.disabled = true;

        if (selectedCountry) {
            // Debug: log all branch options and their data-country
            console.log('All branch options:', originalBranchOptions.map(opt => ({
                value: opt.value,
                text: opt.textContent,
                dataCountry: opt.dataset.country
            })));

            // Filter branches by country, safely handling potentially missing `data-country` attributes.
            const filteredBranches = originalBranchOptions.filter(branchOpt => {
                const branchCountry = branchOpt.dataset.country;
                return branchCountry && branchCountry.trim().toLowerCase() === selectedCountry.trim().toLowerCase();
            });

            // Debug: log filtered branches
            console.log('Filtered branches for country', selectedCountry, ':', filteredBranches.map(opt => ({
                value: opt.value,
                text: opt.textContent,
                dataCountry: opt.dataset.country
            })));

            updateDropdown(branchSelect, filteredBranches, 'Select Branch...');

            // If there's only one branch for the selected country, auto-select it.
            if (filteredBranches.length === 1) {
                branchSelect.selectedIndex = 1; // The first actual option
                branchSelect.dispatchEvent(new Event('change'));
            }
        } else {
            updateDropdown(branchSelect, [], 'Select Branch...');
            if (portSelect) updateDropdown(portSelect, [], 'Select Port...');
        }
    });

    // When branch changes
    branchSelect.addEventListener('change', function() {
        const selectedBranch = branchSelect.value;
        if (portSelect) {
            portSelect.disabled = !selectedBranch;
            
            if (selectedBranch) {
                const branchOption = branchSelect.options[branchSelect.selectedIndex];
                const airportIata = branchOption.dataset.airportIata;
                
                if (airportIata) {
                    // If this branch has an airport IATA code, select it in the port dropdown
                    for (let i = 0; i < portSelect.options.length; i++) {
                        if (portSelect.options[i].value === airportIata) {
                            portSelect.selectedIndex = i;
                            
                            // Trigger change event
                            const event = new Event('change');
                            portSelect.dispatchEvent(event);
                            break;
                        }
                    }
                } else {
                    // Just enable the port dropdown without selecting anything
                    updateDropdown(portSelect, originalPortOptions);
                }
            } else {
                updateDropdown(portSelect, [], 'Select Port...');
            }
        }
    });
}

/**
 * Updates a select dropdown with new options
 * @param {HTMLSelectElement} select - The select element to update
 * @param {Array} options - Array of option elements
 * @param {string} [placeholderText] - Optional text for placeholder option
 */
function updateDropdown(select, options, placeholderText = null) {
    // Start fresh by clearing all options
    select.innerHTML = '';

    // Add placeholder option
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = placeholderText || select.dataset.placeholder || 'Select...';
    placeholder.disabled = false;
    select.appendChild(placeholder);

    // Add all filtered options
    options.forEach(originalOption => {
        const newOption = document.createElement('option');
        newOption.value = originalOption.value;
        newOption.textContent = originalOption.textContent;
        Object.assign(newOption.dataset, originalOption.dataset);
        select.appendChild(newOption);
    });

    // Enable dropdown if there are options
    select.disabled = options.length === 0;

    // Always set selected index to placeholder
    select.selectedIndex = 0;
}

// Other existing functions...
