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
            // Filter countries by region and that have branches
            const countryCodesWithBranches = [...new Set(originalBranchOptions.map(opt => opt.dataset.country.toLowerCase()))];
            
            const filteredCountries = originalCountryOptions.filter(countryOpt => {
                const regionMatch = countryOpt.dataset.region === selectedRegion;
                const hasBranch = countryCodesWithBranches.includes(countryOpt.value.toLowerCase());
                return regionMatch && hasBranch;
            });
            
            updateDropdown(countrySelect, filteredCountries);
        } else {
            updateDropdown(countrySelect, [], 'Select Country...');
            updateDropdown(branchSelect, [], 'Select Branch...');
            if (portSelect) updateDropdown(portSelect, [], 'Select Port...');
        }
    });

    // When country changes
    countrySelect.addEventListener('change', function() {
        const selectedCountry = countrySelect.value;
        branchSelect.disabled = !selectedCountry;
        if (portSelect) portSelect.disabled = true;

        if (selectedCountry) {
            // Filter branches by country
            const filteredBranches = originalBranchOptions.filter(branchOpt => 
                branchOpt.dataset.country.toLowerCase() === selectedCountry.toLowerCase()
            );
            
            updateDropdown(branchSelect, filteredBranches);
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
    placeholder.disabled = true;
    placeholder.hidden = true;
    select.appendChild(placeholder);

    // Add new options
    options.forEach(option => {
        select.appendChild(option.cloneNode(true));
    });

    // Enable/disable based on options available
    select.disabled = options.length === 0;

    // If there are options, select the first real option and trigger change event
    if (options.length > 0) {
        select.selectedIndex = 1;
        const event = new Event('change');
        select.dispatchEvent(event);
    }
}

// Other existing functions...
