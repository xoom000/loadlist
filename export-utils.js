/**
 * export-utils.js
 * Handles export functionality for the Route 33 Guide
 */

const ExportUtils = (function() {
  
  /**
   * Export route data as CSV
   */
  function exportToCSV(routeData, checkedItems) {
    // Prepare data
    const exportData = [];
    
    routeData.forEach(customer => {
      if (customer.items && customer.items.length > 0) {
        // Add each item as a row
        customer.items.forEach(item => {
          const isCompleted = checkedItems[`${customer.customerNumber}-${item.itemId}`] ? true : false;
          
          exportData.push({
            CustomerNumber: customer.customerNumber,
            AccountName: customer.accountName,
            Address: customer.address,
            Area: customer.area,
            ItemID: item.itemId,
            Description: item.description,
            Quantity: item.quantity,
            Completed: isCompleted ? "Yes" : "No",
            CompletedDate: isCompleted ? new Date().toLocaleDateString() : ""
          });
        });
      } else {
        // Add customer without items
        const isCompleted = checkedItems[customer.customerNumber] ? true : false;
        
        exportData.push({
          CustomerNumber: customer.customerNumber,
          AccountName: customer.accountName,
          Address: customer.address,
          Area: customer.area,
          ItemID: "",
          Description: "No items",
          Quantity: "",
          Completed: isCompleted ? "Yes" : "No",
          CompletedDate: isCompleted ? new Date().toLocaleDateString() : ""
        });
      }
    });
    
    // Generate CSV
    const csv = Papa.unparse(exportData);
    
    // Create blob and download
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const now = new Date();
    const filename = `route_33_export_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}.csv`;
    
    // Use FileSaver.js
    saveAs(blob, filename);
    
    return {
      filename,
      rowCount: exportData.length
    };
  }
  
  /**
   * Export route data as PDF
   */
  function exportToPDF(routeData, checkedItems, stats) {
    // Initialize jsPDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });
    
    // Set up constants
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    
    // Helpers
    let yPos = margin;
    
    // Add header
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text("Route 33 Friday Guide", margin, yPos);
    
    yPos += 7;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on ${new Date().toLocaleDateString()} - ${stats.completedStops}/${stats.totalStops} stops completed`, margin, yPos);
    
    yPos += 10;
    
    // Group by area
    const areaOrder = ["Shasta Ortho", "Bechelli Lane", "Downtown", "Churn Creek", "South Redding", "Other"];
    
    // Create an object to group customers by area
    const customersByArea = {};
    areaOrder.forEach(area => customersByArea[area] = []);
    
    routeData.forEach(customer => {
      if (customersByArea[customer.area]) {
        customersByArea[customer.area].push(customer);
      } else {
        customersByArea["Other"].push(customer);
      }
    });
    
    // Process each area
    areaOrder.forEach(area => {
      const customers = customersByArea[area];
      
      if (customers.length === 0) return;
      
      // Check if we need a new page
      if (yPos + 20 > pageHeight - margin) {
        doc.addPage();
        yPos = margin;
      }
      
      // Area header
      doc.setFillColor(230, 230, 230);
      doc.rect(margin, yPos, contentWidth, 8, "F");
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(area, margin + 3, yPos + 5.5);
      
      yPos += 12;
      
      // Process each customer in the area
      customers.forEach(customer => {
        // Check if we need a new page
        if (yPos + 15 > pageHeight - margin) {
          doc.addPage();
          yPos = margin;
        }
        
        // Customer header
        const isCompleted = customer.items && customer.items.length > 0 
          ? customer.items.every(item => checkedItems[`${customer.customerNumber}-${item.itemId}`])
          : checkedItems[customer.customerNumber];
        
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        
        if (isCompleted) {
          doc.setTextColor(100, 100, 100);
        }
        
        doc.text(`${customer.accountName}`, margin, yPos);
        
        // Completion status indicator
        if (isCompleted) {
          doc.setTextColor(0, 150, 0);
          doc.text("✓ Completed", pageWidth - margin - 25, yPos);
        }
        
        yPos += 5;
        
        // Address
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        doc.text(customer.address, margin, yPos);
        
        yPos += 7;
        
        // Items
        if (customer.items && customer.items.length > 0) {
          doc.setFontSize(9);
          
          customer.items.forEach(item => {
            // Check if we need a new page
            if (yPos + 5 > pageHeight - margin) {
              doc.addPage();
              yPos = margin;
            }
            
            const itemCompleted = checkedItems[`${customer.customerNumber}-${item.itemId}`];
            
            if (itemCompleted) {
              doc.setTextColor(100, 100, 100);
            } else {
              doc.setTextColor(0, 0, 0);
            }
            
            // Item description and quantity
            let itemText = `• ${item.description}`;
            if (item.quantity) {
              itemText += ` (${item.quantity})`;
            }
            
            doc.text(itemText, margin + 5, yPos);
            
            if (itemCompleted) {
              doc.setTextColor(0, 150, 0);
              doc.text("✓", margin, yPos);
            }
            
            yPos += 5;
          });
        } else {
          doc.setFontSize(9);
          doc.setTextColor(100, 100, 100);
          doc.text("No items for delivery", margin + 5, yPos);
          yPos += 5;
        }
        
        // Add spacing between customers
        yPos += 5;
      });
    });
    
    // Add footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Route 33 Friday Guide - Page ${doc.internal.getNumberOfPages()}`, pageWidth / 2, pageHeight - 10, { align: "center" });
    
    // Save the PDF
    const now = new Date();
    const filename = `route_33_guide_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}.pdf`;
    
    doc.save(filename);
    
    return {
      filename,
      pageCount: doc.internal.getNumberOfPages()
    };
  }
  
  /**
   * Copy current status to clipboard
   */
  function copyStatusToClipboard(routeData, checkedItems, stats) {
    // Create a summary text of completion status
    let summary = `Route 33 Status Update - ${new Date().toLocaleString()}\n\n`;
    summary += `Overall: ${stats.completedStops}/${stats.totalStops} stops completed (${stats.stopsProgress}%)\n\n`;
    
    // List completed stops
    summary += "Completed Stops:\n";
    let hasCompleted = false;
    
    routeData.forEach(customer => {
      const isCompleted = customer.items && customer.items.length > 0 
        ? customer.items.every(item => checkedItems[`${customer.customerNumber}-${item.itemId}`])
        : checkedItems[customer.customerNumber];
      
      if (isCompleted) {
        hasCompleted = true;
        summary += `✓ ${customer.accountName}\n`;
      }
    });
    
    if (!hasCompleted) {
      summary += "None yet\n";
    }
    
    summary += "\nRemaining Stops:\n";
    let hasRemaining = false;
    
    routeData.forEach(customer => {
      const isCompleted = customer.items && customer.items.length > 0 
        ? customer.items.every(item => checkedItems[`${customer.customerNumber}-${item.itemId}`])
        : checkedItems[customer.customerNumber];
      
      if (!isCompleted) {
        hasRemaining = true;
        summary += `○ ${customer.accountName}\n`;
      }
    });
    
    if (!hasRemaining) {
      summary += "All completed!\n";
    }
    
    // Copy to clipboard
    try {
      navigator.clipboard.writeText(summary);
      return true;
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      
      // Fallback method
      const textarea = document.createElement("textarea");
      textarea.value = summary;
      document.body.appendChild(textarea);
      textarea.select();
      
      try {
        document.execCommand("copy");
        document.body.removeChild(textarea);
        return true;
      } catch (e) {
        console.error("Fallback clipboard copy failed:", e);
        document.body.removeChild(textarea);
        return false;
      }
    }
  }
  
  // Public API
  return {
    exportToCSV,
    exportToPDF,
    copyStatusToClipboard
  };
})();