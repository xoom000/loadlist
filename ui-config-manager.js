/**
 * ui-config-manager.js
 * Manages UI configuration and theming for Route 33 Guide
 */

const UIConfigManager = (function() {
  // Default configuration
  const defaultConfig = {
    theme: {
      mode: 'dark',
      colors: {
        primary: '#3B82F6',      // blue-500
        secondary: '#10B981',    // emerald-500
        background: '#111827',   // gray-900
        surface: '#1F2937',      // gray-800
        text: {
          primary: '#F9FAFB',    // gray-50
          secondary: '#9CA3AF'   // gray-400
        },
        border: '#374151',       // gray-700
        success: '#34D399',      // emerald-400
        warning: '#FBBF24',      // amber-400
        error: '#F87171',        // red-400
        info: '#60A5FA'          // blue-400
      },
      fonts: {
        body: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        heading: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        monospace: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
      },
      spacing: {
        unit: 4,
        container: {
          padding: 16,
          maxWidth: 1024
        }
      },
      borderRadius: {
        sm: 2,
        md: 4,
        lg: 8,
        full: 9999
      },
      animations: {
        duration: {
          fast: 100,
          normal: 300,
          slow: 500
        },
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
      }
    },
    
    layout: {
      navbarHeight: 64,
      sidebarWidth: 250,
      enableSidebar: false,
      headerFixed: true
    },
    
    features: {
      enableExport: true,
      enableImport: true,
      enableReset: true,
      enableSearch: true,
      enableFilter: true,
      enableEditing: true,
      enableCommunication: true,
      enableNavigation: true,
      enablePrint: true
    },
    
    views: {
      summary: {
        enabled: true,
        default: true,
        components: ['progress', 'route-summary', 'area-breakdown']
      },
      detailed: {
        enabled: true,
        default: false,
        components: ['progress', 'customer-details', 'item-list']
      },
      map: {
        enabled: false,
        default: false,
        components: ['map-view', 'stop-list']
      }
    },
    
    sections: {
      quickReference: {
        enabled: true,
        editable: true,
        collapsible: false
      },
      driverTips: {
        enabled: true,
        editable: true,
        collapsible: true
      }
    },
    
    communications: {
      phone: {
        enabled: true,
        label: 'Call',
        icon: 'phone',
        protocol: 'tel:',
        defaultValue: '555-123-4567'
      },
      sms: {
        enabled: true,
        label: 'Text',
        icon: 'message-square',
        protocol: 'sms:',
        defaultValue: '555-123-4567'
      },
      email: {
        enabled: false,
        label: 'Email',
        icon: 'mail',
        protocol: 'mailto:',
        defaultValue: 'support@example.com'
      }
    },
    
    branding: {
      title: 'Route 33 - Dynamic Guide',
      subtitle: 'Friday Guide',
      routeNumber: '33',
      footer: 'Route 33 Friday Guide v1.0 | Created for Josh',
      logoUrl: null
    }
  };
  
  // Current configuration (initialized to default)
  let currentConfig = JSON.parse(JSON.stringify(defaultConfig));
  
  /**
   * Get current UI configuration
   */
  function getConfig() {
    return JSON.parse(JSON.stringify(currentConfig));
  }
  
  /**
   * Update UI configuration
   */
  function updateConfig(configUpdates, shouldMerge = true) {
    try {
      if (shouldMerge) {
        // Deep merge configuration updates
        currentConfig = deepMerge(currentConfig, configUpdates);
      } else {
        // Replace entire configuration
        currentConfig = JSON.parse(JSON.stringify(configUpdates));
      }
      
      // Apply configuration to UI
      applyConfig();
      
      return true;
    } catch (error) {
      console.error("Error updating UI configuration:", error);
      return false;
    }
  }
  
  /**
   * Reset configuration to defaults
   */
  function resetConfig() {
    currentConfig = JSON.parse(JSON.stringify(defaultConfig));
    applyConfig();
    return true;
  }
  
  /**
   * Apply the current configuration to the UI
   */
  function applyConfig() {
    try {
      const { theme, branding } = currentConfig;
      
      // Update document title
      document.title = branding.title;
      
      // Apply theme
      applyTheme(theme);
      
      // Update layout
      applyLayout(currentConfig.layout);
      
      // Update feature visibility
      applyFeatureVisibility(currentConfig.features);
      
      // Trigger event for component updates
      triggerConfigUpdate();
      
      return true;
    } catch (error) {
      console.error("Error applying UI configuration:", error);
      return false;
    }
  }
  
  /**
   * Apply theme to CSS variables
   */
  function applyTheme(theme) {
    const root = document.documentElement;
    
    // Apply colors
    const { colors } = theme;
    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-secondary', colors.secondary);
    root.style.setProperty('--color-background', colors.background);
    root.style.setProperty('--color-surface', colors.surface);
    root.style.setProperty('--color-text-primary', colors.text.primary);
    root.style.setProperty('--color-text-secondary', colors.text.secondary);
    root.style.setProperty('--color-border', colors.border);
    root.style.setProperty('--color-success', colors.success);
    root.style.setProperty('--color-warning', colors.warning);
    root.style.setProperty('--color-error', colors.error);
    root.style.setProperty('--color-info', colors.info);
    
    // Apply fonts
    root.style.setProperty('--font-body', theme.fonts.body);
    root.style.setProperty('--font-heading', theme.fonts.heading);
    root.style.setProperty('--font-mono', theme.fonts.monospace);
    
    // Apply spacing
    root.style.setProperty('--spacing-unit', `${theme.spacing.unit}px`);
    root.style.setProperty('--container-padding', `${theme.spacing.container.padding}px`);
    root.style.setProperty('--container-max-width', `${theme.spacing.container.maxWidth}px`);
    
    // Apply border radius
    root.style.setProperty('--border-radius-sm', `${theme.borderRadius.sm}px`);
    root.style.setProperty('--border-radius-md', `${theme.borderRadius.md}px`);
    root.style.setProperty('--border-radius-lg', `${theme.borderRadius.lg}px`);
    root.style.setProperty('--border-radius-full', `${theme.borderRadius.full}px`);
    
    // Apply animations
    root.style.setProperty('--animation-duration-fast', `${theme.animations.duration.fast}ms`);
    root.style.setProperty('--animation-duration-normal', `${theme.animations.duration.normal}ms`);
    root.style.setProperty('--animation-duration-slow', `${theme.animations.duration.slow}ms`);
    root.style.setProperty('--animation-easing', theme.animations.easing);
    
    // Apply theme mode class
    if (theme.mode === 'dark') {
      document.body.classList.add('theme-dark');
      document.body.classList.remove('theme-light');
    } else {
      document.body.classList.add('theme-light');
      document.body.classList.remove('theme-dark');
    }
  }
  
  /**
   * Apply layout configuration
   */
  function applyLayout(layout) {
    const root = document.documentElement;
    
    // Apply layout variables
    root.style.setProperty('--navbar-height', `${layout.navbarHeight}px`);
    root.style.setProperty('--sidebar-width', `${layout.sidebarWidth}px`);
    
    // Apply layout classes
    if (layout.headerFixed) {
      document.body.classList.add('header-fixed');
    } else {
      document.body.classList.remove('header-fixed');
    }
    
    if (layout.enableSidebar) {
      document.body.classList.add('sidebar-enabled');
    } else {
      document.body.classList.remove('sidebar-enabled');
    }
  }
  
  /**
   * Apply feature visibility
   */
  function applyFeatureVisibility(features) {
    // This updates CSS classes that control visibility of feature elements
    const featureClassMap = {
      enableExport: 'feature-export',
      enableImport: 'feature-import',
      enableReset: 'feature-reset',
      enableSearch: 'feature-search',
      enableFilter: 'feature-filter',
      enableEditing: 'feature-editing',
      enableCommunication: 'feature-communication',
      enableNavigation: 'feature-navigation',
      enablePrint: 'feature-print'
    };
    
    Object.entries(features).forEach(([feature, enabled]) => {
      if (featureClassMap[feature]) {
        if (enabled) {
          document.body.classList.add(featureClassMap[feature]);
        } else {
          document.body.classList.remove(featureClassMap[feature]);
        }
      }
    });
  }
  
  /**
   * Trigger an event to notify components of configuration changes
   */
  function triggerConfigUpdate() {
    const event = new CustomEvent('uiconfig:updated', {
      detail: { config: currentConfig }
    });
    document.dispatchEvent(event);
  }
  
  /**
   * Generate a CSS styles object that can be used to generate a stylesheet
   */
  function generateStylesheet() {
    const { theme } = currentConfig;
    
    // Build CSS rules
    return `
      :root {
        /* Colors */
        --color-primary: ${theme.colors.primary};
        --color-secondary: ${theme.colors.secondary};
        --color-background: ${theme.colors.background};
        --color-surface: ${theme.colors.surface};
        --color-text-primary: ${theme.colors.text.primary};
        --color-text-secondary: ${theme.colors.text.secondary};
        --color-border: ${theme.colors.border};
        --color-success: ${theme.colors.success};
        --color-warning: ${theme.colors.warning};
        --color-error: ${theme.colors.error};
        --color-info: ${theme.colors.info};
        
        /* Fonts */
        --font-body: ${theme.fonts.body};
        --font-heading: ${theme.fonts.heading};
        --font-mono: ${theme.fonts.monospace};
        
        /* Spacing */
        --spacing-unit: ${theme.spacing.unit}px;
        --container-padding: ${theme.spacing.container.padding}px;
        --container-max-width: ${theme.spacing.container.maxWidth}px;
        
        /* Border Radius */
        --border-radius-sm: ${theme.borderRadius.sm}px;
        --border-radius-md: ${theme.borderRadius.md}px;
        --border-radius-lg: ${theme.borderRadius.lg}px;
        --border-radius-full: ${theme.borderRadius.full}px;
        
        /* Animations */
        --animation-duration-fast: ${theme.animations.duration.fast}ms;
        --animation-duration-normal: ${theme.animations.duration.normal}ms;
        --animation-duration-slow: ${theme.animations.duration.slow}ms;
        --animation-easing: ${theme.animations.easing};
        
        /* Layout */
        --navbar-height: ${currentConfig.layout.navbarHeight}px;
        --sidebar-width: ${currentConfig.layout.sidebarWidth}px;
      }
      
      /* Base styles */
      body {
        font-family: var(--font-body);
        background-color: var(--color-background);
        color: var(--color-text-primary);
        margin: 0;
        padding: 0;
      }
      
      .theme-dark {
        color-scheme: dark;
      }
      
      .theme-light {
        color-scheme: light;
      }
      
      /* Layout components */
      .header-fixed .app-header {
        position: sticky;
        top: 0;
        z-index: 100;
      }
      
      .sidebar-enabled .app-main {
        margin-left: var(--sidebar-width);
      }
      
      .sidebar-enabled .app-sidebar {
        display: block;
      }
      
      /* Typography */
      h1, h2, h3, h4, h5, h6 {
        font-family: var(--font-heading);
      }
      
      /* Container */
      .container {
        max-width: var(--container-max-width);
        padding-left: var(--container-padding);
        padding-right: var(--container-padding);
        margin-left: auto;
        margin-right: auto;
      }
      
      /* Feature visibility */
      body:not(.feature-export) .export-feature,
      body:not(.feature-import) .import-feature,
      body:not(.feature-reset) .reset-feature,
      body:not(.feature-search) .search-feature,
      body:not(.feature-filter) .filter-feature,
      body:not(.feature-editing) .editing-feature,
      body:not(.feature-communication) .communication-feature,
      body:not(.feature-navigation) .navigation-feature,
      body:not(.feature-print) .print-feature {
        display: none !important;
      }
      
      /* Print styles */
      @media print {
        .no-print {
          display: none !important;
        }
        
        body {
          background-color: white;
          color: black;
        }
      }
    `;
  }
  
  /**
   * Save configuration to localStorage
   */
  function saveConfigToStorage() {
    try {
      localStorage.setItem('route33_ui_config', JSON.stringify(currentConfig));
      return true;
    } catch (error) {
      console.error("Error saving UI configuration:", error);
      return false;
    }
  }
  
  /**
   * Load configuration from localStorage
   */
  function loadConfigFromStorage() {
    try {
      const savedConfig = localStorage.getItem('route33_ui_config');
      if (savedConfig) {
        currentConfig = JSON.parse(savedConfig);
        applyConfig();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error loading UI configuration:", error);
      return false;
    }
  }
  
  /**
   * Export configuration to JSON
   */
  function exportConfig() {
    return JSON.stringify(currentConfig, null, 2);
  }
  
  /**
   * Import configuration from JSON
   */
  function importConfig(configJson) {
    try {
      const newConfig = JSON.parse(configJson);
      updateConfig(newConfig, false);
      return true;
    } catch (error) {
      console.error("Error importing UI configuration:", error);
      return false;
    }
  }
  
  /**
   * Utility: Deep merge objects
   */
  function deepMerge(target, source) {
    const output = { ...target };
    
    if (isObject(target) && isObject(source)) {
      Object.keys(source).forEach(key => {
        if (isObject(source[key])) {
          if (!(key in target)) {
            output[key] = source[key];
          } else {
            output[key] = deepMerge(target[key], source[key]);
          }
        } else {
          output[key] = source[key];
        }
      });
    }
    
    return output;
  }
  
  /**
   * Utility: Check if value is object
   */
  function isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
  }
  
  /**
   * Render settings UI
   */
  function renderConfigUI() {
    const config = getConfig();
    
    return `
      <div class="bg-gray-800 p-4 rounded-lg">
        <h2 class="text-lg font-semibold mb-4">UI Settings</h2>
        
        <div class="mb-4">
          <h3 class="text-sm font-medium mb-2 text-blue-400">Theme</h3>
          <div class="flex items-center gap-4">
            <label class="flex items-center cursor-pointer">
              <input type="radio" name="theme-mode" value="dark" class="mr-2" ${config.theme.mode === 'dark' ? 'checked' : ''}>
              Dark Mode
            </label>
            <label class="flex items-center cursor-pointer">
              <input type="radio" name="theme-mode" value="light" class="mr-2" ${config.theme.mode === 'light' ? 'checked' : ''}>
              Light Mode
            </label>
          </div>
        </div>
        
        <div class="mb-4">
          <h3 class="text-sm font-medium mb-2 text-blue-400">Features</h3>
          <div class="grid grid-cols-2 gap-2">
            ${Object.entries(config.features).map(([feature, enabled]) => `
              <label class="flex items-center cursor-pointer">
                <input type="checkbox" name="feature-${feature}" ${enabled ? 'checked' : ''} class="mr-2">
                ${feature.replace('enable', '')}
              </label>
            `).join('')}
          </div>
        </div>
        
        <div class="mb-4">
          <h3 class="text-sm font-medium mb-2 text-blue-400">Branding</h3>
          <div class="grid grid-cols-1 gap-2">
            <label class="block">
              <span class="text-sm text-gray-400">Title</span>
              <input type="text" value="${config.branding.title}" class="mt-1 block w-full bg-gray-700 border-gray-600 rounded">
            </label>
            <label class="block">
              <span class="text-sm text-gray-400">Subtitle</span>
              <input type="text" value="${config.branding.subtitle}" class="mt-1 block w-full bg-gray-700 border-gray-600 rounded">
            </label>
            <label class="block">
              <span class="text-sm text-gray-400">Route Number</span>
              <input type="text" value="${config.branding.routeNumber}" class="mt-1 block w-full bg-gray-700 border-gray-600 rounded">
            </label>
          </div>
        </div>
        
        <div class="flex justify-end gap-2 mt-4">
          <button id="reset-config-btn" class="px-3 py-1.5 bg-gray-700 rounded text-sm">
            Reset to Defaults
          </button>
          <button id="save-config-btn" class="px-3 py-1.5 bg-blue-600 rounded text-sm">
            Save Changes
          </button>
        </div>
      </div>
    `;
  }
  
  // Public API
  return {
    getConfig,
    updateConfig,
    resetConfig,
    applyConfig,
    generateStylesheet,
    saveConfigToStorage,
    loadConfigFromStorage,
    exportConfig,
    importConfig,
    renderConfigUI
  };
})();