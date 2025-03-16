/**
 * area-classifier.js
 * Configurable area classification system for Route 33 Guide
 */

const AreaClassifier = (function() {
  // Default area classifications - can be modified at runtime
  let areaClassifications = [
    {
      id: "shasta-ortho",
      name: "Shasta Ortho",
      patterns: ["liberty"],
      priority: 10,
      color: "#60A5FA",  // blue-400
      icon: "building-2"
    },
    {
      id: "bechelli-lane",
      name: "Bechelli Lane",
      patterns: ["bechelli"],
      priority: 20,
      color: "#34D399",  // green-400
      icon: "map-pin"
    },
    {
      id: "downtown",
      name: "Downtown",
      patterns: ["cypress", "hartnell"],
      priority: 30,
      color: "#F87171",  // red-400
      icon: "building"
    },
    {
      id: "churn-creek",
      name: "Churn Creek",
      patterns: ["churn creek"],
      priority: 40,
      color: "#FBBF24",  // yellow-400
      icon: "map-pin"
    },
    {
      id: "south-redding",
      name: "South Redding",
      patterns: ["bonnyview"],
      priority: 50,
      color: "#A78BFA",  // purple-400
      icon: "map-pin"
    },
    {
      id: "other",
      name: "Other",
      patterns: [],  // Default fallback
      priority: 1000,
      color: "#9CA3AF",  // gray-400
      icon: "map"
    }
  ];
  
  // Safe string handling
  function safeString(str) {
    return (str !== undefined && str !== null) ? String(str).trim() : "";
  }
  
  /**
   * Classify an address into an area
   */
  function classifyAddress(address) {
    try {
      const safeAddr = safeString(address).toLowerCase();
      
      // Return first matching area or the default "Other"
      for (const area of sortedAreas()) {
        if (area.patterns.some(pattern => safeAddr.includes(pattern))) {
          return area;
        }
      }
      
      // If no match found, return the "Other" area
      return getAreaById("other") || areaClassifications[areaClassifications.length - 1];
    } catch (error) {
      console.error("Error classifying address:", error);
      // Fallback to last area (should be "Other")
      return areaClassifications[areaClassifications.length - 1];
    }
  }
  
  /**
   * Get all areas in priority order
   */
  function sortedAreas() {
    return [...areaClassifications].sort((a, b) => a.priority - b.priority);
  }
  
  /**
   * Get area by ID
   */
  function getAreaById(id) {
    return areaClassifications.find(area => area.id === id);
  }
  
  /**
   * Add a new area classification
   */
  function addArea(areaConfig) {
    try {
      // Validate required fields
      if (!areaConfig.id || !areaConfig.name) {
        console.error("Area must have id and name");
        return false;
      }
      
      // Check for existing area with same ID
      if (getAreaById(areaConfig.id)) {
        console.error(`Area with id ${areaConfig.id} already exists`);
        return false;
      }
      
      // Set defaults for optional fields
      const newArea = {
        patterns: [],
        priority: 500,
        color: "#9CA3AF",
        icon: "map-pin",
        ...areaConfig
      };
      
      // Add to classifications
      areaClassifications.push(newArea);
      return true;
    } catch (error) {
      console.error("Error adding area:", error);
      return false;
    }
  }
  
  /**
   * Update an existing area
   */
  function updateArea(id, updates) {
    try {
      const areaIndex = areaClassifications.findIndex(area => area.id === id);
      
      if (areaIndex === -1) {
        console.error(`Area with id ${id} not found`);
        return false;
      }
      
      // Don't allow changing the id
      const { id: _, ...allowedUpdates } = updates;
      
      // Update area
      areaClassifications[areaIndex] = {
        ...areaClassifications[areaIndex],
        ...allowedUpdates
      };
      
      return true;
    } catch (error) {
      console.error("Error updating area:", error);
      return false;
    }
  }
  
  /**
   * Remove an area
   */
  function removeArea(id) {
    try {
      // Don't allow removing the "other" catchall area
      if (id === "other") {
        console.error("Cannot remove 'other' area");
        return false;
      }
      
      const initialLength = areaClassifications.length;
      areaClassifications = areaClassifications.filter(area => area.id !== id);
      
      return areaClassifications.length !== initialLength;
    } catch (error) {
      console.error("Error removing area:", error);
      return false;
    }
  }
  
  /**
   * Reset areas to default
   */
  function resetToDefaults() {
    try {
      // Call the function again to reinitialize with closure defaults
      areaClassifications = [
        {
          id: "shasta-ortho",
          name: "Shasta Ortho",
          patterns: ["liberty"],
          priority: 10,
          color: "#60A5FA",
          icon: "building-2"
        },
        {
          id: "bechelli-lane",
          name: "Bechelli Lane",
          patterns: ["bechelli"],
          priority: 20,
          color: "#34D399",
          icon: "map-pin"
        },
        {
          id: "downtown",
          name: "Downtown",
          patterns: ["cypress", "hartnell"],
          priority: 30,
          color: "#F87171",
          icon: "building"
        },
        {
          id: "churn-creek",
          name: "Churn Creek",
          patterns: ["churn creek"],
          priority: 40,
          color: "#FBBF24",
          icon: "map-pin"
        },
        {
          id: "south-redding",
          name: "South Redding",
          patterns: ["bonnyview"],
          priority: 50,
          color: "#A78BFA",
          icon: "map-pin"
        },
        {
          id: "other",
          name: "Other",
          patterns: [],
          priority: 1000,
          color: "#9CA3AF",
          icon: "map"
        }
      ];
      
      return true;
    } catch (error) {
      console.error("Error resetting areas:", error);
      return false;
    }
  }
  
  /**
   * Get a list of all areas
   */
  function getAllAreas() {
    return [...areaClassifications];
  }
  
  /**
   * Get only area names in priority order
   */
  function getAreaNames() {
    return sortedAreas().map(area => area.name);
  }
  
  /**
   * Import area configurations (useful for user-defined configurations)
   */
  function importAreaConfig(configArray) {
    try {
      if (!Array.isArray(configArray)) {
        console.error("Area configuration must be an array");
        return false;
      }
      
      // Validate configuration
      const validConfig = configArray.every(area => {
        return area.id && area.name && Array.isArray(area.patterns);
      });
      
      if (!validConfig) {
        console.error("Invalid area configuration format");
        return false;
      }
      
      // Check that "other" area is included
      const hasOther = configArray.some(area => area.id === "other");
      if (!hasOther) {
        console.error("Area configuration must include an 'other' area");
        return false;
      }
      
      // Replace existing configuration
      areaClassifications = [...configArray];
      return true;
    } catch (error) {
      console.error("Error importing area configuration:", error);
      return false;
    }
  }
  
  /**
   * Export current area configuration
   */
  function exportAreaConfig() {
    return [...areaClassifications];
  }
  
  /**
   * Render area configuration UI
   */
  function renderAreaConfigUI() {
    const areas = sortedAreas();
    
    let html = `
      <div class="bg-gray-800 p-4 rounded-lg">
        <h2 class="text-lg font-semibold mb-4">Area Configuration</h2>
        <div class="space-y-4">
    `;
    
    // Add each area
    areas.forEach(area => {
      html += `
        <div class="p-3 bg-gray-700 rounded-lg" data-area-id="${area.id}">
          <div class="flex justify-between items-center mb-2">
            <div class="flex items-center">
              <div class="w-4 h-4 rounded-full mr-2" style="background-color: ${area.color}"></div>
              <h3 class="font-medium">${area.name}</h3>
            </div>
            <div class="flex items-center">
              <span class="text-xs text-gray-400 mr-2">Priority: ${area.priority}</span>
              ${area.id !== "other" ? `
                <button class="p-1 hover:bg-gray-600 rounded edit-area-btn">
                  <i data-lucide="edit" class="h-4 w-4"></i>
                </button>
                <button class="p-1 hover:bg-gray-600 rounded ml-1 delete-area-btn">
                  <i data-lucide="trash-2" class="h-4 w-4"></i>
                </button>
              ` : ''}
            </div>
          </div>
          <div class="mt-2">
            <div class="text-sm text-gray-400 mb-1">Address patterns:</div>
            <div class="flex flex-wrap gap-1">
              ${area.patterns.length > 0 ? area.patterns.map(pattern => `
                <span class="px-2 py-0.5 bg-gray-600 rounded-full text-xs">${pattern}</span>
              `).join('') : `<span class="text-sm text-gray-500">No patterns (default catchall)</span>`}
            </div>
          </div>
        </div>
      `;
    });
    
    // Add button to create new area
    html += `
      </div>
      <div class="mt-4">
        <button id="add-area-btn" class="px-3 py-1.5 bg-blue-600 rounded text-sm flex items-center gap-1">
          <i data-lucide="plus" class="h-4 w-4"></i>
          Add New Area
        </button>
      </div>
      <div class="mt-2">
        <button id="reset-areas-btn" class="px-3 py-1.5 bg-gray-700 rounded text-sm flex items-center gap-1">
          <i data-lucide="refresh-cw" class="h-4 w-4"></i>
          Reset to Defaults
        </button>
      </div>
    </div>
    `;
    
    return html;
  }
  
  // Public API
  return {
    classifyAddress,
    sortedAreas,
    getAreaById,
    addArea,
    updateArea,
    removeArea,
    resetToDefaults,
    getAllAreas,
    getAreaNames,
    importAreaConfig,
    exportAreaConfig,
    renderAreaConfigUI
  };
})();
          