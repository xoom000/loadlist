/**
 * app.js
 * Main application logic for the Route 33 Guide
 */

document.addEventListener("DOMContentLoaded", function() {
  // Initialize Lucide icons
  lucide.createIcons();
  
  // DOM elements
  const elements = {
    mainContent: document.getElementById('mainContent'),
    searchInput: document.getElementById('searchInput'),
    filterBtn: document.getElementById('filterBtn'),
    filterText: document.getElementById('filterText'),
    summaryViewBtn: document.getElementById('summaryViewBtn'),
    detailedViewBtn: document.getElementById('detailedViewBtn'),
    progressBar: document.getElementById('progressBar'),
    progressText: document.getElementById('progressText'),
    checkAllBtn: document.getElementById('checkAllBtn'),
    uncheckAllBtn: document.getElementById('uncheckAllBtn'),
    statsDisplay: document.getElementById('stats-display'),
    totalStops: document.getElementById('totalStops'),
    itemStops: document.getElementById('itemStops'),
    areaBreakdown: document.getElementById('areaBreakdown'),
    accessNotes: document.getElementById('accessNotes'),
    driverTips: document.getElementById('driverTips'),
    editReferenceBtn: document.getElementById('editReferenceBtn'),
    editReferenceText: document.getElementById('editReferenceText'),
    editTipsBtn: document.getElementById('editTipsBtn'),
    editTipsText: document.getElementById('editTipsText'),
    menuBtn: document.getElementById('menuBtn'),
    menuDropdown: document.getElementById('menuDropdown'),
    exportPdfBtn: document.getElementById('exportPdfBtn'),
    saveLocalBtn: document.getElementById('saveLocalBtn'),
    importCsvBtn: document.getElementById('importCsvBtn'),
    exportCsvBtn: document.getElementById('exportCsvBtn'),
    resetBtn: document.getElementById('resetBtn'),
    csvFileInput: document.getElementById('csvFileInput'),
    successToast: document.getElementById('successToast'),
    toastMessage: document.getElementById('toastMessage'),
    lastUpdated: document.getElementById('lastUpdated')
  };
  
  // App state
  const state = {
    view: 'summary',
    filterCompleted: false,
    searchQuery: '',
    editingReference: false,
    editingTips: false,
    routeData: [],
    customersByArea: {},
    checkedItems: {},
    areaStats: {},
    completionStats: {
      totalStops: 0,
      completedStops: 0,
      totalItems: 0,
      completedItems: 0,
      stopsProgress: 0,
      itemsProgress: 0
    }
  };
  
  /**
   * Initialize the application
   */
  async function initApp() {
    try {
      // Load data
      const data = await DataHandler.initData();
      state.routeData = data.routeData;
      state.customersByArea = data.customersByArea;
      state.areaStats = data.areaStats;
      
      // Add event listeners
      setupEventListeners();
      
      // Check if we have data
      if (state.routeData.length === 0) {
        // Show upload prompt if no data
        showUploadPrompt();
      } else {
        // Get completion stats
        state.completionStats = DataHandler.getCompletionStats();
        
        // Update UI
        updateStats();
        renderContent();
        
        // Update the last updated date
        const lastUpdated = new Date().toLocaleDateString("en-US", { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
        elements.lastUpdated.textContent = lastUpdated;
      }
    } catch (error) {
      console.error("Error initializing app:", error);
      showError("Failed to initialize app. Please refresh the page.");
    }
  }
  
  /**
   * Show the initial upload prompt
   */
  function showUploadPrompt() {
    elements.mainContent.innerHTML = `
      <div class="text-center p-8 animate-fadeIn">
        <div class="mb-6 text-blue-500">
          <i data-lucide="upload-cloud" class="h-16 w-16 mx-auto"></i>
        </div>
        <h2 class="text-xl font-bold mb-4">Welcome to Route 33 Guide</h2>
        <p class="text-gray-300 mb-6 max-w-md mx-auto">
          To get started, please upload your route CSV file. Your data will be stored locally and never sent to any server.
        </p>
        <button id="initialUploadBtn" class="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors text-white font-medium flex items-center gap-2 mx-auto">
          <i data-lucide="file-text" class="h-5 w-5"></i>
          Upload Route Data
        </button>
        
        <div class="mt-8 bg-gray-800 p-4 rounded-lg max-w-md mx-auto text-left">
          <h3 class="font-medium mb-2 text-blue-400">Accepted Format</h3>
          <p class="text-sm text-gray-400 mb-2">Your CSV should include these columns:</p>
          <code class="block bg-gray-900 p-3 rounded text-xs text-gray-300 overflow-x-auto">
            CustomerNumber, AccountName, Address, ItemID, Description, Quantity
          </code>
        </div>
      </div>
    `;
    
    // Initialize icons
    lucide.createIcons();
    
    // Add event listener for the upload button
    document.getElementById('initialUploadBtn').addEventListener('click', () => {
      elements.csvFileInput.click();
    });
  }
  
  /**
   * Set up event listeners
   */
  function setupEventListeners() {
    // Search
    elements.searchInput.addEventListener('input', () => {
      state.searchQuery = elements.searchInput.value;
      renderContent();
    });
    
    // Filter completed
    elements.filterBtn.addEventListener('click', () => {
      state.filterCompleted = !state.filterCompleted;
      elements.filterText.textContent = state.filterCompleted ? "Show All" : "Hide Completed";
      renderContent();
    });
    
    // View toggles
    elements.summaryViewBtn.addEventListener('click', () => {
      if (state.view !== 'summary') {
        state.view = 'summary';
        elements.summaryViewBtn.classList.add('border-blue-500', 'text-blue-500');
        elements.summaryViewBtn.classList.remove('border-transparent', 'text-gray-400');
        elements.detailedViewBtn.classList.remove('border-blue-500', 'text-blue-500');
        elements.detailedViewBtn.classList.add('border-transparent', 'text-gray-400');
        renderContent();
      }
    });
    
    elements.detailedViewBtn.addEventListener('click', () => {
      if (state.view !== 'detailed') {
        state.view = 'detailed';
        elements.detailedViewBtn.classList.add('border-blue-500', 'text-blue-500');
        elements.detailedViewBtn.classList.remove('border-transparent', 'text-gray-400');
        elements.summaryViewBtn.classList.remove('border-blue-500', 'text-blue-500');
        elements.summaryViewBtn.classList.add('border-transparent', 'text-gray-400');
        renderContent();
      }
    });
    
    // Toggle reference editing
    elements.editReferenceBtn.addEventListener('click', () => {
      state.editingReference = !state.editingReference;
      
      const editableElements = elements.areaBreakdown.querySelectorAll('[contenteditable]');
      editableElements.forEach(el => {
        el.setAttribute('contenteditable', state.editingReference.toString());
      });
      
      const editableNoteElements = elements.accessNotes.querySelectorAll('[contenteditable]');
      editableNoteElements.forEach(el => {
        el.setAttribute('contenteditable', state.editingReference.toString());
      });
      
      elements.editReferenceText.textContent = state.editingReference ? 'Save' : 'Edit';
      
      if (!state.editingReference) {
        showToast('Reference notes saved');
      }
    });
    
    // Toggle tips editing
    elements.editTipsBtn.addEventListener('click', () => {
      state.editingTips = !state.editingTips;
      
      const editableElements = elements.driverTips.querySelectorAll('[contenteditable]');
      editableElements.forEach(el => {
        el.setAttribute('contenteditable', state.editingTips.toString());
      });
      
      elements.editTipsText.textContent = state.editingTips ? 'Save' : 'Edit';
      
      if (!state.editingTips) {
        showToast('Driver tips saved');
      }
    });
    
    // Check all items
    elements.checkAllBtn.addEventListener('click', () => {
      state.completionStats = DataHandler.checkAllItems();
      updateStats();
      renderContent();
      showToast('All items checked');
    });
    
    // Uncheck all items
    elements.uncheckAllBtn.addEventListener('click', () => {
      state.completionStats = DataHandler.resetCheckedItems();
      updateStats();
      renderContent();
      showToast('All items unchecked');
    });
    
    // Menu button
    elements.menuBtn.addEventListener('click', () => {
      elements.menuDropdown.classList.toggle('hidden');
    });
    
    // Close menu when clicking elsewhere
    document.addEventListener('click', (event) => {
      if (!event.target.closest('#menuBtn') && !event.target.closest('#menuDropdown')) {
        elements.menuDropdown.classList.add('hidden');
      }
    });
    
    // Export PDF button
    elements.exportPdfBtn.addEventListener('click', () => {
      try {
        const result = ExportUtils.exportToPDF(state.routeData, state.checkedItems, state.completionStats);
        showToast(`PDF saved as ${result.filename}`);
      } catch (error) {
        console.error("Error exporting PDF:", error);
        showToast('Failed to export PDF', true);
      }
    });
    
    // Save local button
    elements.saveLocalBtn.addEventListener('click', () => {
      const saved = DataHandler.saveRouteData();
      if (saved) {
        showToast('Progress saved successfully');
      } else {
        showToast('Failed to save progress', true);
      }
    });
    
    // Import CSV button
    elements.importCsvBtn.addEventListener('click', () => {
      elements.csvFileInput.click();
    });
    
    // Handle CSV file selection
    elements.csvFileInput.addEventListener('change', async (event) => {
      if (event.target.files.length > 0) {
        try {
          const file = event.target.files[0];
          elements.menuDropdown.classList.add('hidden');
          
          // Show loading spinner
          elements.mainContent.innerHTML = `
            <div class="text-center p-8">
              <div class="mx-auto mb-4 w-12 h-12 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
              <p class="text-gray-400">Importing CSV data...</p>
            </div>
          `;
          
          // Import the CSV
          const data = await DataHandler.importCSV(file);
          state.routeData = data.routeData;
          state.customersByArea = data.customersByArea;
          state.areaStats = data.areaStats;
          
          // Get completion stats
          state.completionStats = DataHandler.getCompletionStats();
          
          // Update UI
          updateStats();
          renderContent();
          
          // Update the last updated date
          const lastUpdated = new Date().toLocaleDateString("en-US", { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
          elements.lastUpdated.textContent = lastUpdated;
          
          showToast(`Imported ${file.name} successfully`);
        } catch (error) {
          console.error("Error importing CSV:", error);
          showToast('Failed to import CSV file', true);
          renderContent(); // Render the original content
        }
        
        // Reset the file input
        elements.csvFileInput.value = '';
      }
    });
    
    // Export CSV button
    elements.exportCsvBtn.addEventListener('click', () => {
      try {
        const result = ExportUtils.exportToCSV(state.routeData, state.checkedItems);
        elements.menuDropdown.classList.add('hidden');
        showToast(`CSV exported as ${result.filename}`);
      } catch (error) {
        console.error("Error exporting CSV:", error);
        showToast('Failed to export CSV', true);
      }
    });
    
    // Reset button
    elements.resetBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
        // Show options for what to reset
        const resetType = confirm(
          'Would you like to:\n\n' +
          '• Click OK to reset completion status only (keep route data)\n' +
          '• Click Cancel to reset EVERYTHING (route data and completion status)'
        );
        
        if (resetType) {
          // Reset completion status only
          state.completionStats = DataHandler.resetCheckedItems();
          updateStats();
          renderContent();
          elements.menuDropdown.classList.add('hidden');
          showToast('All progress has been reset');
        } else {
          // Reset everything including route data
          localStorage.removeItem('route33Data');
          localStorage.removeItem('route33RawData');
          showToast('All data has been reset');
          
          // Reload the page after a brief delay
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        }
      }
    });
  }
  
  /**
   * Show a toast message
   */
  function showToast(message, isError = false) {
    elements.toastMessage.textContent = message;
    elements.successToast.classList.remove('hidden');
    
    if (isError) {
      elements.successToast.classList.remove('bg-green-800');
      elements.successToast.classList.add('bg-red-800');
    } else {
      elements.successToast.classList.remove('bg-red-800');
      elements.successToast.classList.add('bg-green-800');
    }
    
    setTimeout(() => {
      elements.successToast.classList.add('hidden');
    }, 3000);
  }
  
  /**
   * Show an error message in the main content area
   */
  function showError(message) {
    elements.mainContent.innerHTML = `
      <div class="text-center p-8">
        <div class="mb-4 text-red-500">
          <i data-lucide="alert-triangle" class="h-12 w-12 mx-auto"></i>
        </div>
        <p class="text-red-400">${message}</p>
      </div>
    `;
    lucide.createIcons();
  }
  
  /**
   * Update statistics display
   */
  function updateStats() {
    // Update progress bar
    const progress = state.completionStats.stopsProgress;
    elements.progressBar.style.width = `${progress}%`;
    elements.progressText.textContent = `${progress}% (${state.completionStats.completedStops}/${state.completionStats.totalStops})`;
    
    // Update statistics
    elements.totalStops.textContent = state.completionStats.totalStops;
    elements.itemStops.textContent = state.routeData.filter(c => c.hasItems).length;
    
    // Update area counts in quick reference
    if (state.areaStats['Shasta Ortho']) {
      document.getElementById('shastoOrthoCount').textContent = state.areaStats['Shasta Ortho'];
    }
    if (state.areaStats['Bechelli Lane']) {
      document.getElementById('bechelliCount').textContent = state.areaStats['Bechelli Lane'];
    }
    if (state.areaStats['Downtown']) {
      document.getElementById('downtownCount').textContent = state.areaStats['Downtown'];
    }
    if (state.areaStats['Churn Creek']) {
      document.getElementById('churnCreekCount').textContent = state.areaStats['Churn Creek'];
    }
  }
  
  /**
   * Render main content based on current view
   */
  function renderContent() {
    // Filter data based on search query
    let filteredData = state.routeData;
    if (state.searchQuery) {
      filteredData = DataHandler.searchCustomers(state.searchQuery);
    }
    
    // Show appropriate view
    if (state.view === 'summary') {
      renderSummaryView(filteredData);
    } else {
      renderDetailedView(filteredData);
    }
  }
  
  /**
   * Render summary view
   */
  function renderSummaryView(filteredData) {
    // Group by area
    const customersByArea = {};
    DataHandler.areaOrder.forEach(area => {
      customersByArea[area] = [];
    });
    
    filteredData.forEach(customer => {
      if (customersByArea[customer.area]) {
        // Skip if filtering completed and customer is complete
        if (state.filterCompleted) {
          const isCompleted = customer.items && customer.items.length > 0 
            ? customer.items.every(item => state.checkedItems[`${customer.customerNumber}-${item.itemId}`])
            : state.checkedItems[customer.customerNumber];
          
          if (isCompleted) return;
        }
        
        customersByArea[customer.area].push(customer);
      } else {
        customersByArea["Other"].push(customer);
      }
    });
    
    // Build HTML
    let html = '';
    
    // Add each area
    DataHandler.areaOrder.forEach(area => {
      const customers = customersByArea[area];
      
      if (customers && customers.length > 0) {
        html += `
          <div class="mt-4">
            <div class="bg-gray-800 px-4 py-2 rounded-t-lg area-header">
              <h2 class="font-medium text-lg text-blue-400">${area}</h2>
            </div>
            <div class="bg-gray-800 p-2 rounded-b-lg divide-y divide-gray-700">
        `;
        
        // Add customers in this area
        customers.forEach(customer => {
          const isCompleted = customer.items && customer.items.length > 0 
            ? customer.items.every(item => state.checkedItems[`${customer.customerNumber}-${item.itemId}`])
            : state.checkedItems[customer.customerNumber];
          
          html += `
            <div class="p-3 flex items-start ${isCompleted ? 'opacity-70' : ''}">
              <div class="flex-grow">
                <div class="flex items-start justify-between">
                  <div>
                    <h3 class="font-medium">${customer.accountName}</h3>
                    <p class="text-sm text-gray-400">
                      <a href="https://maps.google.com/?q=${encodeURIComponent(customer.address)}" 
                         target="_blank" 
                         class="hover:text-blue-400 flex items-center gap-1">
                        <i data-lucide="map-pin" class="h-3 w-3"></i> ${customer.address}
                      </a>
                    </p>
                  </div>
          `;
          
          // Add item count badge
          if (customer.items && customer.items.length > 0) {
            const totalItems = customer.items.length;
            const completedItems = customer.items.filter(item => 
              state.checkedItems[`${customer.customerNumber}-${item.itemId}`]
            ).length;
            
            html += `
              <div class="bg-blue-900 text-blue-200 text-xs px-2 py-1 rounded-full">
                ${completedItems}/${totalItems} items
              </div>
            `;
          } else {
            html += `
              <div class="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded-full">
                No items
              </div>
            `;
          }
          
          html += `
                </div>
              </div>
              
              <!-- Completion checkbox -->
              <div class="ml-4 flex items-center">
                <input 
                  type="checkbox" 
                  class="w-5 h-5 rounded bg-gray-700 border-gray-600"
                  ${isCompleted ? 'checked' : ''}
                  data-customer="${customer.customerNumber}"
                  onChange="handleCustomerCheck(event, ${customer.customerNumber})"
                >
              </div>
            </div>
          `;
        });
        
        html += `
            </div>
          </div>
        `;
      }
    });
    
    // If no results found
    if (html === '') {
      html = `
        <div class="text-center p-8">
          <div class="mb-4 text-gray-500">
            <i data-lucide="search-x" class="h-12 w-12 mx-auto"></i>
          </div>
          <p class="text-gray-400">No stops found matching "${state.searchQuery}"</p>
        </div>
      `;
    }
    
    elements.mainContent.innerHTML = html;
    
    // Add event listeners to checkboxes
    document.querySelectorAll('[data-customer]').forEach(checkbox => {
      checkbox.addEventListener('change', (event) => {
        const customerNumber = checkbox.getAttribute('data-customer');
        handleCustomerCheck(event, customerNumber);
      });
    });
    
    // Initialize Lucide icons
    lucide.createIcons();
  }
  
  /**
   * Render detailed view
   */
  function renderDetailedView(filteredData) {
    // Group by area
    const customersByArea = {};
    DataHandler.areaOrder.forEach(area => {
      customersByArea[area] = [];
    });
    
    filteredData.forEach(customer => {
      if (customersByArea[customer.area]) {
        // Skip if filtering completed and customer is complete
        if (state.filterCompleted) {
          const isCompleted = customer.items && customer.items.length > 0 
            ? customer.items.every(item => state.checkedItems[`${customer.customerNumber}-${item.itemId}`])
            : state.checkedItems[customer.customerNumber];
          
          if (isCompleted) return;
        }
        
        customersByArea[customer.area].push(customer);
      } else {
        customersByArea["Other"].push(customer);
      }
    });
    
    // Build HTML
    let html = '';
    
    // Add each area
    DataHandler.areaOrder.forEach(area => {
      const customers = customersByArea[area];
      
      if (customers && customers.length > 0) {
        html += `
          <div class="mt-4">
            <div class="bg-gray-800 px-4 py-2 rounded-t-lg area-header">
              <h2 class="font-medium text-lg text-blue-400">${area}</h2>
            </div>
            <div class="bg-gray-800 rounded-b-lg divide-y divide-gray-700">
        `;
        
        // Add customers in this area
        customers.forEach(customer => {
          const isCompleted = customer.items && customer.items.length > 0 
            ? customer.items.every(item => state.checkedItems[`${customer.customerNumber}-${item.itemId}`])
            : state.checkedItems[customer.customerNumber];
          
          html += `
            <div class="p-4 ${isCompleted ? 'opacity-70' : ''}">
              <div class="flex items-start justify-between mb-3">
                <div>
                  <h3 class="font-medium text-lg flex items-center">
                    ${customer.accountName}
                    ${isCompleted ? '<span class="ml-2 text-green-500 text-sm">(Completed)</span>' : ''}
                  </h3>
                  <div class="flex space-x-2 text-sm text-gray-400 mt-1">
                    <a href="https://maps.google.com/?q=${encodeURIComponent(customer.address)}" 
                       target="_blank" 
                       class="hover:text-blue-400 flex items-center gap-1">
                      <i data-lucide="map-pin" class="h-3 w-3"></i> ${customer.address}
                    </a>
                    <a href="tel:555-123-4567" class="hover:text-blue-400 flex items-center gap-1 no-print">
                      <i data-lucide="phone" class="h-3 w-3"></i> Call
                    </a>
                    <a href="sms:555-123-4567" class="hover:text-blue-400 flex items-center gap-1 no-print">
                      <i data-lucide="message-square" class="h-3 w-3"></i> Text
                    </a>
                  </div>
                </div>
                
                <!-- Customer checkbox -->
                <div class="no-print">
                  <input 
                    type="checkbox" 
                    class="w-5 h-5 rounded bg-gray-700 border-gray-600"
                    ${isCompleted ? 'checked' : ''}
                    data-customer="${customer.customerNumber}"
                    onChange="handleCustomerCheck(event, ${customer.customerNumber})"
                  >
                </div>
              </div>
          `;
          
          // Add items
          if (customer.items && customer.items.length > 0) {
            html += `
              <div class="bg-gray-700 rounded-lg p-3 mt-2">
                <h4 class="text-sm font-medium mb-2 text-gray-300">Items</h4>
                <div class="space-y-2">
            `;
            
            customer.items.forEach(item => {
              const isItemChecked = state.checkedItems[`${customer.customerNumber}-${item.itemId}`];
              
              html += `
                <div class="flex items-center ${isItemChecked ? 'opacity-70' : ''}">
                  <input 
                    type="checkbox" 
                    class="w-4 h-4 rounded bg-gray-700 border-gray-600 mr-3"
                    ${isItemChecked ? 'checked' : ''}
                    data-customer="${customer.customerNumber}"
                    data-item="${item.itemId}"
                    onChange="handleItemCheck(event, ${customer.customerNumber}, '${item.itemId}')"
                  >
                  <div class="flex-grow">
                    <div class="text-sm">
                      ${item.description}
                      ${item.quantity ? `<span class="text-gray-400">(${item.quantity})</span>` : ''}
                    </div>
                    <div class="text-xs text-gray-500">Item: ${item.itemId}</div>
                  </div>
                </div>
              `;
            });
            
            html += `
                </div>
              </div>
            `;
          } else {
            html += `
              <div class="text-sm text-gray-500 italic mt-2">
                No items for delivery
              </div>
            `;
          }
          
          html += `</div>`;
        });
        
        html += `
            </div>
          </div>
        `;
      }
    });
    
    // If no results found
    if (html === '') {
      html = `
        <div class="text-center p-8">
          <div class="mb-4 text-gray-500">
            <i data-lucide="search-x" class="h-12 w-12 mx-auto"></i>
          </div>
          <p class="text-gray-400">No stops found matching "${state.searchQuery}"</p>
        </div>
      `;
    }
    
    elements.mainContent.innerHTML = html;
    
    // Add event listeners to checkboxes
    document.querySelectorAll('[data-customer]').forEach(checkbox => {
      if (checkbox.hasAttribute('data-item')) {
        checkbox.addEventListener('change', (event) => {
          const customerNumber = checkbox.getAttribute('data-customer');
          const itemId = checkbox.getAttribute('data-item');
          handleItemCheck(event, customerNumber, itemId);
        });
      } else {
        checkbox.addEventListener('change', (event) => {
          const customerNumber = checkbox.getAttribute('data-customer');
          handleCustomerCheck(event, customerNumber);
        });
      }
    });
    
    // Initialize Lucide icons
    lucide.createIcons();
  }
  
  /**
   * Handle customer checkbox change
   */
  function handleCustomerCheck(event, customerNumber) {
    const checked = event.target.checked;
    
    // Find the customer
    const customer = state.routeData.find(c => c.customerNumber.toString() === customerNumber.toString());
    
    if (customer) {
      if (customer.items && customer.items.length > 0) {
        // Check/uncheck all items for this customer
        customer.items.forEach(item => {
          state.completionStats = DataHandler.toggleItemCheck(customer.customerNumber, item.itemId, checked);
        });
      } else {
        // For customers without items
        state.completionStats = DataHandler.toggleItemCheck(customer.customerNumber, null, checked);
      }
      
      // Update UI
      updateStats();
      renderContent();
    }
  }
  
  /**
   * Handle item checkbox change
   */
  function handleItemCheck(event, customerNumber, itemId) {
    const checked = event.target.checked;
    
    // Update data
    state.completionStats = DataHandler.toggleItemCheck(customerNumber, itemId, checked);
    
    // Update UI
    updateStats();
    
    // Check if all items for this customer are checked/unchecked
    const customer = state.routeData.find(c => c.customerNumber.toString() === customerNumber.toString());
    if (customer && customer.items) {
      const allChecked = customer.items.every(item => 
        state.checkedItems[`${customer.customerNumber}-${item.itemId}`]
      );
      
      // If all items are now checked, we may want to update the UI accordingly
      if (allChecked && state.filterCompleted) {
        renderContent(); // This will hide the customer if filtering completed
      }
    }
  }
  
  // Define global handlers for event bindings
  window.handleCustomerCheck = handleCustomerCheck;
  window.handleItemCheck = handleItemCheck;
  
  // Initialize the app
  initApp();
});