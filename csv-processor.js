/**
 * CSV Processor Utility for Route 33 Guide
 * This file provides utilities to analyze CSV data and extract insights
 */

const CSVProcessor = (function() {
  
  /**
   * Analyze CSV data to extract insights
   */
  function analyzeCSVData(csvData) {
    // Count unique customers
    const uniqueCustomers = new Set();
    csvData.forEach(row => {
      if (row.CustomerNumber && row.CustomerNumber.trim() !== '') {
        uniqueCustomers.add(row.CustomerNumber);
      }
    });
    
    // Group customers by area based on address
    const customersByArea = {};
    const customerAddresses = {};
    const areaOrder = ["Shasta Ortho", "Bechelli Lane", "Downtown", "Churn Creek", "South Redding", "Other"];
    
    // Initialize areas
    areaOrder.forEach(area => {
      customersByArea[area] = [];
    });
    
    csvData.forEach(row => {
      if (!row.CustomerNumber || row.CustomerNumber.trim() === '') return;
      
      const customerNum = row.CustomerNumber.trim();
      if (!customerAddresses[customerNum] && row.Address) {
        customerAddresses[customerNum] = row.Address.toLowerCase();
        
        // Determine area
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
        
        if (!customersByArea[area]) {
          customersByArea[area] = [];
        }
        customersByArea[area].push(customerNum);
      }
    });
    
    // Count items and organized by type
    const itemsByType = {};
    let totalItems = 0;
    
    csvData.forEach(row => {
      if (row.ItemID && row.ItemID.trim() !== '' && row.Description) {
        totalItems++;
        
        // Extract item type (first word)
        const itemType = row.Description.split('-')[0].trim();
        
        if (!itemsByType[itemType]) {
          itemsByType[itemType] = 0;
        }
        itemsByType[itemType]++;
      }
    });
    
    // Find customers without items
    const customersWithoutItems = [...uniqueCustomers].filter(customerNum => {
      return !csvData.some(row => 
        row.CustomerNumber === customerNum && row.ItemID && row.ItemID.trim() !== ''
      );
    });
    
    return {
      uniqueCustomerCount: uniqueCustomers.size,
      customersByArea: customersByArea,
      areaStats: Object.keys(customersByArea).reduce((stats, area) => {
        if (customersByArea[area].length > 0) {
          stats[area] = customersByArea[area].length;
        }
        return stats;
      }, {}),
      totalItems: totalItems,
      itemsByType: itemsByType,
      customersWithoutItems: customersWithoutItems.length,
      hasMultipleItemsPerCustomer: totalItems > uniqueCustomers.size
    };
  }
  
  /**
   * Generate route summary from CSV data
   */
  function generateRouteSummary(csvData) {
    const insights = analyzeCSVData(csvData);
    
    let summary = `
      <div class="bg-gray-800 p-4 rounded-lg mt-6 mb-4">
        <h2 class="text-lg font-semibold mb-2">Route 33 Summary</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 class="text-sm font-medium mb-1 text-blue-400">Customer Stats</h3>
            <ul class="text-sm space-y-1">
              <li class="flex items-center">
                <i data-lucide="users" class="h-4 w-4 text-blue-500 mr-2"></i>
                <span><strong>Total Customers:</strong> ${insights.uniqueCustomerCount}</span>
              </li>
              ${Object.keys(insights.areaStats).map(area => `
                <li class="flex items-center">
                  <i data-lucide="map-pin" class="h-4 w-4 text-blue-500 mr-2"></i>
                  <span><strong>${area}:</strong> ${insights.areaStats[area]} customers</span>
                </li>
              `).join('')}
              <li class="flex items-center">
                <i data-lucide="alert-circle" class="h-4 w-4 text-yellow-500 mr-2"></i>
                <span><strong>No Items:</strong> ${insights.customersWithoutItems} customers</span>
              </li>
            </ul>
          </div>
          <div>
            <h3 class="text-sm font-medium mb-1 text-blue-400">Item Stats</h3>
            <ul class="text-sm space-y-1">
              <li class="flex items-center">
                <i data-lucide="package" class="h-4 w-4 text-blue-500 mr-2"></i>
                <span><strong>Total Items:</strong> ${insights.totalItems}</span>
              </li>
              ${Object.keys(insights.itemsByType).slice(0, 5).map(type => `
                <li class="flex items-center">
                  <i data-lucide="check" class="h-4 w-4 text-blue-500 mr-2"></i>
                  <span><strong>${type}:</strong> ${insights.itemsByType[type]} items</span>
                </li>
              `).join('')}
            </ul>
          </div>
        </div>
      </div>
    `;
    
    return summary;
  }
  
  // Optimize route order
  function suggestOptimalRoute(csvData) {
    // Extract unique stops
    const stops = [];
    const addedCustomers = new Set();
    
    csvData.forEach(row => {
      if (row.CustomerNumber && !addedCustomers.has(row.CustomerNumber)) {
        addedCustomers.add(row.CustomerNumber);
        
        // Determine area
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
        
        stops.push({
          customerNumber: row.CustomerNumber,
          accountName: row.AccountName,
          address: row.Address,
          area: area
        });
      }
    });
    
    // Set optimal order based on area (logical route through town)
    const areaOrder = ["Shasta Ortho", "Bechelli Lane", "Downtown", "Churn Creek", "South Redding", "Other"];
    
    // Sort stops by area in the optimal order
    stops.sort((a, b) => {
      const areaIndexA = areaOrder.indexOf(a.area);
      const areaIndexB = areaOrder.indexOf(b.area);
      
      if (areaIndexA !== areaIndexB) {
        return areaIndexA - areaIndexB;
      }
      
      // If same area, sort by name
      return a.accountName.localeCompare(b.accountName);
    });
    
    return stops;
  }
  
  // Public API
  return {
    analyzeCSVData,
    generateRouteSummary,
    suggestOptimalRoute
  };
})();