/**
 * optimized-data-processor.js
 * Performance-optimized data processing functions for Route 33 Guide
 * Uses single-pass algorithms for better efficiency with large datasets
 */

const OptimizedDataProcessor = (function() {
  // Helper functions for safe data access
  function safeString(str) {
    return (str !== undefined && str !== null) ? String(str).trim() : "";
  }
  
  function safeNumber(num) {
    if (num === undefined || num === null || num === '') return 0;
    const parsed = parseInt(num);
    return isNaN(parsed) ? 0 : parsed;
  }
  
  /**
   * Process CSV data in a single pass, extracting all needed information
   * This is more efficient than multiple iterations over the data
   */
  function processCSVData(csvData) {
    console.time('processCSVData');
    
    if (!Array.isArray(csvData)) {
      console.error("CSV data is not an array:", csvData);
      console.timeEnd('processCSVData');
      return {
        customers: [],
        customersByNumber: {},
        customersByArea: {},
        itemsByType: {},
        stats: {
          totalCustomers: 0,
          totalItems: 0,
          itemsPerCustomer: 0,
          customersWithoutItems: 0,
          areaDistribution: {}
        }
      };
    }
    
    try {
      // Initialize data structures
      const customers = [];
      const customersByNumber = {};
      const customersByArea = {};
      const itemsByType = {};
      const areaDistribution = {};
      const itemCounts = new Map();
      
      // Track stats
      let totalItems = 0;
      let customersWithItems = 0;
      
      // Single pass through CSV data
      csvData.forEach(row => {
        const customerNumber = safeString(row.CustomerNumber);
        if (!customerNumber) return;
        
        // Process customer if not already seen
        if (!customersByNumber[customerNumber]) {
          // Get area using AreaClassifier if available
          let area = "Other";
          let areaObject = null;
          
          if (window.AreaClassifier) {
            areaObject = AreaClassifier.classifyAddress(safeString(row.Address));
            area = areaObject.name;
          } else {
            // Fallback area detection if AreaClassifier not available
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
          }
          
          // Create customer object
          const customer = {
            customerNumber,
            accountName: safeString(row.AccountName),
            address: safeString(row.Address),
            area,
            areaObject,
            items: [],
            hasItems: false,
            completed: false
          };
          
          // Add to data structures
          customers.push(customer);
          customersByNumber[customerNumber] = customer;
          
          // Initialize area in customersByArea if needed
          if (!customersByArea[area]) {
            customersByArea[area] = [];
            areaDistribution[area] = 0;
          }
          
          customersByArea[area].push(customer);
          areaDistribution[area]++;
          
          // Initialize item count for this customer
          itemCounts.set(customerNumber, 0);
        }
        
        // Get the customer object
        const customer = customersByNumber[customerNumber];
        
        // Process item data if present
        const itemId = safeString(row.ItemID);
        if (itemId) {
          const quantity = safeNumber(row.Quantity);
          const description = safeString(row.Description);
          
          // Create item object
          const item = {
            itemId,
            description,
            quantity,
            completed: false
          };
          
          // Add to customer's items
          customer.items.push(item);
          customer.hasItems = true;
          
          // Track statistics
          totalItems++;
          itemCounts.set(customerNumber, itemCounts.get(customerNumber) + 1);
          
          // Categorize item by type (first word of description)
          const itemType = description.split('-')[0].trim() || "Unknown";
          if (!itemsByType[itemType]) {
            itemsByType[itemType] = [];
          }
          itemsByType[itemType].push({
            customerNumber,
            accountName: customer.accountName,
            itemId,
            description,
            quantity
          });
        }
      });
      
      // Calculate additional statistics
      for (const customer of customers) {
        if (customer.hasItems) {
          customersWithItems++;
        }
      }
      
      const customersWithoutItems = customers.length - customersWithItems;
      const itemsPerCustomer = customers.length > 0 ? totalItems / customers.length : 0;
      
      console.timeEnd('processCSVData');
      
      // Return all processed data and statistics
      return {
        customers,
        customersByNumber,
        customersByArea,
        itemsByType,
        stats: {
          totalCustomers: customers.length,
          totalItems,
          itemsPerCustomer,
          customersWithoutItems,
          areaDistribution
        }
      };
    } catch (error) {
      console.error("Error processing CSV data:", error);
      console.timeEnd('processCSVData');
      
      // Return empty data on error
      return {
        customers: [],
        customersByNumber: {},
        customersByArea: {},
        itemsByType: {},
        stats: {
          totalCustomers: 0,
          totalItems: 0,
          itemsPerCustomer: 0,
          customersWithoutItems: 0,
          areaDistribution: {}
        }
      };
    }
  }
  
  /**
   * Generate optimal route in a performance-efficient way
   */
  function generateOptimalRoute(processedData, options = {}) {
    console.time('generateOptimalRoute');
    
    try {
      const { customers, customersByArea } = processedData;
      
      if (!customers || customers.length === 0) {
        console.timeEnd('generateOptimalRoute');
        return [];
      }
      
      // Get configuration 
      const sortByAddress = options.sortByAddress || false;
      
      // Get area order from AreaClassifier if available, or use default
      let areaOrder;
      if (window.AreaClassifier) {
        areaOrder = AreaClassifier.getAreaNames();
      } else {
        areaOrder = [
          "Shasta Ortho", 
          "Bechelli Lane", 
          "Downtown", 
          "Churn Creek", 
          "South Redding", 
          "Other"
        ];
      }
      
      // Create route by iterating through areas in order
      const route = [];
      
      for (const area of areaOrder) {
        const areaCustomers = customersByArea[area];
        
        if (areaCustomers && areaCustomers.length > 0) {
          if (sortByAddress) {
            // Sort customers within area by address
            areaCustomers.sort((a, b) => {
              return safeString(a.address).localeCompare(safeString(b.address));
            });
          }
          
          // Add all customers in this area to route
          areaCustomers.forEach(customer => {
            route.push({
              customerNumber: customer.customerNumber,
              accountName: customer.accountName,
              address: customer.address,
              area: customer.area,
              hasItems: customer.hasItems,
              itemCount: customer.items ? customer.items.length : 0,
              coordinates: customer.coordinates // If available
            });
          });
        }
      }
      
      console.timeEnd('generateOptimalRoute');
      return route;
    } catch (error) {
      console.error("Error generating optimal route:", error);
      console.timeEnd('generateOptimalRoute');
      return [];
    }
  }
  
  /**
   * Filter items/customers by search term efficiently
   */
  function searchItems(processedData, searchTerm) {
    console.time('searchItems');
    
    try {
      const { customers, customersByNumber } = processedData;
      const term = safeString(searchTerm).toLowerCase();
      
      if (!term) {
        console.timeEnd('searchItems');
        return customers;
      }
      
      // Map to track which customers match the search
      const matchingCustomers = new Map();
      
      // Look for matching customers (direct attributes)
      customers.forEach(customer => {
        if (safeString(customer.accountName).toLowerCase().includes(term) ||
            safeString(customer.address).toLowerCase().includes(term) ||
            safeString(customer.customerNumber).includes(term) ||
            safeString(customer.area).toLowerCase().includes(term)) {
          matchingCustomers.set(customer.customerNumber, customer);
        }
      });
      
      // Look for matching items
      customers.forEach(customer => {
        if (customer.items && customer.items.length > 0) {
          for (const item of customer.items) {
            if (safeString(item.description).toLowerCase().includes(term) ||
                safeString(item.itemId).includes(term)) {
              matchingCustomers.set(customer.customerNumber, customer);
              break;
            }
          }
        }
      });
      
      console.timeEnd('searchItems');
      return Array.from(matchingCustomers.values());
    } catch (error) {
      console.error("Error searching items:", error);
      console.timeEnd('searchItems');
      return [];
    }
  }
  
  /**
   * Calculate completion status
   */
  function calculateCompletionStatus(processedData, checkedItems) {
    console.time('calculateCompletionStatus');
    
    try {
      const { customers } = processedData;
      
      if (!customers || customers.length === 0) {
        console.timeEnd('calculateCompletionStatus');
        return {
          totalStops: 0,
          completedStops: 0,
          totalItems: 0,
          completedItems: 0,
          progress: 0
        };
      }
      
      let totalStops = 0;
      let completedStops = 0;
      let totalItems = 0;
      let completedItems = 0;
      
      // Process each customer
      customers.forEach(customer => {
        totalStops++;
        let customerCompleted = false;
        
        if (customer.items && customer.items.length > 0) {
          let allItemsCompleted = true;
          let hasCompletedItems = false;
          
          // Check status of each item
          customer.items.forEach(item => {
            totalItems++;
            const itemKey = `${customer.customerNumber}-${item.itemId}`;
            
            if (checkedItems[itemKey]) {
              completedItems++;
              hasCompletedItems = true;
            } else {
              allItemsCompleted = false;
            }
          });
          
          customerCompleted = allItemsCompleted && hasCompletedItems;
        } else {
          // For customers without items
          customerCompleted = !!checkedItems[customer.customerNumber];
        }
        
        if (customerCompleted) {
          completedStops++;
        }
      });
      
      const progress = totalStops > 0 ? Math.round((completedStops / totalStops) * 100) : 0;
      
      console.timeEnd('calculateCompletionStatus');
      
      return {
        totalStops,
        completedStops,
        totalItems,
        completedItems,
        progress
      };
    } catch (error) {
      console.error("Error calculating completion status:", error);
      console.timeEnd('calculateCompletionStatus');
      
      return {
        totalStops: 0,
        completedStops: 0,
        totalItems: 0,
        completedItems: 0,
        progress: 0
      };
    }
  }
  
  // Public API
  return {
    processCSVData,
    generateOptimalRoute,
    searchItems,
    calculateCompletionStatus
  };
})();