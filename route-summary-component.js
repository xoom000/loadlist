/**
 * route-summary-component.js
 * UI component for rendering route summary data
 * Demonstrates separation of presentation from data processing
 */

const RouteSummaryComponent = (function() {
  /**
   * Safely render an icon from Lucide
   */
  function renderIcon(iconName, classes = "h-4 w-4 text-blue-500 mr-2") {
    if (!iconName) return '';
    return `<i data-lucide="${iconName}" class="${classes}"></i>`;
  }
  
  /**
   * Sanitize text for safe HTML insertion
   */
  function sanitizeHTML(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  
  /**
   * Render summary data into HTML
   */
  function renderSummary(summaryData) {
    if (!summaryData) {
      console.error("No summary data provided");
      return `
        <div class="bg-gray-800 p-4 rounded-lg mt-6 mb-4">
          <h2 class="text-lg font-semibold mb-2">Route Summary</h2>
          <p class="text-gray-400">No data available</p>
        </div>
      `;
    }
    
    try {
      // Destructure summary data
      const { customerStats, itemStats } = summaryData;
      
      // Render customer stats
      const customerStatsHTML = `
        <div>
          <h3 class="text-sm font-medium mb-1 text-blue-400">Customer Stats</h3>
          <ul class="text-sm space-y-1">
            <li class="flex items-center">
              ${renderIcon('users')}
              <span><strong>Total Customers:</strong> ${sanitizeHTML(customerStats.totalCustomers)}</span>
            </li>
            ${customerStats.areaBreakdown.map(area => `
              <li class="flex items-center">
                ${renderIcon(area.icon)}
                <span><strong>${sanitizeHTML(area.area)}:</strong> ${sanitizeHTML(area.count)} customers</span>
              </li>
            `).join('')}
            <li class="flex items-center">
              ${renderIcon('alert-circle', 'h-4 w-4 text-yellow-500 mr-2')}
              <span><strong>No Items:</strong> ${sanitizeHTML(customerStats.customersWithoutItems.count)} customers</span>
            </li>
          </ul>
        </div>
      `;
      
      // Render item stats
      const itemStatsHTML = `
        <div>
          <h3 class="text-sm font-medium mb-1 text-blue-400">Item Stats</h3>
          <ul class="text-sm space-y-1">
            <li class="flex items-center">
              ${renderIcon('package')}
              <span><strong>Total Items:</strong> ${sanitizeHTML(itemStats.totalItems)}</span>
            </li>
            ${itemStats.typeBreakdown.map(type => `
              <li class="flex items-center">
                ${renderIcon(type.icon)}
                <span><strong>${sanitizeHTML(type.type)}:</strong> ${sanitizeHTML(type.count)} items</span>
              </li>
            `).join('')}
          </ul>
        </div>
      `;
      
      // Assemble complete summary
      return `
        <div class="bg-gray-800 p-4 rounded-lg mt-6 mb-4">
          <h2 class="text-lg font-semibold mb-2">Route Summary</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${customerStatsHTML}
            ${itemStatsHTML}
          </div>
        </div>
      `;
    } catch (error) {
      console.error("Error rendering summary:", error);
      return `
        <div class="bg-gray-800 p-4 rounded-lg mt-6 mb-4">
          <h2 class="text-lg font-semibold mb-2">Route Summary</h2>
          <p class="text-red-400">Error rendering summary data</p>
        </div>
      `;
    }
  }
  
  /**
   * Render optimal route information
   */
  function renderOptimalRoute(routeData) {
    if (!Array.isArray(routeData) || routeData.length === 0) {
      return `
        <div class="bg-gray-800 p-4 rounded-lg mt-6 mb-4">
          <h2 class="text-lg font-semibold mb-2">Optimal Route</h2>
          <p class="text-gray-400">No route data available</p>
        </div>
      `;
    }
    
    try {
      // Group stops by area
      const stopsByArea = {};
      routeData.forEach(stop => {
        if (!stopsByArea[stop.area]) {
          stopsByArea[stop.area] = [];
        }
        stopsByArea[stop.area].push(stop);
      });
      
      // Generate HTML for each area
      const areaHtml = Object.entries(stopsByArea)
        .filter(([_, stops]) => stops.length > 0)
        .map(([area, stops]) => `
          <div class="mb-4">
            <h3 class="text-blue-400 text-sm font-medium mb-1">${sanitizeHTML(area)} (${stops.length} stops)</h3>
            <ol class="pl-5 list-decimal">
              ${stops.map(stop => `
                <li class="text-sm">
                  <strong>${sanitizeHTML(stop.accountName)}</strong> - 
                  <a href="https://maps.google.com/?q=${encodeURIComponent(stop.address)}" 
                     class="text-blue-400 hover:underline" target="_blank">
                    ${sanitizeHTML(stop.address)}
                  </a>
                </li>
              `).join('')}
            </ol>
          </div>
        `).join('');
      
      return `
        <div class="bg-gray-800 p-4 rounded-lg mt-6 mb-4">
          <div class="flex justify-between items-center mb-2">
            <h2 class="text-lg font-semibold">Optimal Route</h2>
            <span class="text-sm text-gray-400">${routeData.length} total stops</span>
          </div>
          ${areaHtml}
        </div>
      `;
    } catch (error) {
      console.error("Error rendering optimal route:", error);
      return `
        <div class="bg-gray-800 p-4 rounded-lg mt-6 mb-4">
          <h2 class="text-lg font-semibold mb-2">Optimal Route</h2>
          <p class="text-red-400">Error rendering route data</p>
        </div>
      `;
    }
  }
  
  // Public API
  return {
    renderSummary,
    renderOptimalRoute
  };
})();