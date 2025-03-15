/**
 * data-handler.js
 * Handles data loading, processing, and storage for the Route 33 Guide
 * WITH ENHANCED ERROR HANDLING
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
   * Safe string access - returns empty string if value is undefined/null
   */
  function safeString(str) {
    return (str !== undefined && str !== null) ? String(str).trim() : "";
  }
  
  /**
   * Safe number access - returns 0 if value can't be parsed to a number
   */
  function safeNumber(num) {
    if (num === undefined || num === null || num === '') return 0;
    const parsed = parseInt(num);
    return isNaN(parsed) ? 0 : parsed;
  }
  
  /**
   * Process CSV data into route data with enhanced error handling
   */
  function processCSVData(csvData) {
    console.log("Processing CSV data:", csvData);
    // Check if csvData is an array
    if (!Array.isArray(csvData)) {
      console.error("CSV data is not an array:", csvData);
      return [];
    }
    
    // Group by customer
    const customers = {};
    const processed = [];
    
    // Process each row
    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      
      // Skip rows without customer number
      const customerNum = safeString(row.CustomerNumber);
      if (customerNum === '') {
        console.log("Skipping row without CustomerNumber:", row);
        continue;
      }
      
      // If this is first entry for this customer
      if (!customers[customerNum]) {
        // Determine area based on address
        let area = "Other";
        
        const address = safeString(row.Address).toLowerCase();
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
          accountName: safeString(row.AccountName),
          address: safeString(row.Address),
          area: area,
          items: [],
          hasItems: safeString(row.ItemID) !== '',
          completed: false
        };
        
        processed.push(customers[customerNum]);
      }
      
      // Add item if exists
      if (safeString(row.ItemID) !== '') {
        customers[customerNum].items.push({
          itemId: safeString(row.ItemID),
          description: safeString(row.Description),
          quantity: safeNumber(row.Quantity),
          completed: false
        });
        
        // Ensure customer has items flag is set
        customers[customerNum].hasItems = true;
      }
    }
    
    console.log("Processed customers:", processed);
    return processed;
  }
  
  /**
   * Group customers by area
   */
  function groupByArea(customers) {
    if (!Array.isArray(customers)) {
      console.error("Customers is not an array:", customers);
      return {};
    }
    
    const grouped = {};
    
    // Initialize all areas
    areaOrder.forEach(area => {
      grouped[area] = [];
    });
    
    // Add customers to areas
    customers.forEach(customer => {
      if (!customer) return;
      
      const area = customer.area || "Other";
      if (!grouped[area]) {
        grouped[area] = [];
      }
      grouped[area].push(customer);
    });
    
    // Calculate area stats
    const stats = {};
    Object.keys(grouped).forEach(area => {
      if (grouped[area] && grouped[area].length > 0) {
        stats[area] = grouped[area].length;
      }
    });
    
    areaStats = stats;
    return grouped;
  }
  
  /**
   * Load CSV data from file with enhanced error handling
   */
  async function loadCSVFile(file) {
    if (!file) {
      console.error("No file provided");
      throw new Error("No file provided");
    }
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = function(e) {
        try {
          const csv = e.target.result;
          Papa.parse(csv, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: function(results) {
              console.log("CSV parsing complete:", results);
              if (results && results.data) {
                resolve(results.data);
              } else {
                console.error("Invalid CSV parsing results:", results);
                reject(new Error("Invalid CSV parsing results"));
              }
            },
            error: function(error) {
              console.error("CSV parsing error:", error);
              reject(error);
            }
          });
        } catch (error) {
          console.error("Error processing CSV:", error);
          reject(error);
        }
      };
      
      reader.onerror = function(e) {
        console.error("File reading error:", e);
        reject(e);
      };
      
      try {
        reader.readAsText(file);
      } catch (error) {
        console.error("Error reading file:", error);
        reject(error);
      }
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
        console.log("Found saved CSV data in localStorage");
        // Parse the saved CSV
        return new Promise((resolve, reject) => {
          Papa.parse(savedDataString, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: function(results) {
              console.log("Parsing stored CSV complete:", results);
              if (results && results.data) {
                resolve(results.data);
              } else {
                console.error("Invalid stored CSV parsing results");
                reject(new Error("Invalid stored CSV parsing results"));
              }
            },
            error: function(error) {
              console.error("Error parsing stored CSV:", error);
              reject(error);
            }
          });
        });
      } catch (error) {
        console.error("Error loading saved CSV data:", error);
        // If there's an error, fall through to prompt for upload
      }
    } else {
      console.log("No saved CSV data found in localStorage");
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
      console.log("Route data saved to localStorage");
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
        console.log("Found saved route data in localStorage");
        const data = JSON.parse(saved);
        return data;
      }
    } catch (error) {
      console.error("Error loading saved data:", error);
    }
    
    console.log("No saved route data found in localStorage");
    return null;
  }
  
  /**
   * Initialize data
   */
  async function initData() {
    console.log("Initializing data");
    // Try to load from localStorage first
    const savedData = loadSavedData();
    
    if (savedData && savedData.routeData && Array.isArray(savedData.routeData)) {
      console.log("Using saved data from localStorage");
      routeData = savedData.routeData;
      checkedItems = savedData.checkedItems || {};
    } else {
      console.log("No valid saved data, loading from CSV");
      // Load from CSV if no saved data
      try {
        const csvData = await loadDefaultCSV();
        if (Array.isArray(csvData) && csvData.length > 0) {
          console.log("CSV data loaded successfully");
          routeData = processCSVData(csvData);
          checkedItems = {};
        } else {
          console.log("No CSV data loaded, using empty array");
          routeData = [];
          checkedItems = {};
        }
      } catch (error) {
        console.error("Error loading CSV data:", error);
        routeData = [];
        checkedItems = {};
      }
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
    
    console.log("Data initialization complete:", {
      routeData: routeData.length,
      customersByArea,
      customerStops: customerStops.length,
      areaStats
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
    console.log("Importing CSV file:", file);
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
      console.log("Raw CSV saved to localStorage");
      
      // Now parse the CSV
      const csvData = await loadCSVFile(file);
      console.log("CSV file parsed successfully:", csvData);
      
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
      
      console.log("CSV import complete");
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
    
    if (!Array.isArray(routeData)) {
      console.error("Route data is not an array:", routeData);
      return {
        totalStops: 0,
        completedStops: 0,
        totalItems: 0, 
        completedItems: 0,
        stopsProgress: 0,
        itemsProgress: 0
      };
    }
    
    routeData.forEach(customer => {
      if (!customer) return;
      
      totalStops++;
      
      // Check if all items are completed for this customer
      let allItemsCompleted = true;
      let hasCheckedItems = false;
      
      if (customer.items && customer.items.length > 0) {
        customer.items.forEach(item => {
          if (!item) return;
          
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
    if (!customerNumber) {
      console.error("No customer number provided");
      return getCompletionStats();
    }
    
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
    if (!Array.isArray(routeData)) {
      console.error("Route data is not an array:", routeData);
      return getCompletionStats();
    }
    
    routeData.forEach(customer => {
      if (!customer) return;
      
      if (customer.items && customer.items.length > 0) {
        customer.items.forEach(item => {
          if (!item) return;
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
    if (!searchTerm || safeString(searchTerm) === '') {
      return routeData;
    }
    
    if (!Array.isArray(routeData)) {
      console.error("Route data is not an array:", routeData);
      return [];
    }
    
    const term = safeString(searchTerm).toLowerCase();
    
    return routeData.filter(customer => {
      if (!customer) return false;
      
      // Check customer info
      if (
        safeString(customer.accountName).toLowerCase().includes(term) ||
        safeString(customer.address).toLowerCase().includes(term) ||
        safeString(customer.customerNumber).includes(term)
      ) {
        return true;
      }
      
      // Check items
      if (customer.items && customer.items.length > 0) {
        return customer.items.some(item => {
          if (!item) return false;
          return (
            safeString(item.description).toLowerCase().includes(term) ||
            safeString(item.itemId).includes(term)
          );
        });
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