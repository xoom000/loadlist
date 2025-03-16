/**
 * data-handler.js
 * Handles data loading, processing, and storage for the Route 33 Guide
 */

const DataHandler = (function() {
  // Area order for consistent display
  const areaOrder = [
    "Shasta Ortho", 
    "Bechelli Lane", 
    "Downtown", 
    "Churn Creek", 
    "South Redding", 
    "Other"
  ];
  
  // State storage
  let routeData = [];
  let customerStops = [];
  let customersByArea = {};
  let checkedItems = {};
  let areaStats = {};
  
  /**
   * Process CSV data into route data
   */
  function processCSVData(csvData) {
    // Group by customer
    const customers = {};
    const processed = [];
    
    // Process each row
    csvData.forEach(row => {
      // Skip rows without customer number
      if (!row.CustomerNumber || row.CustomerNumber.trim() === '') {
        return;
      }
      
      const customerNum = row.CustomerNumber.trim();
      
      // If this is first entry for this customer
      if (!customers[customerNum]) {
        // Determine area based on address
        let area = "Other";
        
        const address = row.Address.toLowerCase();
        if (address.includes("liberty")) {
          area = "Shasta Ortho";
        } else if (address.includes("bechelli")) {
          area = "Bechelli Lane";
        } else if (address.includes("cypress") || address.includes("hartnell")) {
          area = "Downtown";
        } else if (address.includes("churn creek")) {
          area = "Churn Creek";
        } else if (address.includes("bonnyview")) {
          area = "South Redding";
        }
        
        // Create customer entry
        customers[customerNum] = {
          customerNumber: customerNum,
          accountName: row.AccountName.trim(),
          address: row.Address.trim(),
          area: area,
          items: [],
          hasItems: row.ItemID && row.ItemID.trim() !== '',
          completed: false
        };
        
        processed.push(customers[customerNum]);
      }
      
      // Add item if exists
      if (row.ItemID && row.ItemID.trim() !== '') {
        customers[customerNum].items.push({
          itemId: row.ItemID.trim(),
          description: row.Description ? row.Description.trim() : '',
          quantity: parseInt(row.Quantity) || 0,
          completed: false
        });
        
        // Ensure customer has items flag is set
        customers[customerNum].hasItems = true;
      }
    });
    
    return processed;
  }
  
  /**
   * Group customers by area
   */
  function groupByArea(customers) {
    const grouped = {};
    
    // Initialize all areas
    areaOrder.forEach(area => {
      grouped[area] = [];
    });
    
    // Add customers to areas
    customers.forEach(customer => {
      if (!grouped[customer.area]) {
        grouped[customer.area] = [];
      }
      grouped[customer.area].push(customer);
    });
    
    // Calculate area stats
    const stats = {};
    Object.keys(grouped).forEach(area => {
      if (grouped[area].length > 0) {
        stats[area] = grouped[area].length;
      }
    });
    
    areaStats = stats;
    return grouped;
  }
  
  /**
   * Load CSV data from file
   */
  async function loadCSVFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = function(e) {
        const csv = e.target.result;
        Papa.parse(csv, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: function(results) {
            resolve(results.data);
          },
          error: function(error) {
            reject(error);
          }
        });
      };
      
      reader.onerror = function(e) {
        reject(e);
      };
      
      reader.readAsText(file);
    });
  }
  
  /**
   * Load default CSV data (prompts user to upload a file if none exists)
   */
  async function loadDefaultCSV() {
    // Try to get previously loaded data from localStorage
    const savedDataString = localStorage.getItem('route33RawData');
    
    if (savedDataString) {
      try {
        // Parse the saved CSV
        return new Promise((resolve, reject) => {
          Papa.parse(savedDataString, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: function(results) {
              resolve(results.data);
            },
            error: function(error) {
              reject(error);
            }
          });
        });
      } catch (error) {
        console.error("Error loading saved CSV data:", error);
        // If there's an error, fall through to prompt for upload
      }
    }
    
    // If no saved data or error parsing, return empty array
    // The app will show the upload prompt when no data is found
    return [];
  }
  
  /**
   * Save route data to localStorage
   */
  function saveRouteData() {
    const dataToSave = {
      routeData: routeData,
      checkedItems: checkedItems,
      lastUpdated: new Date().toISOString()
    };
    
    try {
      localStorage.setItem('route33Data', JSON.stringify(dataToSave));
      return true;
    } catch (error) {
      console.error("Error saving data:", error);
      return false;
    }
  }
  
  /**
   * Load route data from localStorage
   */
  function loadSavedData() {
    try {
      const saved = localStorage.getItem('route33Data');
      if (saved) {
        const data = JSON.parse(saved);
        return data;
      }
    } catch (error) {
      console.error("Error loading saved data:", error);
    }
    
    return null;
  }
  
  /**
   * Initialize data
   */
  async function initData() {
    // Try to load from localStorage first
    const savedData = loadSavedData();
    
    if (savedData && savedData.routeData) {
      routeData = savedData.routeData;
      checkedItems = savedData.checkedItems || {};
    } else {
      // Load from CSV if no saved data
      const csvData = await loadDefaultCSV();
      routeData = processCSVData(csvData);
      checkedItems = {};
    }
    
    // Process and group data
    customersByArea = groupByArea(routeData);
    
    // Create flat list of stops
    customerStops = routeData.map(customer => {
      return {
        customerNumber: customer.customerNumber,
        accountName: customer.accountName,
        address: customer.address,
        area: customer.area,
        hasItems: customer.hasItems,
        itemCount: customer.items ? customer.items.length : 0
      };
    });
    
    return {
      routeData,
      customersByArea,
      customerStops,
      areaStats
    };
  }
  
  /**
   * Import data from uploaded CSV file
   */
  async function importCSV(file) {
    try {
      // First read the file as text to save the raw CSV
      const reader = new FileReader();
      const rawCsv = await new Promise((resolve, reject) => {
        reader.onload = e => resolve(e.target.result);
        reader.onerror = e => reject(e);
        reader.readAsText(file);
      });
      
      // Save the raw CSV to localStorage for future use
      localStorage.setItem('route33RawData', rawCsv);
      
      // Now parse the CSV
      const csvData = await loadCSVFile(file);
      routeData = processCSVData(csvData);
      
      // Keep existing checked items if possible
      const newCheckedItems = {};
      routeData.forEach(customer => {
        if (checkedItems[customer.customerNumber]) {
          newCheckedItems[customer.customerNumber] = checkedItems[customer.customerNumber];
        }
      });
      
      checkedItems = newCheckedItems;
      
      // Process and group data
      customersByArea = groupByArea(routeData);
      
      // Create flat list of stops
      customerStops = routeData.map(customer => {
        return {
          customerNumber: customer.customerNumber,
          accountName: customer.accountName,
          address: customer.address,
          area: customer.area,
          hasItems: customer.hasItems,
          itemCount: customer.items ? customer.items.length : 0
        };
      });
      
      // Save to localStorage
      saveRouteData();
      
      return {
        routeData,
        customersByArea,
        customerStops,
        areaStats
      };
    } catch (error) {
      console.error("Error importing CSV:", error);
      throw error;
    }
  }
  
  /**
   * Get completion statistics
   */
  function getCompletionStats() {
    let totalStops = 0;
    let completedStops = 0;
    let totalItems = 0;
    let completedItems = 0;
    
    routeData.forEach(customer => {
      totalStops++;
      
      // Check if all items are completed for this customer
      let allItemsCompleted = true;
      let hasCheckedItems = false;
      
      if (customer.items && customer.items.length > 0) {
        customer.items.forEach(item => {
          totalItems++;
          
          // Check if item is marked as completed
          if (checkedItems[`${customer.customerNumber}-${item.itemId}`]) {
            completedItems++;
            hasCheckedItems = true;
          } else {
            allItemsCompleted = false;
          }
        });
        
        // If all items completed, mark stop as completed
        if (allItemsCompleted && hasCheckedItems) {
          completedStops++;
        }
      } else if (checkedItems[customer.customerNumber]) {
        // For stops without items, check if the stop itself is marked complete
        completedStops++;
      }
    });
    
    return {
      totalStops,
      completedStops,
      totalItems,
      completedItems,
      stopsProgress: totalStops > 0 ? Math.round((completedStops / totalStops) * 100) : 0,
      itemsProgress: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0
    };
  }
  
  /**
   * Mark item as checked/unchecked
   */
  function toggleItemCheck(customerNumber, itemId, checked) {
    const key = itemId ? `${customerNumber}-${itemId}` : customerNumber;
    
    if (checked) {
      checkedItems[key] = true;
    } else {
      delete checkedItems[key];
    }
    
    // Save data
    saveRouteData();
    
    return getCompletionStats();
  }
  
  /**
   * Reset all checked items
   */
  function resetCheckedItems() {
    checkedItems = {};
    saveRouteData();
    return getCompletionStats();
  }
  
  /**
   * Check all items
   */
  function checkAllItems() {
    routeData.forEach(customer => {
      if (customer.items && customer.items.length > 0) {
        customer.items.forEach(item => {
          checkedItems[`${customer.customerNumber}-${item.itemId}`] = true;
        });
      } else {
        checkedItems[customer.customerNumber] = true;
      }
    });
    
    saveRouteData();
    return getCompletionStats();
  }
  
  /**
   * Filter customers by search term
   */
  function searchCustomers(searchTerm) {
    if (!searchTerm || searchTerm.trim() === '') {
      return routeData;
    }
    
    const term = searchTerm.toLowerCase().trim();
    
    return routeData.filter(customer => {
      // Check customer info
      if (
        customer.accountName.toLowerCase().includes(term) ||
        customer.address.toLowerCase().includes(term) ||
        customer.customerNumber.toString().includes(term)
      ) {
        return true;
      }
      
      // Check items
      if (customer.items && customer.items.length > 0) {
        return customer.items.some(item => 
          item.description.toLowerCase().includes(term) ||
          item.itemId.toString().includes(term)
        );
      }
      
      return false;
    });
  }
  
  // Public API
  return {
    initData,
    importCSV,
    saveRouteData,
    getCompletionStats,
    toggleItemCheck,
    resetCheckedItems,
    checkAllItems,
    searchCustomers,
    areaOrder
  };
})();