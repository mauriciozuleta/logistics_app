
// --- Shipment Draft Dictionary Logic ---
const SHIPMENT_DRAFT_KEY = 'shipmentDraft';

// Clear the draft on browser reload (fresh page load)
window.addEventListener('load', function() {
  localStorage.removeItem(SHIPMENT_DRAFT_KEY);
});

// Helper to get the current draft object
function getShipmentDraft() {
  const data = localStorage.getItem(SHIPMENT_DRAFT_KEY);
  return data ? JSON.parse(data) : {};
}

// Helper to save the draft object
function saveShipmentDraft(draft) {
  localStorage.setItem(SHIPMENT_DRAFT_KEY, JSON.stringify(draft));
  // Dispatch a custom event so other scripts on the page can react
  window.dispatchEvent(new CustomEvent('shipmentDraftUpdated', {
    detail: { draft }
  }));
}

document.addEventListener('DOMContentLoaded', function() {
  // --- CONFLICT OVERRIDE ---
  // This is an intentional override to prevent a conflicting function
  // in another file (e.g., product_table.js) from running and causing errors.
  // The correct logic for enabling/disabling cargo buttons is handled
  // entirely within this file by the `updateCargoButtonsState` function.
  window.updateAddCargoButtons = function() {
    console.warn('Conflict override: A redundant updateAddCargoButtons() function was blocked from running.');
  };

  // --- DOM Element Cache ---
  // New elements for cascading dropdowns
  const shipperRegionSelect = document.getElementById('shipper_region');
  const shipperCountrySelect = document.getElementById('shipper_country');
  const shipperBranchSelect = document.getElementById('shipper_branch');
  const consigneeRegionSelect = document.getElementById('consignee_region');
  const consigneeCountrySelect = document.getElementById('consignee_country');
  const consigneeBranchSelect = document.getElementById('consignee_branch');

  const shipmentRefField = document.getElementById('shipment_reference');
  const firstLegRouteSelect = document.getElementById('first_leg_route');
  const secondLegRouteSelect = document.getElementById('second_leg_route');
  const availableAircraftSelect = document.getElementById('available_aircraft');
  const returnTypeSelect = document.getElementById('return_type');
  const outboundPercentInput = document.getElementById('outbound_percent');
  const returnPercentInput = document.getElementById('return_percent');
  const outboundExtraInput = document.getElementById('outbound_extra');
  const returnExtraInput = document.getElementById('return_extra');
  const routeInfoSection = document.getElementById('route-info-section');
  const form = document.getElementById('shipment-form');
  const addCargoBtn = document.getElementById('add_product_cargo_btn');

  // Labels and spans that are frequently updated
  const outboundPercentLabel = document.getElementById('outbound_percent_label');
  const returnPercentLabel = document.getElementById('return_percent_label');
  const outboundExtraLabel = document.getElementById('outbound_extra_label');
  const returnExtraLabel = document.getElementById('return_extra_label');
  const totalFlightCostElement = document.getElementById('total_flight_cost');

  // Data from Flask
  const regionsWithBranches = window.regionsWithBranches || {};

// Collect current form data and update the draft
const updateShipmentDraftFromForm = function() {
  const draft = getShipmentDraft();
  draft.shipment_reference = shipmentRefField?.value || '';
  draft.shipper = shipperBranchSelect?.value || '';
  draft.consignee = consigneeBranchSelect?.value || '';
  draft.first_leg_route = firstLegRouteSelect?.value || '';
  draft.first_leg_route_text = firstLegRouteSelect.selectedIndex > 0 ? firstLegRouteSelect.options[firstLegRouteSelect.selectedIndex].text : '';
  draft.second_leg_route = secondLegRouteSelect?.value || '';
  draft.second_leg_route_text = secondLegRouteSelect.selectedIndex > 0 ? secondLegRouteSelect.options[secondLegRouteSelect.selectedIndex].text : '';
  draft.available_aircraft = availableAircraftSelect?.value || '';
  draft.return_type = returnTypeSelect?.value || '';
  draft.outbound_percent = outboundPercentInput?.value || '';
  draft.return_percent = returnPercentInput?.value || '';
  draft.outbound_extra = outboundExtraInput?.value || '';
  draft.return_extra = returnExtraInput?.value || '';
  // Add more fields as needed
  saveShipmentDraft(draft);
};

// Attach update logic to relevant form fields
  [ shipmentRefField, shipperBranchSelect, consigneeBranchSelect, firstLegRouteSelect, secondLegRouteSelect,
    availableAircraftSelect, returnTypeSelect, outboundPercentInput, returnPercentInput, outboundExtraInput, returnExtraInput
  ].forEach(function(el) {
    if (el) {
      el.addEventListener('change', updateShipmentDraftFromForm);
      el.addEventListener('input', updateShipmentDraftFromForm);
    }
  });
  // Initial save
  updateShipmentDraftFromForm();

  // --- New Cascading Dropdown Logic ---

  function setupCascadingDropdowns(regionSelect, countrySelect, branchSelect) {
    regionSelect.addEventListener('change', function() {
      const selectedRegion = this.value;
      countrySelect.innerHTML = '<option value="">Select Country...</option>';
      branchSelect.innerHTML = '<option value="">Select Branch...</option>';
      countrySelect.disabled = !selectedRegion;
      branchSelect.disabled = true;

      if (selectedRegion && regionsWithBranches[selectedRegion]) {
        const countries = Object.keys(regionsWithBranches[selectedRegion]).sort();
        countries.forEach(country => {
          const option = document.createElement('option');
          option.value = country;
          option.textContent = country;
          countrySelect.appendChild(option);
        });
        countrySelect.disabled = false;
      }
    });

    countrySelect.addEventListener('change', function() {
      const selectedRegion = regionSelect.value;
      const selectedCountry = this.value;
      branchSelect.innerHTML = '<option value="">Select Branch...</option>';
      branchSelect.disabled = !selectedCountry;

      if (selectedRegion && selectedCountry && regionsWithBranches[selectedRegion] && regionsWithBranches[selectedRegion][selectedCountry]) {
        const branches = regionsWithBranches[selectedRegion][selectedCountry];
        branches.forEach(branch => {
          const option = document.createElement('option');
          option.value = branch.id;
          // Build label from non-empty, trimmed values only, avoiding case-insensitive duplicates.
          const labelParts = [];
          const seen = new Set();
          const addPart = (part) => {
            if (part && typeof part === 'string' && part.trim()) {
              const trimmedPart = part.trim();
              const upperPart = trimmedPart.toUpperCase();
              if (!seen.has(upperPart)) {
                seen.add(upperPart);
                labelParts.push(trimmedPart);
              }
            }
          };
          addPart(branch.airport_iata);
          addPart(branch.airport_name);
          addPart(branch.city);
          option.textContent = labelParts.join(' - ');
          branchSelect.appendChild(option);
        });
        branchSelect.disabled = false;
      }
    });

    branchSelect.addEventListener('change', function() {
      generateShipmentReference();
      // Defensively check that both branch selects exist and have values
      if (shipperBranchSelect && shipperBranchSelect.value && consigneeBranchSelect && consigneeBranchSelect.value) {
        // Get selected shipper and consignee branch IDs
        const shipperId = shipperBranchSelect.value;
        const consigneeId = consigneeBranchSelect.value;
        // Use traderData for a more direct and reliable lookup
        const shipperBranch = window.traderData[shipperId];
        const consigneeBranch = window.traderData[consigneeId];
        const shipperIata = shipperBranch && shipperBranch.airport_iata ? shipperBranch.airport_iata.trim() : '';
        const consigneeIata = consigneeBranch && consigneeBranch.airport_iata ? consigneeBranch.airport_iata.trim() : '';

        // Check if a route exists between these IATA codes
        let routeExists = false;
        if (shipperIata && consigneeIata) {
          const shipperIataUpper = shipperIata.toUpperCase();
          const consigneeIataUpper = consigneeIata.toUpperCase();
          for (const routeId in window.routeData) {
            const route = window.routeData[routeId];
            if (route.fromAirport && route.toAirport &&
                route.fromAirport.trim().toUpperCase() === shipperIataUpper &&
                route.toAirport.trim().toUpperCase() === consigneeIataUpper) {
              routeExists = true;
              break;
            }
          }
        }
        // Defensively check if the route-alert element exists to prevent script crashes.
        const routeAlert = document.getElementById('route-alert');
        if (routeAlert) {
          if (!routeExists && shipperIata && consigneeIata) {
            routeAlert.style.display = 'block';
            routeAlert.textContent = `No route exists between ${shipperIata} and ${consigneeIata}. Please create a route first.`;
          } else {
            routeAlert.style.display = 'none';
          }
        }
        loadRoutesLogic();
      }
    });
  }

  setupCascadingDropdowns(shipperRegionSelect, shipperCountrySelect, shipperBranchSelect);
  setupCascadingDropdowns(consigneeRegionSelect, consigneeCountrySelect, consigneeBranchSelect);
  
  console.log('Trader data loaded:', traderData);
  console.log('Route data loaded:', routeData);
  // For debug: log the shipment draft on every update
  window.addEventListener('storage', function(e) {
    if (e.key === SHIPMENT_DRAFT_KEY) {
      console.log('Shipment draft updated:', getShipmentDraft());
    }
  });

  // Helper function to format payload with thousand separators
  function formatPayloadWithSeparators(payloadText) {
    if (!payloadText) return 'N/A';
    const payloadMatch = payloadText.match(/(\d+(?:\.\d+)?)/);
    if (payloadMatch) {
      const payloadValue = parseFloat(payloadMatch[1]);
      const formattedValue = payloadValue >= 1000 ? 
        payloadValue.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 2}) : 
        payloadValue.toString();
      return payloadText.replace(payloadMatch[1], formattedValue);
    }
    return payloadText;
  }

  function formatCostForLabel(cost) {
    if (!cost || cost <= 0) return '';
    const formattedCost = cost.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    return ` (<span style="color: #00ff00;">${formattedCost}</span>)`;
  }

  function formatLoadForLabel(loadInKg) {
    if (!loadInKg || loadInKg <= 0) return '';
    const formattedLoad = loadInKg.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    return ` (<span style="color: #00ff00;">${formattedLoad} kg</span>)`;
  }

  function updateCostAllocationUI() {
    const returnType = returnTypeSelect.value;
    if (returnType === 'compensated') {
      outboundPercentInput.disabled = false;
      outboundPercentInput.value = outboundPercentInput.value || 100;
      if (outboundExtraInput) outboundExtraInput.disabled = false;
      if (returnExtraInput) returnExtraInput.disabled = false;
    } else if (returnType === 'full') {
      outboundPercentInput.disabled = true;
      outboundPercentInput.value = 100;
      if (outboundExtraInput) outboundExtraInput.disabled = false; // Enable outbound target cargo load for full return
      if (returnExtraInput) returnExtraInput.disabled = true; // Keep return target cargo load disabled for full return
    } else {
      outboundPercentInput.disabled = true;
      outboundPercentInput.value = 100;
      if (outboundExtraInput) outboundExtraInput.disabled = true;
      if (returnExtraInput) returnExtraInput.disabled = true;
    }
  }

  function updatePercentFields() {
    if (!returnTypeSelect || !outboundPercentInput || !returnPercentInput) return;

    // 1. Update the UI state (enable/disable/set values) based on return type
    updateCostAllocationUI();

    // 2. Read values from the form AFTER UI has been updated
    const outboundVal = parseFloat(outboundPercentInput.value) || 100;
    const returnVal = 100 - outboundVal < 0 ? 0 : 100 - outboundVal;
    returnPercentInput.value = returnVal.toFixed(2);

    // 3. Perform calculations based on the new values
    let totalFlightCost = 0;
    if (totalFlightCostElement && totalFlightCostElement.textContent && totalFlightCostElement.textContent !== 'N/A' && !totalFlightCostElement.textContent.includes('Error')) {
      totalFlightCost = parseFloat(totalFlightCostElement.textContent.replace(/[$,]/g, '')) || 0;
    }

    // 4. Update UI labels with calculated results
    const outboundCost = totalFlightCost * (outboundVal / 100);
    if (outboundPercentLabel) outboundPercentLabel.innerHTML = `Outbound %${formatCostForLabel(outboundCost)}`;

    const returnCost = totalFlightCost * (returnVal / 100);
    if (returnPercentLabel) returnPercentLabel.innerHTML = `Return %${formatCostForLabel(returnCost)}`;

    // 5. Update target cargo load labels
    calculateAndDisplayTargetLoad(firstLegRouteSelect, outboundExtraInput, outboundExtraLabel, (returnTypeSelect.value === 'compensated' || returnTypeSelect.value === 'full'));
    calculateAndDisplayTargetLoad(secondLegRouteSelect, returnExtraInput, returnExtraLabel, (returnTypeSelect.value === 'compensated'));

      // Recalculate costs when percentages change - but only if aircraft is selected
      try {
        if (availableAircraftSelect && availableAircraftSelect.value) {
          calculateTotalFlightCostSafely();
          calculateKgCostsSafely();
        }
      } catch (error) {
        console.error('Error updating costs from percentage change:', error);
      }
    }

  function calculateAndDisplayTargetLoad(routeSelect, percentInput, targetLabel, isEnabled) {
    if (!targetLabel) return;

    if (!isEnabled) {
      targetLabel.innerHTML = 'target cargo load (%)';
      return;
    }

    let payload = 0;
    const routeId = routeSelect ? routeSelect.value : null;
    if (routeId && routeData[routeId] && routeData[routeId].payload) {
      const payloadText = routeData[routeId].payload;
      const payloadMatch = payloadText.match(/(\d+(?:\.\d+)?)/);
      if (payloadMatch) payload = parseFloat(payloadMatch[1]) || 0;
    }
    const targetCargoPercent = parseFloat(percentInput ? percentInput.value : 0) || 0;
    const targetCargo = payload * (targetCargoPercent / 100);
    targetLabel.innerHTML = `target cargo load (%)${formatLoadForLabel(targetCargo)}`;
  }

  function preventEnterSubmit(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      updatePercentFields(); // Update calculations instead
    }
  }

  if (returnTypeSelect && outboundPercentInput) {
    returnTypeSelect.addEventListener('change', updatePercentFields);
    outboundPercentInput.addEventListener('input', updatePercentFields);
        // Add event listeners for target cargo load percentage inputs
    if (outboundExtraInput) {
      outboundExtraInput.addEventListener('input', updatePercentFields);
      outboundExtraInput.addEventListener('keydown', preventEnterSubmit);
    }
    if (returnExtraInput) {
      returnExtraInput.addEventListener('input', updatePercentFields);
      returnExtraInput.addEventListener('keydown', preventEnterSubmit);
    }
    // Initialize on load
    updatePercentFields();
  }


  // Helper functions
  function updateCityField(selectElement, cityField) {
    // This function is called but cityField elements don't exist in HTML
    // Keeping for compatibility but making it safe
    if (cityField && selectElement.value && traderData[selectElement.value]) {
      cityField.value = traderData[selectElement.value].city;
    }
  }

  function generateShipmentReference() {
    // Defensively check for elements before using them.
    if (!shipperBranchSelect || !consigneeBranchSelect || !shipmentRefField) {
      return;
    }
    const shipperId = shipperBranchSelect.value;
    const consigneeId = consigneeBranchSelect.value;
    
    if (shipperId && consigneeId && traderData[shipperId] && traderData[consigneeId]) {
      const shipperCode = traderData[shipperId].code;
      const consigneeCode = traderData[consigneeId].code;
      const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      shipmentRefField.value = `${shipperCode}-${consigneeCode}-${timestamp}`;
    }
  }

  // Preload aircraft list with all unique aircraft from the aircraft column in routeData
  function preloadAllAircraftFromRoutes() {
    const aircraftSet = new Set();
    Object.values(routeData).forEach(route => {
      // route.aircraft can be a string or array, normalize to array
      if (route.aircraft) {
        if (Array.isArray(route.aircraft)) {
          route.aircraft.forEach(ac => {
            if (ac && typeof ac === 'string' && ac.trim() !== '') {
              aircraftSet.add(ac.trim());
            }
          });
        } else if (typeof route.aircraft === 'string' && route.aircraft.trim() !== '') {
          // If aircraft is a comma-separated string
          route.aircraft.split(',').forEach(ac => {
            if (ac && ac.trim() !== '') {
              aircraftSet.add(ac.trim());
            }
          });
        }
      }
    });
    availableAircraftSelect.innerHTML = '<option value="">Select Aircraft...</option>';
    Array.from(aircraftSet).sort().forEach(ac => {
      const acOption = document.createElement('option');
      acOption.value = ac;
      acOption.textContent = ac;
      availableAircraftSelect.appendChild(acOption);
    });
  }
  preloadAllAircraftFromRoutes();

  // Aircraft selection control logic
  function updateAircraftAvailability() {
    const firstLegRouteValue = firstLegRouteSelect.value;
    
    // Aircraft is only available when the First Leg Route is selected
    if (firstLegRouteValue) {
      availableAircraftSelect.disabled = false;
    } else {
      // Disable aircraft selection if no departure route is selected
      availableAircraftSelect.disabled = true;
      availableAircraftSelect.value = ''; // Clear selection
      // Clear route information when aircraft becomes unavailable
      clearRouteInformationSafely();
    }
  }

  // Add event listener to show message when trying to select disabled aircraft
  availableAircraftSelect.addEventListener('click', function(e) {
    if (this.disabled) {
      // Simplified alert to match the new, correct logic
      alert('Please select a Departure Route before choosing an aircraft.');
      e.preventDefault();
      return false;
    }
  });

  // Aircraft Selection Logic - Enhanced Debugging
  // Add event listener to aircraft selection to populate route information
  availableAircraftSelect.addEventListener('change', function() {
    console.log('=== AIRCRAFT SELECTION TRIGGERED ===');
    console.log('Selected aircraft:', this.value);

    // Filter the return routes based on the selected aircraft.
    // This is the correct place for this logic.
    updateReturnRoutes(this.value);

    console.log('First leg route selected:', firstLegRouteSelect.value);
    console.log('Second leg route selected:', secondLegRouteSelect.value);
    console.log('Route data available:', Object.keys(routeData).length, 'routes');
    
    try {
      populateRouteInformationSafely();
      updateShipmentSummaryRoutes();
    } catch (error) {
      console.error('Error in aircraft selection:', error);
      alert('Error populating route information: ' + error.message);
    }
  });

  // Enhanced route information population with detailed debugging
  function populateRouteInformationSafely() {
    console.log('=== POPULATE ROUTE INFORMATION CALLED ===');
    
    const selectedAircraft = availableAircraftSelect.value;
    console.log('Selected aircraft:', selectedAircraft);
    
    if (!selectedAircraft) {
      console.log('No aircraft selected, clearing fields');
      clearRouteInformationSafely();
      return;
    }

    // Check if we have required data
    console.log('Route data exists:', !!routeData);
    console.log('First leg select exists:', !!firstLegRouteSelect);
    console.log('Second leg select exists:', !!secondLegRouteSelect);

    if (routeData && firstLegRouteSelect && secondLegRouteSelect) {
      const firstLegRouteId = firstLegRouteSelect.value;
      const secondLegRouteId = secondLegRouteSelect.value;
      
      console.log('First leg route ID:', firstLegRouteId);
      console.log('Second leg route ID:', secondLegRouteId);
      
      // Ensure both routes are selected
      if (!firstLegRouteId || !secondLegRouteId) {
        console.log('Missing route selections - clearing fields');
        clearRouteInformationSafely();
        return;
      }
      
      // Check if route data exists for selected routes
      console.log('First leg route exists in data:', !!routeData[firstLegRouteId]);
      console.log('Second leg route exists in data:', !!routeData[secondLegRouteId]);
      
      // Populate first leg route information
      if (routeData[firstLegRouteId]) {
        const firstLegRoute = routeData[firstLegRouteId];
        console.log('First leg route data:', firstLegRoute);
        
        console.log('Updating first leg fields...');
        safelyUpdateElement('first_leg_distance', firstLegRoute.distance);
        safelyUpdateElement('first_leg_flight_time', firstLegRoute.flight_time);
        safelyUpdateElement('first_leg_route_cost', firstLegRoute.cost ? `$${parseFloat(firstLegRoute.cost) >= 1000 ? parseFloat(firstLegRoute.cost).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : parseFloat(firstLegRoute.cost).toFixed(2)}` : 'No Cost');
        safelyUpdateElement('first_leg_payload', firstLegRoute.payload ? formatPayloadWithSeparators(firstLegRoute.payload) : 'N/A');
        console.log('First leg fields updated');
      } else {
        console.warn('First leg route data not found for ID:', firstLegRouteId);
      }

      // Populate second leg route information
      if (routeData[secondLegRouteId]) {
        const secondLegRoute = routeData[secondLegRouteId];
        console.log('Second leg route data:', secondLegRoute);
        
        console.log('Updating second leg fields...');
        safelyUpdateElement('second_leg_distance', secondLegRoute.distance);
        safelyUpdateElement('second_leg_flight_time', secondLegRoute.flight_time);
        safelyUpdateElement('second_leg_route_cost', secondLegRoute.cost ? `$${parseFloat(secondLegRoute.cost) >= 1000 ? parseFloat(secondLegRoute.cost).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : parseFloat(secondLegRoute.cost).toFixed(2)}` : 'No Cost');
        safelyUpdateElement('second_leg_payload', secondLegRoute.payload ? formatPayloadWithSeparators(secondLegRoute.payload) : 'N/A');
        console.log('Second leg fields updated');
      } else {
        console.warn('Second leg route data not found for ID:', secondLegRouteId);
      }

      // Calculate total flight cost
      console.log('Calculating total flight cost...');
      calculateTotalFlightCostFromRoutes();
      
      // Calculate kg costs
      console.log('Calculating kg costs...');
      calculateKgCostsSafely();

      // Manually trigger a draft update to ensure the summary table refreshes
      updateShipmentDraftFromForm();
      
      console.log('=== ROUTE POPULATION COMPLETE ===');
    } else {
      console.error('Missing required elements or data');
      console.log('routeData:', !!routeData);
      console.log('firstLegRouteSelect:', !!firstLegRouteSelect);
      console.log('secondLegRouteSelect:', !!secondLegRouteSelect);
    }
  }

  // Calculate total flight cost as sum of both route costs
  function calculateTotalFlightCostFromRoutes() {
    try {
      const firstLegRouteId = firstLegRouteSelect.value;
      const secondLegRouteId = secondLegRouteSelect.value;
      
      if (!firstLegRouteId || !secondLegRouteId) {
        safelyUpdateElement('total_flight_cost', 'N/A');
        return;
      }

      let totalCost = 0;
      
      // Add first leg cost
      if (routeData[firstLegRouteId] && routeData[firstLegRouteId].cost) {
        const firstLegCost = parseFloat(routeData[firstLegRouteId].cost) || 0;
        totalCost += firstLegCost;
        console.log('First leg cost:', firstLegCost);
      }
      
      // Add second leg cost (full cost - sum of both routes)
      if (routeData[secondLegRouteId] && routeData[secondLegRouteId].cost) {
        const secondLegCost = parseFloat(routeData[secondLegRouteId].cost) || 0;
        totalCost += secondLegCost;
        console.log('Second leg cost:', secondLegCost);
      }
      
      console.log('Total flight cost calculated:', totalCost);
      safelyUpdateElement('total_flight_cost', totalCost > 0 ? `$${totalCost >= 1000 ? totalCost.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : totalCost.toFixed(2)}` : 'N/A');
      
    } catch (error) {
      console.error('Error calculating total flight cost from routes:', error);
      safelyUpdateElement('total_flight_cost', 'Error');
    }
  }

  // Enhanced helper function to safely update DOM elements with debugging
  function safelyUpdateElement(elementId, value) {
    try {
      console.log(`Updating element ${elementId} with value:`, value);
      const element = document.getElementById(elementId);
      
      if (element) {
        const displayValue = value || 'N/A';
        element.textContent = displayValue;
        console.log(`✓ Successfully updated ${elementId} to: ${displayValue}`);
      } else {
        console.error(`✗ Element not found: ${elementId}`);
      }
    } catch (error) {
      console.error(`Error updating element ${elementId}:`, error);
    }
  }

// Update the shipment summary table Route columns
function updateShipmentSummaryRoutes() {
  // Departure Route
  const depRouteCell = document.getElementById('summary_dep_route');
  if (depRouteCell && firstLegRouteSelect.selectedIndex > 0) {
    depRouteCell.textContent = firstLegRouteSelect.options[firstLegRouteSelect.selectedIndex].text;
  } else if (depRouteCell) {
    depRouteCell.textContent = '-';
  }
  // Return Route
  const retRouteCell = document.getElementById('summary_ret_route');
  if (retRouteCell && secondLegRouteSelect.selectedIndex > 0) {
    retRouteCell.textContent = secondLegRouteSelect.options[secondLegRouteSelect.selectedIndex].text;
  } else if (retRouteCell) {
    retRouteCell.textContent = '-';
  }
}
  // Function to update the shipment summary display
  

  // Function to show the cargo management section
  function showCargoManagementSection() {
    const cargoSection = document.getElementById('cargo-management-section');
    if (cargoSection) {
      cargoSection.style.display = 'block';
      // Scroll to the cargo section
      cargoSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // Safely clear all route information fields
  function clearRouteInformationSafely() {
    const fieldsToReset = [
      'first_leg_distance', 'first_leg_flight_time', 'first_leg_route_cost', 'first_leg_payload',
      'second_leg_distance', 'second_leg_flight_time', 'second_leg_route_cost', 'second_leg_payload',
      'total_flight_cost', 'outbound_kg_cost', 'return_kg_cost'
    ];
    
    fieldsToReset.forEach(fieldId => {
      safelyUpdateElement(fieldId, 'N/A');
    });
  }

  // Safely calculate total flight cost
  function calculateTotalFlightCostSafely() {
    try {
      if (!firstLegRouteSelect || !secondLegRouteSelect) {
        return;
      }

      const firstLegRouteId = firstLegRouteSelect.value;
      const secondLegRouteId = secondLegRouteSelect.value;

      let totalCost = 0;

      // Always add both route costs, regardless of return type or percentages
      if (firstLegRouteId && routeData[firstLegRouteId] && routeData[firstLegRouteId].cost) {
        totalCost += parseFloat(routeData[firstLegRouteId].cost) || 0;
      }
      if (secondLegRouteId && routeData[secondLegRouteId] && routeData[secondLegRouteId].cost) {
        totalCost += parseFloat(routeData[secondLegRouteId].cost) || 0;
      }

      safelyUpdateElement('total_flight_cost', totalCost > 0 ? `$${totalCost >= 1000 ? totalCost.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : totalCost.toFixed(2)}` : 'N/A');
    } catch (error) {
      console.error('Error calculating total flight cost:', error);
      safelyUpdateElement('total_flight_cost', 'Error');
    }
  }

  function getPayloadForRoute(routeId) {
    if (routeId && routeData[routeId] && routeData[routeId].payload) {
      const payloadText = routeData[routeId].payload;
      const payloadMatch = payloadText.match(/(\d+(?:\.\d+)?)/);
      if (payloadMatch) {
        return parseFloat(payloadMatch[1]) || 0;
      }
    }
    return 0;
  }

  // Safely calculate kg costs
  function calculateKgCostsSafely() {
    try {
      if (!outboundPercentInput || !returnPercentInput) {
        return;
      }
      if (!totalFlightCostElement) return;
      
      const totalFlightCostText = totalFlightCostElement.textContent;
      const outboundPercent = parseFloat(outboundPercentInput.value) || 0;
      const returnPercent = parseFloat(returnPercentInput.value) || 0;
      
      if (totalFlightCostText && totalFlightCostText !== 'N/A' && !totalFlightCostText.includes('Error')) {
        // Remove $ and commas, then parse
        const totalCost = parseFloat(totalFlightCostText.replace(/[$,]/g, '')) || 0;
        
        // Calculate outbound kg cost: outbound % cost divided by target cargo load (in kg)
        const outboundTargetCargoPercent = parseFloat(outboundExtraInput ? outboundExtraInput.value : 0) || 0;
        let outboundKgCost = 0;
        if (outboundTargetCargoPercent > 0) {
          const outboundCost = totalCost * (outboundPercent / 100);
          const payload = getPayloadForRoute(firstLegRouteSelect.value);
          const targetCargoKg = payload * (outboundTargetCargoPercent / 100);
          if (targetCargoKg > 0) {
            outboundKgCost = outboundCost / targetCargoKg;
          }
        }
        
        // Calculate return kg cost: return % cost divided by target cargo load (in kg)
        const returnTargetCargoPercent = parseFloat(returnExtraInput ? returnExtraInput.value : 0) || 0;
        let returnKgCost = 0;
        if (returnTargetCargoPercent > 0) {
          const returnCost = totalCost * (returnPercent / 100);
          const payload = getPayloadForRoute(secondLegRouteSelect.value);
          const targetCargoKg = payload * (returnTargetCargoPercent / 100);
          if (targetCargoKg > 0) {
            returnKgCost = returnCost / targetCargoKg;
          }
        }
        
        safelyUpdateElement('outbound_kg_cost', outboundKgCost > 0 ? `$${outboundKgCost >= 1 ? outboundKgCost.toLocaleString('en-US', {minimumFractionDigits: 3, maximumFractionDigits: 3}) : outboundKgCost.toFixed(3)}/kg` : 'N/A');
        safelyUpdateElement('return_kg_cost', returnKgCost > 0 ? `$${returnKgCost >= 1 ? returnKgCost.toLocaleString('en-US', {minimumFractionDigits: 3, maximumFractionDigits: 3}) : returnKgCost.toFixed(3)}/kg` : 'N/A');
      } else {
        safelyUpdateElement('outbound_kg_cost', 'N/A');
        safelyUpdateElement('return_kg_cost', 'N/A');
      }
    } catch (error) {
      console.error('Error calculating kg costs:', error);
      safelyUpdateElement('outbound_kg_cost', 'Error');
      safelyUpdateElement('return_kg_cost', 'Error');
    }
  }

  // New function to filter return routes based on the selected aircraft
  function updateReturnRoutes(selectedAircraft) {
    console.log(`Filtering return routes for aircraft: ${selectedAircraft || 'None'}`);
    const consigneeId = consigneeBranchSelect.value; // Corrected from consigneeSelect
    const returnMessageEl = document.getElementById('return-route-message');

    // Preserve the current selection to try and re-select it later
    const currentReturnRoute = secondLegRouteSelect.value;
    // Clear previous options and message
    secondLegRouteSelect.innerHTML = '<option value="">Return Route...</option>';
    if (returnMessageEl) returnMessageEl.style.display = 'none';

    // If no consignee is selected, we can't filter.
    if (!consigneeId) {
      return;
    }

    const consigneeIata = window.traderData[consigneeId]?.airport_iata; // Use IATA code
    if (!consigneeIata) return;
    const consigneeIataUpper = consigneeIata.trim().toUpperCase();

    let routesFound = 0;
    Object.entries(window.routeData).forEach(([routeId, route]) => {
      // Check if the route starts from the consignee's IATA code
      if (route.fromAirport && route.fromAirport.trim().toUpperCase() === consigneeIataUpper) {
        // This is a potential return route.
        // If an aircraft is selected, check if this route supports it.
        // If no aircraft is selected, show all potential return routes.
        if (!selectedAircraft || (route.aircraft && route.aircraft.includes(selectedAircraft))) {
          const option = document.createElement('option');
          option.value = routeId;
          option.textContent = route.summary;
          secondLegRouteSelect.appendChild(option);
          routesFound++;
        }
      }
    });

    // If the previously selected route is still in the list, re-select it.
    if (Array.from(secondLegRouteSelect.options).some(opt => opt.value === currentReturnRoute)) {
      secondLegRouteSelect.value = currentReturnRoute;
    } else {
      // If the old selection is no longer valid, trigger a change event to update dependent UI
      if (secondLegRouteSelect.value !== currentReturnRoute) {
        secondLegRouteSelect.dispatchEvent(new Event('change'));
      }
    }

    // If no matching return routes were found for a specific aircraft, show a message.
    if (routesFound === 0 && selectedAircraft && returnMessageEl) {
      returnMessageEl.innerHTML = `No return route found for ${selectedAircraft}. <a href="/operations/add-route" style="color: #2196f3;">Add one?</a>`;
      returnMessageEl.style.display = 'block';
    }
  }

  // New function to populate the aircraft dropdown for a specific route
  function populateAircraftForRoute(routeId) {
    const previousAircraft = availableAircraftSelect.value;
    availableAircraftSelect.innerHTML = '<option value="">Select Aircraft...</option>'; // Clear existing options

    if (routeId && window.routeData[routeId]) {
      const route = window.routeData[routeId];
      const aircraftList = Array.isArray(route.aircraft) ? route.aircraft : [];

      aircraftList.forEach(ac => {
        const option = document.createElement('option');
        option.value = ac;
        option.textContent = ac;
        availableAircraftSelect.appendChild(option);
      });

      // If there's only one aircraft for the route, auto-select it
      if (aircraftList.length === 1) {
        availableAircraftSelect.value = aircraftList[0];
      }
    }

    // If the selection has changed (e.g. cleared or auto-selected), fire the change event
    // This is crucial for triggering the dependent logic like filtering return routes.
    if (availableAircraftSelect.value !== previousAircraft) {
      availableAircraftSelect.dispatchEvent(new Event('change'));
    }
  }

  // Route Selection Event Listeners - Isolated and Safe
  // Add event listener to first leg route to update aircraft availability and recalculate
  firstLegRouteSelect.addEventListener('change', function() {
    try {
      const selectedRouteId = this.value;
      
      console.log('Departure route changed. Populating available aircraft...');

      // Populate the aircraft dropdown based on the selected route
      // This will now trigger a change event on the aircraft dropdown if the selection changes,
      // which in turn will filter the return routes.
      populateAircraftForRoute(selectedRouteId);

      // Update aircraft availability when first leg route changes
      updateAircraftAvailability();
      updateShipmentSummaryRoutes();
    } catch (error) {
      console.error('Error in first leg route change:', error);
    }
  });

  // Add event listener to second leg route to enable/disable aircraft
  secondLegRouteSelect.addEventListener('change', function() {
    try {
      updateAircraftAvailability();
      // Only recalculate if aircraft is selected and we won't interfere with main logic
      if (availableAircraftSelect && availableAircraftSelect.value) {
        // The setTimeout was masking other issues and creating a race condition.
        // Running this synchronously is safer and more predictable.
        populateRouteInformationSafely();
      }
      updateShipmentSummaryRoutes();
    } catch (error) {
      console.error('Error in second leg route change:', error);
    }
  });

  // Add event listener to return type to recalculate costs
  returnTypeSelect.addEventListener('change', function() {
    try {
      updatePercentFields();
      // Only recalculate if aircraft is selected
      if (availableAircraftSelect && availableAircraftSelect.value) {
        // The setTimeout was masking other issues and creating a race condition.
        // Running this synchronously is safer and more predictable.
        populateRouteInformationSafely();
      }
    } catch (error) {
      console.error('Error in return type change:', error);
    }
  });

  // Initialize aircraft availability on page load
  updateAircraftAvailability();



  // --- COMMENTED OUT: Previous Add Product / Cargo button logic ---
  /*
  function isFilled(val) {
    return val !== undefined && val !== null && val !== '' && val !== false && val !== '0';
  }
  function validateAddCargoButton() {
    // ...previous logic...
  }
  [firstLegRouteSelect, secondLegRouteSelect, availableAircraftSelect, returnTypeSelect,
   outboundPercentInput, outboundExtraInput, returnPercentInput, returnExtraInput].forEach(function(el) {
    if (el) {
      el.addEventListener('change', validateAddCargoButton);
      el.addEventListener('input', validateAddCargoButton);
    }
  });
  validateAddCargoButton();
  */

  // --- COMMENTED OUT: New Add Product / Cargo button logic from scratch ---
  /*
  function allRequiredFieldsValid() {
    // ...new logic...
  }
  function updateAddCargoBtnState() {
    // ...new logic...
  }
  [firstLegRouteSelect, secondLegRouteSelect, availableAircraftSelect, returnTypeSelect,
   outboundPercentInput, outboundExtraInput, returnPercentInput, returnExtraInput].forEach(function(el) {
    if (el) {
      el.addEventListener('change', updateAddCargoBtnState);
      el.addEventListener('input', updateAddCargoBtnState);
    }
  });
  updateAddCargoBtnState();
  */

  // Test function to verify all elements exist
  function testElementsExist() {
    console.log('=== TESTING ELEMENT EXISTENCE ===');
    const elementsToTest = [
      'first_leg_distance', 'first_leg_flight_time', 'first_leg_route_cost', 'first_leg_payload',
      'second_leg_distance', 'second_leg_flight_time', 'second_leg_route_cost', 'second_leg_payload',
      'total_flight_cost', 'outbound_kg_cost', 'return_kg_cost'
    ];
    
    elementsToTest.forEach(elementId => {
      const element = document.getElementById(elementId);
      console.log(`${elementId}: ${element ? '✓ EXISTS' : '✗ MISSING'}`);
    });
    console.log('=== ELEMENT TEST COMPLETE ===');
  }
  
  // Run the test
  testElementsExist();
  // Helper to show/hide route not found message
  
  // --- Cargo Management Logic ---
  let cargoLogicInitialized = false;

  // This function sets up the interactive parts of the cargo section
  // once it's confirmed to be needed and available.
  function initializeCargoSection() {
    console.log("Attempting to initialize cargo section...");
    const addOutboundBtn = document.getElementById('add-cargo-to-departure-btn');
    const addReturnBtn = document.getElementById('add-cargo-to-return-btn');
    const exchangeRateInput = document.getElementById('exchange_rate');
    const cargoHeader = document.getElementById('cargo-details-header');
    const outboundList = document.getElementById('outbound-product-list');
    const returnList = document.getElementById('return-product-list');

    if (!outboundList || !returnList) {
      console.error('CRITICAL: Product list elements not found. Cargo management cannot be initialized.');
      return;
    }

    const outboundInputs = outboundList.querySelectorAll('input[name^="amount_"]');
    const returnInputs = returnList.querySelectorAll('input[name^="amount_"]');

    function activateCargoSection(activeType) {
      if (cargoHeader) {
        cargoHeader.classList.remove('highlight-outbound', 'highlight-return');
      }
      outboundList.classList.remove('active');
      returnList.classList.remove('active');
      outboundInputs.forEach(input => input.disabled = true);
      returnInputs.forEach(input => input.disabled = true);
      if (activeType === 'outbound' && cargoHeader) {
        cargoHeader.classList.add('highlight-outbound');
        cargoHeader.textContent = 'Editing Departure Cargo (FCA Costs)';
        outboundList.classList.add('active');
        outboundInputs.forEach(input => input.disabled = false);
        updateOutboundCosts();
      } else if (activeType === 'return' && cargoHeader) {
        cargoHeader.classList.add('highlight-return');
        cargoHeader.textContent = 'Editing Return Cargo (Landed Costs)';
        returnList.classList.add('active');
        returnInputs.forEach(input => input.disabled = false);
        updateReturnCosts();
      }
    }

    function calculateCosts(productList, traderId, isOutbound) {
      const exchangeRate = parseFloat(exchangeRateInput?.value) || 0;
      let taxPct = 0, profitPct = 0;
      if (traderId && traderData[traderId]) {
        taxPct = parseFloat(isOutbound ? traderData[traderId].export_sales_tax : traderData[traderId].import_sales_tax) || 0;
        profitPct = parseFloat(isOutbound ? traderData[traderId].export_profit_pct : traderData[traderId].import_profit_pct) || 0;
      }
      productList.querySelectorAll('input[name^="amount_"]').forEach(input => {
        const row = input.closest('div[data-product-type]');
        if (!row) return;
        const packWeight = parseFloat(row.getAttribute('data-pack-weight')) || 0;
        const packCost = parseFloat(row.getAttribute('data-pack-cost')) || 0;
        const amount = parseFloat(input.value.replace(/,/g, '')) || 0;
        const totalWeight = amount * packWeight;
        const totalCost = amount * packCost;
        const taxes = totalCost * (taxPct / 100);
        const profit = totalCost * (profitPct / 100);
        const finalCost = totalCost + taxes + profit;
        const finalCostUSD = (exchangeRate > 0) ? finalCost / exchangeRate : 0;
        row.querySelector('[id^="total_weight_"]').textContent = totalWeight ? totalWeight.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' kg' : '-';
        row.querySelector('[id^="total_cost_"]').textContent = totalCost ? '$' + totalCost.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-';
        row.querySelector('[id^="taxes_"]').textContent = taxes ? '$' + taxes.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-';
        row.querySelector('[id^="profit_"]').textContent = profit ? '$' + profit.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-';
        row.querySelector('[id^="fca_cost_"]').textContent = finalCost ? '$' + finalCost.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-';
        row.querySelector('[id^="fca_cost_usd_"]').textContent = finalCostUSD ? '$' + finalCostUSD.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-';
      });
    }

    const updateOutboundCosts = () => calculateCosts(outboundList, shipperBranchSelect.value, true);
    const updateReturnCosts = () => calculateCosts(returnList, consigneeBranchSelect.value, false);

    if (addOutboundBtn && addReturnBtn) {
        addOutboundBtn.addEventListener('click', () => activateCargoSection('outbound'));
        addReturnBtn.addEventListener('click', () => activateCargoSection('return'));
    }
    outboundInputs.forEach(input => input.addEventListener('input', updateOutboundCosts));
    returnInputs.forEach(input => input.addEventListener('input', updateReturnCosts));
    shipperBranchSelect.addEventListener('change', updateOutboundCosts);
    consigneeBranchSelect.addEventListener('change', updateReturnCosts);
    if (exchangeRateInput) {
      exchangeRateInput.addEventListener('input', () => {
        updateOutboundCosts();
        updateReturnCosts();
      });
    }

    activateCargoSection('none');
    cargoLogicInitialized = true;
    console.log('Cargo management logic initialized successfully.');
  }

  // This function ONLY manages the enabled/disabled state of the buttons.
  function updateCargoButtonsState() {
    const addOutboundBtn = document.getElementById('add-cargo-to-departure-btn');
    const addReturnBtn = document.getElementById('add-cargo-to-return-btn');
    if (!addOutboundBtn || !addReturnBtn) return;

    let isValid = true;
    const reasons = [];
    const check = (name, value) => {
      if (!value) {
        isValid = false;
        reasons.push(name);
      }
    };

    // Defensively check for element existence before accessing .value
    check('Shipper', shipperBranchSelect && shipperBranchSelect.value);
    check('Consignee', consigneeBranchSelect && consigneeBranchSelect.value);
    check('Departure Route', firstLegRouteSelect && firstLegRouteSelect.value);
    check('Return Route', secondLegRouteSelect && secondLegRouteSelect.value);
    check('Aircraft', availableAircraftSelect && availableAircraftSelect.value);
    check('Return Type', returnTypeSelect && returnTypeSelect.value);

    const returnType = returnTypeSelect ? returnTypeSelect.value : '';
    if (returnType === 'compensated' || returnType === 'full') {
      check('Outbound Target Load > 0%', outboundExtraInput && outboundExtraInput.value && parseFloat(outboundExtraInput.value) > 0);
    }
    if (returnType === 'compensated') {
      check('Return Target Load > 0%', returnExtraInput && returnExtraInput.value && parseFloat(returnExtraInput.value) > 0);
    }

    // If the form becomes valid and we haven't set up the cargo logic yet, do it now.
    if (isValid && !cargoLogicInitialized) {
      initializeCargoSection();
    }

    addOutboundBtn.disabled = !isValid;
    addReturnBtn.disabled = !isValid;

    if (!isValid) {
      addOutboundBtn.title = 'Please complete all required fields: ' + reasons.join(', ');
      addReturnBtn.title = addOutboundBtn.title;
    } else {
      addOutboundBtn.title = 'Add cargo to departure leg';
      addReturnBtn.title = 'Add cargo to return leg';
    }
  }

  // Attach listeners to all fields that affect the button's state
  const fieldsToWatch = [
    shipperBranchSelect, consigneeBranchSelect, firstLegRouteSelect,
    secondLegRouteSelect, availableAircraftSelect, returnTypeSelect,
    outboundExtraInput, returnExtraInput
  ];
  fieldsToWatch.forEach(el => {
    if (el) {
      el.addEventListener('change', updateCargoButtonsState);
      el.addEventListener('input', updateCargoButtonsState);
    }
  });
  updateCargoButtonsState(); // Set initial button state

  function showRouteNotFound(show) {
    let msg = document.getElementById('route-not-found-msg');
    const shipmentSection = document.querySelector('.shipment-section');
    if (!msg) {
      msg = document.createElement('div');
      msg.id = 'route-not-found-msg';
      msg.className = 'coming-soon-notice';
      msg.innerHTML = '<strong>No route found between selected shipper and consignee cities.</strong><br>' +
        '<button id="add-route-btn" style="margin:10px;">Add Route</button>' +
        '<button id="cancel-route-btn" style="margin:10px;">Cancel & Clear</button>';
      // Insert below the first shipment-section (Shipment Information)
      if (shipmentSection) {
        shipmentSection.parentNode.insertBefore(msg, shipmentSection.nextSibling);
      }
    }
    msg.style.display = show ? 'block' : 'none';
    // Always re-attach event listeners (in case DOM was recreated)
    const addRouteBtn = document.getElementById('add-route-btn');
    const cancelRouteBtn = document.getElementById('cancel-route-btn');
    if (addRouteBtn) {
      addRouteBtn.onclick = function() {
        window.location.href = '/operations/add-route';
      };
    }
    if (cancelRouteBtn) {
      cancelRouteBtn.onclick = function() {
        document.getElementById('shipment-form').reset();
        firstLegRouteSelect.innerHTML = '<option value="">Departure Route...</option>';
        secondLegRouteSelect.innerHTML = '<option value="">Return Route...</option>';
        availableAircraftSelect.innerHTML = '<option value="">Select Aircraft...</option>';
        showRouteNotFound(false);
        routeInfoSection.style.display = 'none';
      };
    }
  }

    function filterRoutes(allRoutes, shipperCity, consigneeCity) {
    const firstLegRoutes = [];
    const returnLegRoutes = [];

    Object.entries(allRoutes).forEach(([routeId, route]) => {
      // Add checks to prevent errors if IATA data is missing
      if (!route.fromAirport || !route.toAirport) {
        return; // Skip this route if data is incomplete
      }
      // Trim all IATA codes before comparison to avoid whitespace issues.
      const fromIata = route.fromAirport.trim().toUpperCase();
      const toIata = route.toAirport.trim().toUpperCase();
      const shipperIataUpper = shipperCity.trim().toUpperCase();
      const consigneeIataUpper = consigneeCity.trim().toUpperCase();

      // Find first leg routes (from shipper to consignee)
      if (fromIata === shipperIataUpper && toIata === consigneeIataUpper) {
        firstLegRoutes.push({
          value: routeId,
          text: route.summary,
          aircraft: route.aircraft || []
        });
      }

      // Find return leg routes (from consignee to anywhere)
      if (fromIata === consigneeIataUpper) {
        returnLegRoutes.push({
          value: routeId,
          text: route.summary
        });
      }
    });
    return { firstLegRoutes, returnLegRoutes };
  }


  // Always update city fields on selection
  // REMOVED: old event listeners for shipperSelect and consigneeSelect

  // Logic to load routes based on shipper/consignee selection
  function loadRoutesLogic() {
    console.log('loadRoutesLogic called');
    firstLegRouteSelect.innerHTML = '<option value="">Departure Route...</option>';
    secondLegRouteSelect.innerHTML = '<option value="">Return Route...</option>';
    showRouteNotFound(false);

    const shipperId = shipperBranchSelect.value;
    const consigneeId = consigneeBranchSelect.value;
    console.log('Shipper ID:', shipperId, 'Consignee ID:', consigneeId);

    if (!shipperId || !consigneeId) {
      console.log('Missing shipper or consignee');
      routeInfoSection.style.display = 'none';
      return;
    }

    // Defensive check: ensure trader data exists before accessing properties
    const shipperData = traderData[shipperId];
    const consigneeData = traderData[consigneeId];

    if (!shipperData || !consigneeData) {
      console.log('Trader data not found for selected shipper or consignee');
      routeInfoSection.style.display = 'none';
      return;
    }

  // Use airport IATA codes for route matching
  const shipperIata = shipperData.airport_iata;
  const consigneeIata = consigneeData.airport_iata;
  console.log('Shipper IATA:', shipperIata, 'Consignee IATA:', consigneeIata);

  const { firstLegRoutes, returnLegRoutes } = filterRoutes(routeData, shipperIata, consigneeIata);
  const found = firstLegRoutes.length > 0;

    // Populate first leg route select
    firstLegRoutes.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.text;
      firstLegRouteSelect.appendChild(option);
    });
    // Populate return leg route select
    returnLegRoutes.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.text;
      secondLegRouteSelect.appendChild(option);
    });

    // Update aircraft availability after populating return routes
    updateAircraftAvailability();

    // Populate aircraft based on the initially selected route (if any)
    populateAircraftForRoute(firstLegRouteSelect.value);
    if (!found) {
      routeInfoSection.style.display = 'none';
      showRouteNotFound(true);
    } else {
      routeInfoSection.style.display = 'block';
      showRouteNotFound(false);
    }
  }

  // Form submission handling
    if (form) {
    form.addEventListener('submit', function(e) {
      // Defensively check for elements before accessing .value
      if (!shipperBranchSelect || !shipperBranchSelect.value) {
        alert('Please select a shipper.');
        e.preventDefault();
        return false;
      }
      if (!consigneeBranchSelect || !consigneeBranchSelect.value) {
        alert('Please select a consignee.');
        e.preventDefault();
        return false;
      }
      if (shipperBranchSelect.value === consigneeBranchSelect.value) {
        alert('Shipper and consignee cannot be the same.');
        e.preventDefault();
        return false;
      }
      if (!firstLegRouteSelect || !firstLegRouteSelect.value) {
        alert('Please select a route for the first leg.');
        e.preventDefault();
        return false;
      }
    });
  }
});
