/**
 * Unit tests for optimized-data-processor.js
 * Demonstrates testing for the Route 33 Guide components
 */

// Test suite for OptimizedDataProcessor
TestSuite.describe('OptimizedDataProcessor', () => {
  
  // Test processing CSV data
  TestSuite.describe('processCSVData', () => {
    // Test with empty data
    TestSuite.it('should handle empty data', () => {
      const result = OptimizedDataProcessor.processCSVData([]);
      
      TestSuite.assert.isTrue(Array.isArray(result.customers), 'Customers should be an array');
      TestSuite.assert.equal(result.customers.length, 0, 'Customers array should be empty');
      TestSuite.assert.equal(result.stats.totalCustomers, 0, 'Should report 0 total customers');
    });
    
    // Test with null/undefined data
    TestSuite.it('should handle null data', () => {
      const result = OptimizedDataProcessor.processCSVData(null);
      
      TestSuite.assert.isTrue(Array.isArray(result.customers), 'Customers should be an array');
      TestSuite.assert.equal(result.customers.length, 0, 'Customers array should be empty');
    });
    
    // Test with valid data
    TestSuite.it('should process valid data correctly', () => {
      const sampleData = [
        { CustomerNumber: '123', AccountName: 'Test Customer', Address: '123 Test St', ItemID: 'A1', Description: 'Test Item', Quantity: '5' },
        { CustomerNumber: '123', AccountName: 'Test Customer', Address: '123 Test St', ItemID: 'A2', Description: 'Another Item', Quantity: '3' },
        { CustomerNumber: '456', AccountName: 'Second Customer', Address: '456 Bechelli Ln', ItemID: 'B1', Description: 'Item B', Quantity: '1' }
      ];
      
      const result = OptimizedDataProcessor.processCSVData(sampleData);
      
      TestSuite.assert.equal(result.stats.totalCustomers, 2, 'Should have 2 unique customers');
      TestSuite.assert.equal(result.stats.totalItems, 3, 'Should have 3 total items');
      
      // Check area classification
      if (result.customersByArea['Bechelli Lane']) {
        TestSuite.assert.equal(result.customersByArea['Bechelli Lane'].length, 1, 'Should have 1 customer in Bechelli Lane');
      }
      
      // Check customer has correct items
      const firstCustomer = result.customers.find(c => c.customerNumber === '123');
      TestSuite.assert.isTrue(firstCustomer !== undefined, 'First customer should exist');
      TestSuite.assert.equal(firstCustomer.items.length, 2, 'First customer should have 2 items');
    });
    
    // Test with malformed data
    TestSuite.it('should handle malformed data', () => {
      const malformedData = [
        { CustomerNumber: '123', AccountName: 'Test Customer' }, // Missing address
        { AccountName: 'No ID Customer', Address: '789 Test Ave' }, // Missing CustomerNumber
        { CustomerNumber: '456', AccountName: 'Another Customer', Address: '456 Test Blvd', ItemID: '' } // Empty ItemID
      ];
      
      const result = OptimizedDataProcessor.processCSVData(malformedData);
      
      TestSuite.assert.equal(result.stats.totalCustomers, 2, 'Should have 2 valid customers');
      TestSuite.assert.equal(result.stats.totalItems, 0, 'Should have 0 valid items');
    });
  });
  
  // Test search functionality
  TestSuite.describe('searchItems', () => {
    // Sample processed data for search tests
    const sampleProcessedData = {
      customers: [
        {
          customerNumber: '123',
          accountName: 'ABC Company',
          address: '123 Main St',
          area: 'Downtown',
          items: [
            { itemId: 'A1', description: 'Widget X', quantity: 5 },
            { itemId: 'A2', description: 'Gadget Y', quantity: 3 }
          ]
        },
        {
          customerNumber: '456',
          accountName: 'XYZ Corp',
          address: '456 Bechelli Ln',
          area: 'Bechelli Lane',
          items: [
            { itemId: 'B1', description: 'Tool Z', quantity: 1 }
          ]
        }
      ],
      customersByNumber: {
        '123': { /* customer 1 data */ },
        '456': { /* customer 2 data */ }
      }
    };
    
    // Test empty search
    TestSuite.it('should return all customers for empty search', () => {
      const result = OptimizedDataProcessor.searchItems(sampleProcessedData, '');
      TestSuite.assert.equal(result.length, 2, 'Should return all customers');
    });
    
    // Test search by customer name
    TestSuite.it('should find customers by name', () => {
      const result = OptimizedDataProcessor.searchItems(sampleProcessedData, 'abc');
      TestSuite.assert.equal(result.length, 1, 'Should find one customer');
      TestSuite.assert.equal(result[0].accountName, 'ABC Company', 'Should find the correct customer');
    });
    
    // Test search by address
    TestSuite.it('should find customers by address', () => {
      const result = OptimizedDataProcessor.searchItems(sampleProcessedData, 'bechelli');
      TestSuite.assert.equal(result.length, 1, 'Should find one customer');
      TestSuite.assert.equal(result[0].accountName, 'XYZ Corp', 'Should find the correct customer');
    });
    
    // Test search by item description
    TestSuite.it('should find customers by item description', () => {
      const result = OptimizedDataProcessor.searchItems(sampleProcessedData, 'widget');
      TestSuite.assert.equal(result.length, 1, 'Should find one customer');
      TestSuite.assert.equal(result[0].accountName, 'ABC Company', 'Should find the correct customer');
    });
    
    // Test no results
    TestSuite.it('should return empty array for no matches', () => {
      const result = OptimizedDataProcessor.searchItems(sampleProcessedData, 'nonexistent');
      TestSuite.assert.equal(result.length, 0, 'Should find no customers');
    });
  });
  
  // Test route generation
  TestSuite.describe('generateOptimalRoute', () => {
    // Sample processed data for route tests
    const sampleProcessedData = {
      customers: [
        {
          customerNumber: '123',
          accountName: 'Downtown Shop',
          address: '123 Main St',
          area: 'Downtown',
          items: [{ itemId: 'A1', description: 'Item X', quantity: 1 }]
        },
        {
          customerNumber: '456',
          accountName: 'Bechelli Store',
          address: '456 Bechelli Ln',
          area: 'Bechelli Lane',
          items: [{ itemId: 'B1', description: 'Item Y', quantity: 1 }]
        },
        {
          customerNumber: '789',
          accountName: 'Ortho Clinic',
          address: '1255 Liberty St',
          area: 'Shasta Ortho',
          items: [{ itemId: 'C1', description: 'Item Z', quantity: 1 }]
        }
      ],
      customersByArea: {
        'Downtown': [/* downtown customer */],
        'Bechelli Lane': [/* bechelli customer */],
        'Shasta Ortho': [/* ortho customer */]
      }
    };
    
    // Populate the customersByArea properly
    sampleProcessedData.customersByArea['Downtown'] = [sampleProcessedData.customers[0]];
    sampleProcessedData.customersByArea['Bechelli Lane'] = [sampleProcessedData.customers[1]];
    sampleProcessedData.customersByArea['Shasta Ortho'] = [sampleProcessedData.customers[2]];
    
    // Test basic route generation
    TestSuite.it('should generate a route with all customers', () => {
      const route = OptimizedDataProcessor.generateOptimalRoute(sampleProcessedData);
      
      TestSuite.assert.equal(route.length, 3, 'Route should include all 3 customers');
    });
    
    // Test area ordering
    TestSuite.it('should order customers by area priority', () => {
      const route = OptimizedDataProcessor.generateOptimalRoute(sampleProcessedData);
      
      // Check that Shasta Ortho comes before Bechelli Lane
      const shasthaIndex = route.findIndex(stop => stop.area === 'Shasta Ortho');
      const bechelliIndex = route.findIndex(stop => stop.area === 'Bechelli Lane');
      const downtownIndex = route.findIndex(stop => stop.area === 'Downtown');
      
      TestSuite.assert.isTrue(shasthaIndex < bechelliIndex, 'Shasta Ortho should come before Bechelli Lane');
      TestSuite.assert.isTrue(bechelliIndex < downtownIndex, 'Bechelli Lane should come before Downtown');
    });
    
    // Test with empty data
    TestSuite.it('should handle empty data', () => {
      const route = OptimizedDataProcessor.generateOptimalRoute({
        customers: [],
        customersByArea: {}
      });
      
      TestSuite.assert.equal(route.length, 0, 'Route should be empty');
    });
  });
  
  // Test completion status calculation
  TestSuite.describe('calculateCompletionStatus', () => {
    // Sample data for completion tests
    const sampleData = {
      customers: [
        {
          customerNumber: '123',
          accountName: 'Test Customer',
          items: [
            { itemId: 'A1', description: 'Item X' },
            { itemId: 'A2', description: 'Item Y' }
          ]
        },
        {
          customerNumber: '456',
          accountName: 'No Items Customer',
          items: []
        }
      ]
    };
    
    // Test with no completed items
    TestSuite.it('should report 0% complete when nothing is checked', () => {
      const status = OptimizedDataProcessor.calculateCompletionStatus(sampleData, {});
      
      TestSuite.assert.equal(status.totalStops, 2, 'Should have 2 total stops');
      TestSuite.assert.equal(status.completedStops, 0, 'Should have 0 completed stops');
      TestSuite.assert.equal(status.totalItems, 2, 'Should have 2 total items');
      TestSuite.assert.equal(status.completedItems, 0, 'Should have 0 completed items');
      TestSuite.assert.equal(status.progress, 0, 'Progress should be 0%');
    });
    
    // Test with some completed items
    TestSuite.it('should calculate partial completion correctly', () => {
      const checkedItems = {
        '123-A1': true
      };
      
      const status = OptimizedDataProcessor.calculateCompletionStatus(sampleData, checkedItems);
      
      TestSuite.assert.equal(status.completedItems, 1, 'Should have 1 completed item');
      TestSuite.assert.equal(status.completedStops, 0, 'Should have 0 completed stops (not all items checked)');
    });
    
    // Test with all items for a customer completed
    TestSuite.it('should mark stop as completed when all items are checked', () => {
      const checkedItems = {
        '123-A1': true,
        '123-A2': true
      };
      
      const status = OptimizedDataProcessor.calculateCompletionStatus(sampleData, checkedItems);
      
      TestSuite.assert.equal(status.completedItems, 2, 'Should have 2 completed items');
      TestSuite.assert.equal(status.completedStops, 1, 'Should have 1 completed stop');
      TestSuite.assert.equal(status.progress, 50, 'Progress should be 50%');
    });
    
    // Test with a customer with no items
    TestSuite.it('should handle customers with no items', () => {
      const checkedItems = {
        '456': true
      };
      
      const status = OptimizedDataProcessor.calculateCompletionStatus(sampleData, checkedItems);
      
      TestSuite.assert.equal(status.completedStops, 1, 'Should have 1 completed stop');
    });
    
    // Test with everything completed
    TestSuite.it('should report 100% when everything is completed', () => {
      const checkedItems = {
        '123-A1': true,
        '123-A2': true,
        '456': true
      };
      
      const status = OptimizedDataProcessor.calculateCompletionStatus(sampleData, checkedItems);
      
      TestSuite.assert.equal(status.completedStops, 2, 'Should have 2 completed stops');
      TestSuite.assert.equal(status.completedItems, 2, 'Should have 2 completed items');
      TestSuite.assert.equal(status.progress, 100, 'Progress should be 100%');
    });
  });
});