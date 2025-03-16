/**
 * error-handler.js
 * Centralized error handling utilities for Route 33 Guide
 */

const ErrorHandler = (function() {
  // Error types for categorization
  const ERROR_TYPES = {
    CSV_PARSING: 'csv_parsing',
    DATA_PROCESSING: 'data_processing',
    STORAGE: 'storage',
    UI: 'ui',
    NETWORK: 'network',
    EXPORT: 'export',
    UNKNOWN: 'unknown'
  };
  
  // Error levels for severity
  const ERROR_LEVELS = {
    INFO: 'info', 
    WARNING: 'warning',
    ERROR: 'error',
    CRITICAL: 'critical'
  };
  
  // Store for recent errors
  const errorLog = [];
  const MAX_LOG_SIZE = 50;
  
  // Error message map for user-friendly messages
  const errorMessages = {
    [ERROR_TYPES.CSV_PARSING]: {
      default: "There was a problem reading your CSV file. Please check its format and try again.",
      missingHeaders: "Your CSV file is missing required headers. Please ensure it includes CustomerNumber, AccountName, and Address columns.",
      dataFormat: "Some data in your CSV file appears to be in an unexpected format.",
      emptyFile: "The CSV file appears to be empty."
    },
    [ERROR_TYPES.DATA_PROCESSING]: {
      default: "There was a problem processing your data.",
      invalidData: "Some data couldn't be processed correctly.",
      calculation: "There was a problem calculating summary statistics."
    },
    [ERROR_TYPES.STORAGE]: {
      default: "There was a problem saving your data.",
      quotaExceeded: "Storage space is full. Try clearing some browser data.",
      loadFailed: "Unable to load your saved data."
    },
    [ERROR_TYPES.EXPORT]: {
      default: "There was a problem generating your export.",
      pdfFailed: "PDF generation failed.",
      csvFailed: "CSV export failed."
    },
    [ERROR_TYPES.UNKNOWN]: {
      default: "An unexpected error occurred."
    }
  };
  
  /**
   * Process an error and return a standardized error object
   */
  function processError(error, type = ERROR_TYPES.UNKNOWN, level = ERROR_LEVELS.ERROR, context = {}) {
    console.error(`${type.toUpperCase()} (${level}):`, error, context);
    
    // Create standardized error object
    const errorObject = {
      type,
      level,
      timestamp: new Date().toISOString(),
      message: error.message || String(error),
      originalError: error,
      context,
      stack: error.stack,
      userMessage: getUserMessage(type, error)
    };
    
    // Log error
    logError(errorObject);
    
    return errorObject;
  }
  
  /**
   * Get a user-friendly error message based on error type and details
   */
  function getUserMessage(type, error) {
    // Start with default message for the error type
    const typeMessages = errorMessages[type] || errorMessages[ERROR_TYPES.UNKNOWN];
    let message = typeMessages.default;
    
    // Check for specific error conditions
    if (type === ERROR_TYPES.CSV_PARSING) {
      if (error.message && error.message.includes('header')) {
        message = typeMessages.missingHeaders;
      } else if (error.message && error.message.includes('format')) {
        message = typeMessages.dataFormat;
      }
    } else if (type === ERROR_TYPES.STORAGE) {
      if (error.name === 'QuotaExceededError') {
        message = typeMessages.quotaExceeded;
      }
    }
    
    return message;
  }
  
  /**
   * Add error to log, maintaining maximum size
   */
  function logError(errorObject) {
    errorLog.unshift(errorObject);
    
    // Trim log if needed
    if (errorLog.length > MAX_LOG_SIZE) {
      errorLog.pop();
    }
  }
  
  /**
   * Get recent errors from log
   */
  function getRecentErrors(count = 10) {
    return errorLog.slice(0, count);
  }
  
  /**
   * Clear error log
   */
  function clearLog() {
    errorLog.length = 0;
  }
  
  /**
   * Create UI element to display error to user
   */
  function createErrorDisplay(errorObject) {
    const { level, userMessage } = errorObject;
    
    // Set appropriate icon and color based on level
    let icon = 'alert-circle';
    let colorClass = 'bg-yellow-700';
    
    if (level === ERROR_LEVELS.ERROR || level === ERROR_LEVELS.CRITICAL) {
      icon = 'alert-triangle';
      colorClass = 'bg-red-700';
    } else if (level === ERROR_LEVELS.INFO) {
      icon = 'info';
      colorClass = 'bg-blue-700';
    }
    
    // Create HTML for error display
    return `
      <div class="error-toast fixed bottom-4 right-4 ${colorClass} text-white px-4 py-3 rounded shadow-lg z-50 flex items-center max-w-md">
        <i data-lucide="${icon}" class="h-5 w-5 mr-3 flex-shrink-0"></i>
        <span>${userMessage}</span>
        <button class="ml-3 text-white p-1 hover:bg-white hover:bg-opacity-10 rounded" onclick="this.parentElement.remove()">
          <i data-lucide="x" class="h-4 w-4"></i>
        </button>
      </div>
    `;
  }
  
  /**
   * Show error to user
   */
  function showUserError(errorObject, targetElement = document.body) {
    // If an HTML element is provided, insert error display
    if (targetElement instanceof HTMLElement) {
      const errorHTML = createErrorDisplay(errorObject);
      const tempContainer = document.createElement('div');
      tempContainer.innerHTML = errorHTML;
      const errorElement = tempContainer.firstElementChild;
      
      targetElement.appendChild(errorElement);
      
      // Initialize icons
      if (window.lucide) {
        window.lucide.createIcons();
      }
      
      // Auto-remove after timeout for non-critical errors
      if (errorObject.level !== ERROR_LEVELS.CRITICAL) {
        setTimeout(() => {
          if (errorElement.parentElement) {
            errorElement.remove();
          }
        }, 5000);
      }
      
      return errorElement;
    }
    
    // Fallback to alert for critical errors if no element provided
    if (errorObject.level === ERROR_LEVELS.CRITICAL) {
      alert(errorObject.userMessage);
    }
    
    return null;
  }
  
  // Public API
  return {
    processError,
    showUserError,
    getRecentErrors,
    clearLog,
    ERROR_TYPES,
    ERROR_LEVELS
  };
})();