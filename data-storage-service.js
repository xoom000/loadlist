/**
 * data-storage-service.js
 * Handles data persistence for the Route 33 Guide
 * Supports multiple storage backends (localStorage, IndexedDB, etc.)
 */

const DataStorageService = (function() {
  // Storage backend types
  const STORAGE_TYPES = {
    LOCAL_STORAGE: 'localStorage',
    INDEXED_DB: 'indexedDB',
    MEMORY: 'memory',
    SESSION_STORAGE: 'sessionStorage'
  };
  
  // Default configuration
  const defaultConfig = {
    storageType: STORAGE_TYPES.LOCAL_STORAGE,
    namespace: 'route33_',
    useCompression: false,
    backupFrequency: 5 * 60 * 1000  // 5 minutes
  };
  
  // Current configuration
  let config = { ...defaultConfig };
  
  // In-memory cache
  const memoryStorage = new Map();
  
  // Storage statistics
  let stats = {
    reads: 0,
    writes: 0,
    errors: 0,
    lastOperation: null,
    totalBytes: 0
  };
  
  // IndexedDB connection
  let dbConnection = null;
  
  /**
   * Initialize the storage service
   */
  async function init(customConfig = {}) {
    try {
      // Update config with custom settings
      config = { ...defaultConfig, ...customConfig };
      
      // Initialize storage backend
      switch (config.storageType) {
        case STORAGE_TYPES.INDEXED_DB:
          await initIndexedDB();
          break;
        case STORAGE_TYPES.LOCAL_STORAGE:
        case STORAGE_TYPES.SESSION_STORAGE:
        case STORAGE_TYPES.MEMORY:
          // These don't need initialization
          break;
        default:
          console.error(`Unknown storage type: ${config.storageType}`);
          throw new Error(`Unknown storage type: ${config.storageType}`);
      }
      
      // Start backup scheduler if using localStorage or sessionStorage
      if (config.storageType === STORAGE_TYPES.LOCAL_STORAGE || 
          config.storageType === STORAGE_TYPES.SESSION_STORAGE) {
        scheduleBackups();
      }
      
      return true;
    } catch (error) {
      console.error("Error initializing storage service:", error);
      stats.errors++;
      stats.lastOperation = {
        type: 'init',
        error: error.message,
        timestamp: new Date().toISOString()
      };
      
      return false;
    }
  }
  
  /**
   * Initialize IndexedDB for storage
   */
  async function initIndexedDB() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error("IndexedDB is not supported in this browser"));
        return;
      }
      
      const request = indexedDB.open(`${config.namespace}db`, 1);
      
      request.onerror = (event) => {
        console.error("IndexedDB error:", event.target.error);
        reject(new Error("Failed to open IndexedDB connection"));
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        // Create object store for route data
        if (!db.objectStoreNames.contains('routeData')) {
          db.createObjectStore('routeData', { keyPath: 'key' });
        }
      };
      
      request.onsuccess = (event) => {
        dbConnection = event.target.result;
        console.log("IndexedDB initialized successfully");
        resolve(true);
      };
    });
  }
  
  /**
   * Schedule regular backups
   */
  function scheduleBackups() {
    // Clear any existing backup schedule
    if (window._backupTimer) {
      clearInterval(window._backupTimer);
    }
    
    // Set up new backup schedule
    window._backupTimer = setInterval(() => {
      backupData();
    }, config.backupFrequency);
    
    // Also backup on page unload
    window.addEventListener('beforeunload', backupData);
  }
  
  /**
   * Backup all data to a single compressed storage item
   */
  async function backupData() {
    try {
      // Only relevant for localStorage/sessionStorage
      if (config.storageType !== STORAGE_TYPES.LOCAL_STORAGE && 
          config.storageType !== STORAGE_TYPES.SESSION_STORAGE) {
        return;
      }
      
      // Get all data from storage
      const storageInterface = config.storageType === STORAGE_TYPES.LOCAL_STORAGE ? 
        localStorage : sessionStorage;
      
      const allData = {};
      const keyPrefix = config.namespace;
      
      // Collect all items with our namespace
      for (let i = 0; i < storageInterface.length; i++) {
        const key = storageInterface.key(i);
        if (key.startsWith(keyPrefix)) {
          try {
            const value = storageInterface.getItem(key);
            allData[key] = value;
          } catch (e) {
            console.warn(`Could not read item ${key} for backup`, e);
          }
        }
      }
      
      // Store the backup
      const backupKey = `${keyPrefix}backup_${new Date().toISOString()}`;
      const serialized = JSON.stringify(allData);
      
      // Compress if configured to do so
      let backupData;
      if (config.useCompression && window.pako) {
        backupData = window.pako.deflate(serialized, { to: 'string' });
      } else {
        backupData = serialized;
      }
      
      storageInterface.setItem(backupKey, backupData);
      
      // Remove old backups (keep only the last 3)
      const backupKeys = [];
      for (let i = 0; i < storageInterface.length; i++) {
        const key = storageInterface.key(i);
        if (key.startsWith(`${keyPrefix}backup_`)) {
          backupKeys.push(key);
        }
      }
      
      // Sort by date (newest first) and remove old ones
      backupKeys.sort().reverse();
      for (let i = 3; i < backupKeys.length; i++) {
        storageInterface.removeItem(backupKeys[i]);
      }
      
      return true;
    } catch (error) {
      console.error("Error creating backup:", error);
      stats.errors++;
      stats.lastOperation = {
        type: 'backup',
        error: error.message,
        timestamp: new Date().toISOString()
      };
      
      return false;
    }
  }
  
  /**
   * Store data in the configured storage backend
   */
  async function storeData(key, data) {
    try {
      const fullKey = `${config.namespace}${key}`;
      const serializedData = JSON.stringify(data);
      const dataSize = serializedData.length * 2; // Approximate size in bytes
      
      switch (config.storageType) {
        case STORAGE_TYPES.LOCAL_STORAGE:
          localStorage.setItem(fullKey, serializedData);
          break;
        
        case STORAGE_TYPES.SESSION_STORAGE:
          sessionStorage.setItem(fullKey, serializedData);
          break;
        
        case STORAGE_TYPES.MEMORY:
          memoryStorage.set(fullKey, data);
          break;
        
        case STORAGE_TYPES.INDEXED_DB:
          await storeInIndexedDB(fullKey, data);
          break;
        
        default:
          throw new Error(`Unsupported storage type: ${config.storageType}`);
      }
      
      // Update stats
      stats.writes++;
      stats.totalBytes += dataSize;
      stats.lastOperation = {
        type: 'write',
        key: fullKey,
        size: dataSize,
        timestamp: new Date().toISOString()
      };
      
      return true;
    } catch (error) {
      console.error(`Error storing data for key ${key}:`, error);
      stats.errors++;
      stats.lastOperation = {
        type: 'write',
        key: `${config.namespace}${key}`,
        error: error.message,
        timestamp: new Date().toISOString()
      };
      
      // Handle quota exceeded errors
      if (error.name === 'QuotaExceededError' || 
          error.message.includes('quota') ||
          error.message.includes('storage')) {
        // Try to free up space
        await clearOldData();
        
        // If using localStorage, try to fall back to IndexedDB
        if (config.storageType === STORAGE_TYPES.LOCAL_STORAGE && 
            window.indexedDB) {
          console.warn("Storage quota exceeded. Attempting to use IndexedDB as fallback.");
          config.storageType = STORAGE_TYPES.INDEXED_DB;
          await initIndexedDB();
          return storeData(key, data);
        }
      }
      
      return false;
    }
  }
  
  /**
   * Store data in IndexedDB
   */
  async function storeInIndexedDB(key, data) {
    return new Promise((resolve, reject) => {
      if (!dbConnection) {
        reject(new Error("IndexedDB not initialized"));
        return;
      }
      
      try {
        const transaction = dbConnection.transaction(['routeData'], 'readwrite');
        const store = transaction.objectStore('routeData');
        
        const request = store.put({
          key,
          data,
          timestamp: new Date().toISOString()
        });
        
        request.onsuccess = () => resolve(true);
        request.onerror = (event) => reject(event.target.error);
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Retrieve data from the configured storage backend
   */
  async function retrieveData(key) {
    try {
      const fullKey = `${config.namespace}${key}`;
      let result;
      
      switch (config.storageType) {
        case STORAGE_TYPES.LOCAL_STORAGE:
          const lsData = localStorage.getItem(fullKey);
          result = lsData ? JSON.parse(lsData) : null;
          break;
        
        case STORAGE_TYPES.SESSION_STORAGE:
          const ssData = sessionStorage.getItem(fullKey);
          result = ssData ? JSON.parse(ssData) : null;
          break;
        
        case STORAGE_TYPES.MEMORY:
          result = memoryStorage.get(fullKey);
          break;
        
        case STORAGE_TYPES.INDEXED_DB:
          result = await retrieveFromIndexedDB(fullKey);
          break;
        
        default:
          throw new Error(`Unsupported storage type: ${config.storageType}`);
      }
      
      // Update stats
      stats.reads++;
      stats.lastOperation = {
        type: 'read',
        key: fullKey,
        timestamp: new Date().toISOString()
      };
      
      return result;
    } catch (error) {
      console.error(`Error retrieving data for key ${key}:`, error);
      stats.errors++;
      stats.lastOperation = {
        type: 'read',
        key: `${config.namespace}${key}`,
        error: error.message,
        timestamp: new Date().toISOString()
      };
      
      return null;
    }
  }
  
  /**
   * Retrieve data from IndexedDB
   */
  async function retrieveFromIndexedDB(key) {
    return new Promise((resolve, reject) => {
      if (!dbConnection) {
        reject(new Error("IndexedDB not initialized"));
        return;
      }
      
      try {
        const transaction = dbConnection.transaction(['routeData'], 'readonly');
        const store = transaction.objectStore('routeData');
        
        const request = store.get(key);
        
        request.onsuccess = (event) => {
          const result = event.target.result;
          resolve(result ? result.data : null);
        };
        
        request.onerror = (event) => reject(event.target.error);
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Remove data from storage
   */
  async function removeData(key) {
    try {
      const fullKey = `${config.namespace}${key}`;
      
      switch (config.storageType) {
        case STORAGE_TYPES.LOCAL_STORAGE:
          localStorage.removeItem(fullKey);
          break;
        
        case STORAGE_TYPES.SESSION_STORAGE:
          sessionStorage.removeItem(fullKey);
          break;
        
        case STORAGE_TYPES.MEMORY:
          memoryStorage.delete(fullKey);
          break;
        
        case STORAGE_TYPES.INDEXED_DB:
          await removeFromIndexedDB(fullKey);
          break;
        
        default:
          throw new Error(`Unsupported storage type: ${config.storageType}`);
      }
      
      // Update stats
      stats.lastOperation = {
        type: 'remove',
        key: fullKey,
        timestamp: new Date().toISOString()
      };
      
      return true;
    } catch (error) {
      console.error(`Error removing data for key ${key}:`, error);
      stats.errors++;
      stats.lastOperation = {
        type: 'remove',
        key: `${config.namespace}${key}`,
        error: error.message,
        timestamp: new Date().toISOString()
      };
      
      return false;
    }
  }
  
  /**
   * Remove data from IndexedDB
   */
  async function removeFromIndexedDB(key) {
    return new Promise((resolve, reject) => {
      if (!dbConnection) {
        reject(new Error("IndexedDB not initialized"));
        return;
      }
      
      try {
        const transaction = dbConnection.transaction(['routeData'], 'readwrite');
        const store = transaction.objectStore('routeData');
        
        const request = store.delete(key);
        
        request.onsuccess = () => resolve(true);
        request.onerror = (event) => reject(event.target.error);
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Clear all data with this namespace
   */
  async function clearAllData() {
    try {
      switch (config.storageType) {
        case STORAGE_TYPES.LOCAL_STORAGE:
        case STORAGE_TYPES.SESSION_STORAGE:
          const storageInterface = config.storageType === STORAGE_TYPES.LOCAL_STORAGE ? 
            localStorage : sessionStorage;
          
          // Get all keys with our namespace
          const keysToRemove = [];
          for (let i = 0; i < storageInterface.length; i++) {
            const key = storageInterface.key(i);
            if (key.startsWith(config.namespace)) {
              keysToRemove.push(key);
            }
          }
          
          // Remove all keys
          keysToRemove.forEach(key => {
            storageInterface.removeItem(key);
          });
          break;
        
        case STORAGE_TYPES.MEMORY:
          // Clear memory storage for our namespace
          for (const key of memoryStorage.keys()) {
            if (key.startsWith(config.namespace)) {
              memoryStorage.delete(key);
            }
          }
          break;
        
        case STORAGE_TYPES.INDEXED_DB:
          await clearIndexedDB();
          break;
        
        default:
          throw new Error(`Unsupported storage type: ${config.storageType}`);
      }
      
      // Update stats
      stats.lastOperation = {
        type: 'clear',
        timestamp: new Date().toISOString()
      };
      
      return true;
    } catch (error) {
      console.error("Error clearing all data:", error);
      stats.errors++;
      stats.lastOperation = {
        type: 'clear',
        error: error.message,
        timestamp: new Date().toISOString()
      };
      
      return false;
    }
  }
  
  /**
   * Clear all data in IndexedDB
   */
  async function clearIndexedDB() {
    return new Promise((resolve, reject) => {
      if (!dbConnection) {
        reject(new Error("IndexedDB not initialized"));
        return;
      }
      
      try {
        const transaction = dbConnection.transaction(['routeData'], 'readwrite');
        const store = transaction.objectStore('routeData');
        
        const request = store.clear();
        
        request.onsuccess = () => resolve(true);
        request.onerror = (event) => reject(event.target.error);
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Clear old or less important data to free up space
   */
  async function clearOldData() {
    try {
      // Strategy: Remove all backups except the most recent one
      switch (config.storageType) {
        case STORAGE_TYPES.LOCAL_STORAGE:
        case STORAGE_TYPES.SESSION_STORAGE:
          const storageInterface = config.storageType === STORAGE_TYPES.LOCAL_STORAGE ? 
            localStorage : sessionStorage;
          
          // Find backup keys
          const backupKeys = [];
          for (let i = 0; i < storageInterface.length; i++) {
            const key = storageInterface.key(i);
            if (key.startsWith(`${config.namespace}backup_`)) {
              backupKeys.push(key);
            }
          }
          
          // Sort by date (newest first) and remove all but the most recent
          backupKeys.sort().reverse();
          for (let i = 1; i < backupKeys.length; i++) {
            storageInterface.removeItem(backupKeys[i]);
          }
          break;
          
        case STORAGE_TYPES.INDEXED_DB:
          // No specific cleanup for IndexedDB yet
          break;
          
        case STORAGE_TYPES.MEMORY:
          // Memory storage doesn't need cleanup
          break;
      }
      
      return true;
    } catch (error) {
      console.error("Error clearing old data:", error);
      return false;
    }
  }
  
  /**
   * Get storage statistics
   */
  function getStats() {
    // Update total storage usage
    try {
      let totalSize = 0;
      
      switch (config.storageType) {
        case STORAGE_TYPES.LOCAL_STORAGE:
        case STORAGE_TYPES.SESSION_STORAGE:
          const storageInterface = config.storageType === STORAGE_TYPES.LOCAL_STORAGE ? 
            localStorage : sessionStorage;
          
          for (let i = 0; i < storageInterface.length; i++) {
            const key = storageInterface.key(i);
            if (key.startsWith(config.namespace)) {
              const value = storageInterface.getItem(key);
              totalSize += (key.length + value.length) * 2; // Approximate size in bytes
            }
          }
          break;
          
        case STORAGE_TYPES.MEMORY:
          for (const [key, value] of memoryStorage.entries()) {
            if (key.startsWith(config.namespace)) {
              totalSize += key.length * 2 + JSON.stringify(value).length * 2;
            }
          }
          break;
          
        case STORAGE_TYPES.INDEXED_DB:
          // IndexedDB size estimation is complex and async
          // For now, we'll rely on the tracked size
          totalSize = stats.totalBytes;
          break;
      }
      
      stats.totalBytes = totalSize;
    } catch (error) {
      console.error("Error calculating storage size:", error);
    }
    
    return { ...stats };
  }
  
  /**
   * Export all data for backup
   */
  async function exportAllData() {
    try {
      const allData = {};
      
      switch (config.storageType) {
        case STORAGE_TYPES.LOCAL_STORAGE:
        case STORAGE_TYPES.SESSION_STORAGE:
          const storageInterface = config.storageType === STORAGE_TYPES.LOCAL_STORAGE ? 
            localStorage : sessionStorage;
          
          for (let i = 0; i < storageInterface.length; i++) {
            const key = storageInterface.key(i);
            if (key.startsWith(config.namespace)) {
              try {
                const value = storageInterface.getItem(key);
                allData[key] = JSON.parse(value);
              } catch (e) {
                console.warn(`Could not parse item ${key} for export`, e);
                allData[key] = storageInterface.getItem(key);
              }
            }
          }
          break;
          
        case STORAGE_TYPES.MEMORY:
          for (const [key, value] of memoryStorage.entries()) {
            if (key.startsWith(config.namespace)) {
              allData[key] = value;
            }
          }
          break;
          
        case STORAGE_TYPES.INDEXED_DB:
          const data = await exportFromIndexedDB();
          Object.assign(allData, data);
          break;
      }
      
      return {
        data: allData,
        timestamp: new Date().toISOString(),
        storage: config.storageType,
        namespace: config.namespace
      };
    } catch (error) {
      console.error("Error exporting data:", error);
      stats.errors++;
      stats.lastOperation = {
        type: 'export',
        error: error.message,
        timestamp: new Date().toISOString()
      };
      
      return null;
    }
  }
  
  /**
   * Export all data from IndexedDB
   */
  async function exportFromIndexedDB() {
    return new Promise((resolve, reject) => {
      if (!dbConnection) {
        reject(new Error("IndexedDB not initialized"));
        return;
      }
      
      try {
        const transaction = dbConnection.transaction(['routeData'], 'readonly');
        const store = transaction.objectStore('routeData');
        const result = {};
        
        const request = store.openCursor();
        
        request.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            result[cursor.value.key] = cursor.value.data;
            cursor.continue();
          } else {
            resolve(result);
          }
        };
        
        request.onerror = (event) => reject(event.target.error);
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Import data from backup
   */
  async function importData(importData) {
    try {
      if (!importData || !importData.data) {
        throw new Error("Invalid import data");
      }
      
      const { data, namespace } = importData;
      
      // Clear existing data if namespaces match
      if (namespace === config.namespace) {
        await clearAllData();
      }
      
      // Import all data
      for (const [key, value] of Object.entries(data)) {
        // Skip keys from different namespaces unless forced
        if (!key.startsWith(config.namespace) && namespace !== config.namespace) {
          continue;
        }
        
        // Store the data
        await storeData(key.replace(config.namespace, ''), value);
      }
      
      return true;
    } catch (error) {
      console.error("Error importing data:", error);
      stats.errors++;
      stats.lastOperation = {
        type: 'import',
        error: error.message,
        timestamp: new Date().toISOString()
      };
      
      return false;
    }
  }
  
  // Public API
  return {
    init,
    storeData,
    retrieveData,
    removeData,
    clearAllData,
    getStats,
    exportAllData,
    importData,
    backupData,
    STORAGE_TYPES
  };
})();