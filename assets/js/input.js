/* ================================
   Utility Functions
=================================== */
function toTitleCase(str) {
  return str.replace(/\w\S*/g, function(txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

function validateEmail(email) {
  const re = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
  return re.test(String(email).toLowerCase());
}

function validatePhoneNumber(phone) {
  const re = /^[6-9]\d{9}$/;
  return re.test(phone);
}

function restrictToNumbers(input, allowDecimal = false) {
  let value = input.value;
  if (allowDecimal) {
    value = value.replace(/[^0-9.]/g, '');
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }
  } else {
    value = value.replace(/[^0-9]/g, '');
  }
  input.value = value;
}

function formatNumber(input, allowDecimal = false) {
  let value = input.value;
  if (allowDecimal) {
    value = parseFloat(value);
    if (!isNaN(value)) {
      input.value = value.toFixed(2);
    }
  } else {
    value = parseInt(value, 10);
    if (!isNaN(value)) {
      input.value = value;
    }
  }
}

function restrictToTitleCase(input) {
  input.value = toTitleCase(input.value);
}

function showFeedback(input, isValid, message) {
  console.log(`Feedback for ${input.id}: ${message}`);
  let feedbackEl = input.nextElementSibling;
  if (!feedbackEl || !feedbackEl.classList.contains('feedback')) {
    feedbackEl = document.createElement('div');
    feedbackEl.classList.add('feedback');
    input.parentNode.insertBefore(feedbackEl, input.nextSibling);
  }
  feedbackEl.textContent = message;
  feedbackEl.className = 'feedback ' + (isValid ? 'valid' : 'invalid');
  input.classList.toggle('invalid-input', !isValid);
}

/* ================================
   Data Loading & Dropdown Population
=================================== */
async function loadJSONData(filename) {
  try {
    const response = await fetch(`assets/data/${filename}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Error loading ${filename}:`, error);
    return null;
  }
}

function populateDropdown(selectElement, data, valueKey, textKey, idKey = null, councilIdKey = null) {
  selectElement.innerHTML = '<option value="">Select an option</option>';
  data.forEach(item => {
    const option = document.createElement('option');
    if (selectElement.id === 'zone') {
      option.value = item[textKey];
      option.setAttribute('data-zone-id', item.id);
      option.setAttribute('data-landuser-id', item.landuserId);
    } else if (selectElement.id === 'building_type') {
      option.value = item[valueKey];
      option.setAttribute('data-name', item.name);
      option.setAttribute('data-proposal-id', item.proposalId);
    } else if (selectElement.id === 'building_subtype') {
      option.value = item[valueKey];
      option.setAttribute('data-name', item.name);
      option.setAttribute('data-bldgtypeID', item.bldgtypeID);
    } else {
      option.value = item[valueKey];
    }
    option.textContent = item[textKey];
    if (idKey && councilIdKey) {
      option.setAttribute('data-taluka-id', item[idKey]);
      option.setAttribute('data-council-id', item[councilIdKey]);
    }
    selectElement.appendChild(option);
  });
}

/* ================================
   Enhanced Toggle Function (with ARIA)
=================================== */
function toggleElement(elementId, show) {
  const element = document.getElementById(elementId);
  if (element) {
    element.style.display = show ? 'block' : 'none';
    element.setAttribute('aria-hidden', !show);
  }
}

/* ================================
   Main Initialization Function
=================================== */
async function initializeForm() {
  try {
    console.log('Initializing form...');
    const [
      ulbData,
      buildingTypeData,
      buildingSubtypeData,
      zoneData,
      usesData,
      citySpecificAreaData,
    ] = await Promise.all([
      loadJSONData('ulb_rp_special_authority.json'),
      loadJSONData('building_type.json'),
      loadJSONData('building_subtype.json'),
      loadJSONData('zone.json'),
      loadJSONData('uses.json'),
      loadJSONData('city_specific_area.json'),
    ]);
    
    if (!ulbData || !buildingTypeData || !buildingSubtypeData || !zoneData || !usesData || !citySpecificAreaData) {
      throw new Error('Failed to load one or more required data files');
    }
    
    console.log('JSON data loaded successfully.');
    const sortedUlbData = ulbData.ulb_rp_special_authority.sort((a, b) => a.talukaName.localeCompare(b.talukaName));
    populateDropdown(document.getElementById('ulb_rp_special_authority'), sortedUlbData, 'talukaName', 'talukaName', 'id', 'councilId');
    populateDropdown(document.getElementById('zone'), zoneData.zone, 'id', 'name');
    populateDropdown(document.getElementById('building_type'), buildingTypeData.building_type, 'id', 'name');
    
    const buildingSubtypeSelect = document.getElementById('building_subtype');
    buildingSubtypeSelect.innerHTML = '<option value="">Select Building Type first</option>';
    buildingSubtypeSelect.disabled = true;
    
    // Hide conditional elements initially
    toggleElement('incentive_fsi_rating', false);
    toggleElement('electrical_line_voltage', false);
    toggleElement('reservation_area_sqm', false);
    toggleElement('dp_rp_road_area_sqm', false);
    ['front', 'left', 'right', 'rear'].forEach(side => {
      toggleElement(`road_container_${side}`, false);
    });
    
    // Input Validations (using your original settings)
    const inputValidations = [
      { id: 'applicant_type', validate: (value) => value !== '', errorMsg: 'Please select an option' },
      { id: 'applicant_name', validate: (value) => value.trim().length > 0 && value.trim().length <= 100, format: restrictToTitleCase, errorMsg: 'Please enter a valid name (max 100 characters)' },
      { id: 'contact_no', validate: validatePhoneNumber, format: (input) => restrictToNumbers(input), errorMsg: 'Please enter a valid 10-digit Indian mobile number' },
      { id: 'email', validate: (value) => validateEmail(value) && value.length <= 100, format: (input) => { input.value = input.value.toLowerCase(); }, errorMsg: 'Please enter a valid email address (max 100 characters)' },
      { id: 'project_name', validate: (value) => value.trim().length > 0 && value.trim().length <= 100, format: restrictToTitleCase, errorMsg: 'Please enter a valid project name (max 100 characters)' },
      { id: 'site_address', validate: (value) => value.trim().length > 0 && value.trim().length <= 200, format: restrictToTitleCase, errorMsg: 'Please enter a valid site address (max 200 characters)' },
      { id: 'village_name', validate: (value) => value.trim().length > 0 && value.trim().length <= 50, format: restrictToTitleCase, errorMsg: 'Please enter a valid village/mouje name (max 50 characters)' },
      { id: 'reservation_area_sqm', validate: (value) => { if (!value || value.trim() === '') return true; const numValue = parseFloat(value); return !isNaN(numValue) && numValue > 0; }, format: (input) => formatNumber(input, true), errorMsg: 'Please enter a valid positive number for Reservation Area Affected' },
      { id: 'dp_rp_road_area_sqm', validate: (value) => { if (!value || value.trim() === '') return true; const numValue = parseFloat(value); return !isNaN(numValue) && numValue > 0; }, format: (input) => formatNumber(input, true), errorMsg: 'Please enter a valid positive number for DP/RP Road Area Affected' },
      { id: 'area_plot_site_sqm', validate: (value) => { const numValue = parseFloat(value); return !isNaN(numValue) && numValue > 0 && numValue <= 999999.99; }, format: (input) => formatNumber(input, true), errorMsg: 'Please enter a valid number between 0.01 and 999,999.99' },
      { id: 'area_plot_ownership_sqm', validate: (value) => { const numValue = parseFloat(value); return !isNaN(numValue) && numValue > 0 && numValue <= 999999.99; }, format: (input) => formatNumber(input, true), errorMsg: 'Please enter a valid number between 0.01 and 999,999.99' },
      { id: 'area_plot_measurement_sqm', validate: (value) => { const numValue = parseFloat(value); return !isNaN(numValue) && numValue > 0 && numValue <= 999999.99; }, format: (input) => formatNumber(input, true), errorMsg: 'Please enter a valid number between 0.01 and 999,999.99' },
      { id: 'pro_rata_fsi', validate: (value) => { if (!value || value.trim() === '') return true; const numValue = parseFloat(value); return !isNaN(numValue) && numValue >= 0 && numValue <= 999.99; }, format: (input) => formatNumber(input, true), errorMsg: 'Please enter a valid number between 0 and 999.99' },
      { id: 'plot_width', validate: (value) => { const numValue = parseFloat(value); return !isNaN(numValue) && numValue > 0 && numValue <= 999.99; }, format: (input) => formatNumber(input, true), errorMsg: 'Please enter a valid number between 0.01 and 999.99' }
    ];
    
    // Handle radio button changes (unchanged from your original code)
    function handleRadioChange(name, elementToToggle) {
      const radioButtons = document.getElementsByName(name);
      radioButtons.forEach(radio => {
        radio.addEventListener('change', function () {
          const show = this.value === 'Yes';
          toggleElement(elementToToggle, show);
          const element = document.getElementById(elementToToggle);
          if (element) {
            const inputField = element.querySelector('input, select, textarea');
            if (inputField) {
              inputField.disabled = !show;
              if (show) {
                const validation = inputValidations.find(v => v.id === inputField.id);
                if (validation && !inputField.dataset.listenerAttached) {
                  inputField.addEventListener('blur', function () {
                    if (typeof validation.format === 'function') {
                      validation.format(this);
                    }
                    const isValid = validation.validate(this.value);
                    showFeedback(this, isValid, isValid ? '' : validation.errorMsg);
                  });
                  inputField.dataset.listenerAttached = 'true';
                }
              } else {
                inputField.value = '';
                showFeedback(inputField, true, '');
              }
            }
          }
        });
      });
    }

    handleRadioChange('incentive_fsi', 'incentive_fsi_rating');
    handleRadioChange('electrical_line', 'electrical_line_voltage');
    handleRadioChange('reservation_area_affected', 'reservation_area_sqm');
    handleRadioChange('dp_rp_road_affected', 'dp_rp_road_area_sqm');

    function setupInputValidation(element, validation) {
      if (element) {
        const validateAndShowFeedback = function () {
          if (typeof validation.format === 'function') {
            validation.format(this);
          }
          const isValid = validation.validate(this.value);
          showFeedback(this, isValid, isValid ? '' : validation.errorMsg);
        };
        if (element.tagName.toLowerCase() === 'select') {
          element.addEventListener('change', validateAndShowFeedback);
        } else {
          element.addEventListener('blur', validateAndShowFeedback);
        }
      }
    }

    inputValidations.forEach(validation => {
      const element = document.getElementById(validation.id);
      setupInputValidation(element, validation);
    });

    // File Input Validation (unchanged)
    ['dp_rp_part_plan', 'google_image'].forEach(id => {
      const fileInput = document.getElementById(id);
      if (fileInput) {
        fileInput.addEventListener('change', function () {
          const file = this.files[0];
          if (file) {
            const fileSize = file.size / 1024 / 1024;
            const allowedFormats = ['image/jpeg', 'image/png', 'image/gif'];
            let isValid = true;
            let errorMsg = '';
            if (fileSize > 5) {
              isValid = false;
              errorMsg = 'File size should not exceed 5MB';
            } else if (!allowedFormats.includes(file.type)) {
              isValid = false;
              errorMsg = 'Please upload an image file (JPEG, PNG, or GIF)';
            }
            showFeedback(this, isValid, errorMsg);
            if (!isValid) this.value = '';
          }
        });
      }
    });

    // Road Width Input Validation (unchanged)
    const roadWidthInputs = document.querySelectorAll('.road-width-input');
    roadWidthInputs.forEach(input => {
      input.addEventListener('input', function () {
        restrictToNumbers(this, true);
      });
      input.addEventListener('blur', function () {
        const value = parseFloat(this.value);
        if (!isNaN(value) && value > 0) {
          this.value = value.toFixed(2);
          this.classList.remove('invalid-input');
          showFeedback(this, true, '');
        } else {
          this.classList.add('invalid-input');
          showFeedback(this, false, 'Please enter a valid positive number');
        }
      });
    });

    // Zone and Uses Dropdown Handling (unchanged)
    const zoneSelect = document.getElementById('zone');
    if (zoneSelect) {
      zoneSelect.addEventListener('change', function () {
        const usesSelect = document.getElementById('uses');
        const selectedZoneId = this.options[this.selectedIndex].getAttribute('data-zone-id');
        if (!selectedZoneId) {
          usesSelect.innerHTML = '<option value="">Select Zone first</option>';
          usesSelect.disabled = true;
          return;
        }
        const filteredUses = usesData.uses.filter(use => use.zoneId === parseInt(selectedZoneId, 10));
        populateDropdown(usesSelect, filteredUses, 'id', 'name');
        usesSelect.disabled = false;
      });
    }

    // ULB and City Specific Area Handling (unchanged)
    const citySpecificAreaSelect = document.getElementById('city_specific_area');
    citySpecificAreaSelect.disabled = true;
    citySpecificAreaSelect.innerHTML = '<option value="">Select ULB/RP/Special Authority first</option>';

    const ulbDropdown = document.getElementById('ulb_rp_special_authority');
    if (ulbDropdown) {
      ulbDropdown.addEventListener('change', function () {
        const selectedOption = this.options[this.selectedIndex];
        const selectedTalukaName = selectedOption.textContent;
        const selectedUlb = ulbData.ulb_rp_special_authority.find(ulb => ulb.talukaName === selectedTalukaName);
        if (selectedUlb) {
          const councilName = selectedUlb.councilName || '';
          const councilNameInput = document.getElementById('ulb_type');
          if (councilNameInput) {
            councilNameInput.value = councilName;
          }
          const filteredAreas = citySpecificAreaData.city_specific_area.filter(area => area.councilId === selectedUlb.councilId);
          if (filteredAreas.length > 0) {
            citySpecificAreaSelect.innerHTML = '<option value="">Select City Specific Area</option>';
            filteredAreas.forEach(area => {
              const option = document.createElement('option');
              option.value = area.id;
              option.textContent = area.name;
              option.setAttribute('data-area-code', area.areaCode);
              option.setAttribute('data-council-id', area.councilId);
              citySpecificAreaSelect.appendChild(option);
            });
            citySpecificAreaSelect.disabled = false;
          } else {
            citySpecificAreaSelect.innerHTML = '<option value="">No specific areas available for this ULB</option>';
            citySpecificAreaSelect.disabled = true;
          }
        } else {
          citySpecificAreaSelect.innerHTML = '<option value="">Select ULB/RP/Special Authority first</option>';
          citySpecificAreaSelect.disabled = true;
        }
      });
    }

    // Building Type & Subtype Handling (unchanged)
    const buildingTypeSelect = document.getElementById('building_type');
    if (buildingTypeSelect) {
      buildingTypeSelect.addEventListener('change', function () {
        const buildingSubtypeSelect = document.getElementById('building_subtype');
        const selectedBuildingType = this.value;
        if (!selectedBuildingType) {
          buildingSubtypeSelect.innerHTML = '<option value="">Select Building Type first</option>';
          buildingSubtypeSelect.disabled = true;
          return;
        }
        const filteredBuildingSubtypes = buildingSubtypeData.building_subtype.filter(subtype => subtype.bldgtypeID === parseInt(selectedBuildingType, 10));
        populateDropdown(buildingSubtypeSelect, filteredBuildingSubtypes, 'id', 'name');
        buildingSubtypeSelect.disabled = false;
      });
    }

    // Plot Boundaries Setup (unchanged)
    const sides = ['front', 'left', 'right', 'rear'];
    function setupBoundaryListeners() {
      sides.forEach(side => {
        const select = document.getElementById(`${side}_boundary_type`);
        const roadContainer = document.getElementById(`road_container_${side}`);
        const roadWidthInput = document.getElementById(`road_details_${side}_meters`);
        if (select) {
          select.addEventListener('change', function () {
            const isRoad = this.value === 'Road';
            toggleElement(`road_container_${side}`, isRoad);
            if (side === 'front') {
              sides.slice(1).forEach(otherSide => {
                const otherSelect = document.getElementById(`${otherSide}_boundary_type`);
                if (otherSelect) {
                  otherSelect.disabled = !isRoad;
                  if (!isRoad) {
                    otherSelect.value = '';
                    toggleElement(`road_container_${otherSide}`, false);
                  }
                }
              });
            }
          });
        }
        if (roadWidthInput) {
          roadWidthInput.addEventListener('input', function () {
            restrictToNumbers(this, true);
          });
          roadWidthInput.addEventListener('blur', function () {
            const value = parseFloat(this.value);
            if (!isNaN(value) && value > 0) {
              this.value = value.toFixed(2);
              this.classList.remove('invalid-input');
              showFeedback(this, true, '');
            } else {
              this.classList.add('invalid-input');
              showFeedback(this, false, 'Please enter a valid positive number');
            }
          });
        }
      });
    }
    function initializeBoundarySelects() {
      sides.slice(1).forEach(side => {
        const select = document.getElementById(`${side}_boundary_type`);
        if (select) {
          select.disabled = true;
          select.value = '';
        }
      });
    }
    setupBoundaryListeners();
    initializeBoundarySelects();

    /* =====================================================
       FORM SUBMISSION FLOW:
         Step 1: Insert temporary entry (status = "Pending Payment")
         Step 2: Immediately launch Razorpay Checkout modal
         Step 3: Upon successful payment, update the row with payment details
    ===================================================== */
    
    // Set your Google Script URL – REPLACE with your actual deployed URL.
    const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxO_MNAVccboiQVt3udfdScbuZLQLQCjW_GvTd-0fvJF4ugHcjwYvkcz-90qsdI1vb7/exec";
    
    // Ensure a unique id exists (using the hidden input "unique_id")
    const uniqueIdField = document.getElementById('unique_id');
    if (uniqueIdField && !uniqueIdField.value) {
      uniqueIdField.value = "order_" + Date.now() + Math.random().toString(36).substr(2, 5);
    }
    
    const formElement = document.getElementById('project-input-form');
    if (formElement) {
      formElement.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('Form submission initiated.');
  
        // Validate form inputs
        let isValid = true;
        inputValidations.forEach(({ id, validate, errorMsg }) => {
          const input = document.getElementById(id);
          if (input && typeof validate === 'function') {
            if (!validate(input.value)) {
              showFeedback(input, false, errorMsg);
              isValid = false;
            } else {
              showFeedback(input, true, '');
            }
          }
        });
  
        if (!isValid) {
          alert('Please correct the errors in the form before submitting.');
          return;
        }
  
        // Create a FormData object from the form
        const formData = new FormData(formElement);
        // Set the status to "Pending Payment"
        formData.set('payment_status', "Pending Payment");
  
        // Send form data to create the temporary entry in the Google Sheet
        try {
          const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'cors',
            credentials: 'omit',
            body: formData,
          });
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          const result = await response.json();
          if (result.status === 'success') {
            alert('Your information has been saved. Please complete the payment.');
            // Launch Razorpay checkout modal
            launchRazorpay();
          } else {
            throw new Error(result.message || 'Unknown error during data capture.');
          }
        } catch (error) {
          console.error('Error during form submission:', error);
          alert(`An error occurred: ${error.message}. Please try again later.`);
        }
      });
    } else {
      console.error('Form element not found.');
    }
    
    function launchRazorpay() {
      // Set your payment amount in paise (e.g., Rs. 500.00 = 50000 paise)
      const amount = 100;
      const options = {
        key: "rzp_live_ewrzTufDiddrHg", // REPLACE with your Razorpay key
        amount: amount,
        currency: "INR",
        name: "Your Company / Project Name",
        description: "Payment for project submission",
        prefill: {
          name: document.getElementById('applicant_name').value,
          email: document.getElementById('email').value,
          contact: "+91" + document.getElementById('contact_no').value
        },
        handler: function(response) {
          // On successful payment, update the row with payment details
          updatePayment(response);
        },
        modal: {
          ondismiss: function() {
            alert("Payment was cancelled. Your entry remains marked as Pending Payment.");
          }
        }
      };
      const rzp = new Razorpay(options);
      rzp.open();
    }
    
    async function updatePayment(response) {
      // Prepare a FormData object with the unique id and payment details
      const uniqueId = document.getElementById('unique_id').value;
      const updateData = new FormData();
      updateData.append('action', 'updatePayment');
      updateData.append('unique_id', uniqueId);
      updateData.append('payment_status', 'Payment Complete');
      updateData.append('payment_date', new Date().toISOString());
      updateData.append('razorpay_payment_id', response.razorpay_payment_id);
      updateData.append('razorpay_order_id', response.razorpay_order_id);
      updateData.append('razorpay_signature', response.razorpay_signature);
  
      try {
        const res = await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          mode: 'cors',
          credentials: 'omit',
          body: updateData,
        });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const result = await res.json();
        if (result.status === 'success') {
        alert("Payment details have been updated successfully. Thank you!");
        document.getElementById('project-input-form').reset(); // This clears the form
        } else {
        throw new Error(result.message || 'Unknown error during payment update.');
        }

      } catch (error) {
        console.error('Error updating payment details:', error);
        alert(`An error occurred while updating payment details: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('Initialization error:', error);
  }
}

document.addEventListener('DOMContentLoaded', initializeForm);
