/**
 * CSV Processor Utility for Route 33 Guide
 * This file provides utilities to analyze CSV data and extract insights
 * IMPROVED VERSION: Separates data processing from presentation
 */

const CSVProcessor = (function() {
  // Safe string access
  function safeString(str) {
    return (str !== undefined && str !== null) ? String(str).trim() : "";
  }
  
  // Safe number access
  function safeNumber(num) {
    if (num === undefined || num === null || num === '') return 0;
    const parsed = parseInt(num);
    return isNaN(parsed) ? 0 : parsed;
  }
  
  // Area classification configuration - moved to a configurable object
  const areaClassification = [
    { area: "Shasta Ortho", patterns: ["liberty"] },
    { area: "Bechelli Lane", patterns: ["bechelli"] },
    { area: "Downtown", patterns: ["cypress", "hartnell"] },
    { area: "Churn Creek", patterns: ["churn creek"] },
    { area: "South Redding", patterns: ["bonnyview"] },
    { area: "Other", patterns: [] }  // Default
  ];
  
  // Determine area from address using configuration
  function determineArea(address) {
    const safeAddress = safeString(address).toLowerCase();
    
    for (const areaConfig of areaClassification) {
      if (areaConfig.patterns.some(pattern => safeAddress.includes(pattern))) {
        return areaConfig.area;
      }
    }
    
    return "Other";
  }
  
  /**
   * Analyze CSV data to extract insights - Single pass algorithm
   */
  function analyzeCSVData(csvData) {
    if (!Array.isArray(csvData)) {
      console.error("CSV data is not an array:", csvData);
      return {
        uniqueCustomerCount: 0,
        customersByArea: {},
        areaStats: {},
        totalItems: 0,
        itemsByType: {},
        customersWithoutItems: 0,
        hasMultipleItemsPerCustomer: false
      };
    }
    
    console.log("Analyzing CSV data with improved processor");
    
    // Initialize data structures for tracking
    const uniqueCustomers = new Set();
    const customersByArea = {};
    const areaStats = {};
    const itemsByType = {};
    const customersWithItems = new Set();
    let totalItems = 0;
    
    // Initialize area containers
    areaClassification.forEach(config => {
      customersByArea[config.area] = [];
      areaStats[config.area] = 0;
    });
    
    // Single-pass analysis
    csvData.forEach(row => {
      try {
        const customerNumber = safeString(row.CustomerNumber);
        if (!customerNumber) return;
        
        uniqueCustomers.add(customerNumber);
        
        // Process area classification
        const address = safeString(row.Address);
        const area = determineArea(address);
        
        // Track customer by area (only once per customer)
        if (!customersByArea[area].includes(customerNumber)) {
          customersByArea[area].push(customerNumber);
          areaStats[area]++;
        }
        
        // Process item data
        const itemId = safeString(row.ItemID) || "unknown";
        if (itemId) {
          totalItems++;
          customersWithItems.add(customerNumber);
          
          // Extract item type
          const description = safeString(row.Description);
          const itemType = description.split('-')[0].trim() || "Unknown";
          
          if (!itemsByType[itemType]) {
            itemsByType[itemType] = 0;
          }
          itemsByType[itemType]++;
        }
      } catch (error) {
        console.error("Error processing row:", error, row);
      }
    });
    
    // Calculate customers without items
    const customersWithoutItems = uniqueCustomers.size - customersWithItems.size;
    
    // Return analysis results as a structured data object
    return {
      uniqueCustomerCount: uniqueCustomers.size,
      customersByArea: customersByArea,
      areaStats: areaStats,
      totalItems: totalItems,
      itemsByType: itemsByType,
      customersWithoutItems: customersWithoutItems,
      hasMultipleItemsPerCustomer: totalItems > uniqueCustomers.size
    };
  }
  
  /**
   * Generate route summary data (without HTML generation)
   */
  function generateRouteSummary(csvData) {
    const insights = analyzeCSVData(csvData);
    
    // Return structured data for UI to render
    return {
      customerStats: {
        totalCustomers: insights.uniqueCustomerCount,
        areaBreakdown: Object.entries(insights.areaStats).map(([area, count]) => ({
          area,
          count,
          icon: "map-pin"
        })),
        customersWithoutItems: {
          count: insights.customersWithoutItems,
          icon: "alert-circle"
        }
      },
      itemStats: {
        totalItems: insights.totalItems,
        typeBreakdown: Object.entries(insights.itemsByType)
          .sort((a, b) => b[1] - a[1]) // Sort by count
          .slice(0, 5) // Top 5 types
          .map(([type, count]) => ({
            type,
            count,
            icon: "check"
          }))
      }
    };
  }
  
  /**
   * Optimize route order with improved error handling
   */
  function suggestOptimalRoute(csvData) {
    if (!Array.isArray(csvData)) {
      console.error("CSV data is not an array:", csvData);
      return [];
    }
    
    try {
      // Extract unique stops
      const stops = [];
      const addedCustomers = new Set();
      
      csvData.forEach(row => {
        const customerNumber = safeString(row.CustomerNumber);
        
        if (customerNumber && !addedCustomers.has(customerNumber)) {
          addedCustomers.add(customerNumber);
          
          // Determine area safely
          const address = safeString(row.Address);
          const area = determineArea(address);
          
          stops.push({
            customerNumber: customerNumber,
            accountName: safeString(row.AccountName),
            address: address,
            area: area
          });
        }
      });
      
      // Get optimal area order
      const areaOrder = areaClassification.map(config => config.area);
      
      // Sort stops by area in the optimal order
      stops.sort((a, b) => {
        const areaIndexA = areaOrder.indexOf(a.area);
        const areaIndexB = areaOrder.indexOf(b.area);
        
        if (areaIndexA !== areaIndexB) {
          return areaIndexA - areaIndexB;
        }
        
        // If same area, sort by name
        return safeString(a.accountName).localeCompare(safeString(b.accountName));
      });
      
      return stops;
    } catch (error) {
      console.error("Error generating optimal route:", error);
      return [];
    }
  }
  
  /**
   * Get all available areas in configured order
   */
  function getAreaOrder() {
    return areaClassification.map(config => config.area);
  }
  
  /**
   * Update area classification rules
   * Allows runtime configuration of area classification
   */
  function updateAreaClassification(newClassification) {
    if (!Array.isArray(newClassification)) {
      console.error("New area classification is not an array");
      return false;
    }
    
    try {
      // Validate new classification
      const valid = newClassification.every(item => 
        item.area && typeof item.area === 'string' && 
        Array.isArray(item.patterns)
      );
      
      if (!valid) {
        console.error("Invalid area classification format");
        return false;
      }
      
      // Update classification rules
      while (areaClassification.length > 0) {
        areaClassification.pop();
      }
      
      newClassification.forEach(item => {
        areaClassification.push(item);
      });
      
      console.log("Updated area classification rules:", areaClassification);
      return true;
    } catch (error) {
      console.error("Error updating area classification:", error);
      return false;
    }
  }
  
  // Public API
  return {
    analyzeCSVData,
    generateRouteSummary,
    suggestOptimalRoute,
    getAreaOrder,
    updateAreaClassification
  };
})();
