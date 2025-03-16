# Route 33 - Dynamic Guide

A privacy-focused, web-based route management tool for delivery drivers that works with your CSV files directly in the browser. Upload your route data, track progress, and export reports without ever sending your sensitive data to a server.

![Route 33 Guide Screenshot](screenshot.png)

## 🌟 Key Features

- **Complete Privacy**
  - All data stays on your device
  - Nothing is ever sent to servers
  - Your CSV files are processed entirely in your browser

- **Advanced Data Management**
  - Smart area classification based on addresses
  - Optimized single-pass data processing for large files
  - Multiple storage options (localStorage, IndexedDB)
  - Automatic data backups to prevent loss

- **Flexible Views**
  - Summary view for quick overviews
  - Detailed view for complete information
  - Search functionality for finding specific items or customers
  - Filtering to hide completed stops

- **Data Export Options**
  - PDF export with custom formatting
  - CSV export with completion status
  - Clipboard copying for quick updates
  - Print-optimized view

- **Communication Tools**
  - Click-to-call functionality
  - SMS for quick driver updates
  - Email support
  - Direct navigation links to Google Maps

- **Route Optimization**
  - Area-based organization
  - Configurable area ordering
  - Optimized route suggestions

## 📋 Usage

1. **First Visit**: Upload your CSV file to get started
2. **Navigation**: Browse by area or search for specific items/customers
3. **Tracking**: Check off items or entire stops as you complete them
4. **Reporting**: Generate PDF reports or export CSV data
5. **Customization**: Edit notes and driver tips directly in the interface

## 🔄 CSV Format

The app works with CSV files that include these columns:

```
CustomerNumber,AccountName,Address,ItemID,Description,Quantity
```

Required columns:
- `CustomerNumber` - Unique identifier for each customer
- `AccountName` - Name of the customer/business
- `Address` - Location address

Optional columns:
- `ItemID` - Identifier for the item
- `Description` - What the item is
- `Quantity` - How many of this item

Additional columns will be preserved.

## 🔧 Installation

No installation required! The app runs entirely in your browser.

### Option 1: GitHub Pages (Recommended)

Access the app directly at: [https://xoom000.github.io/loadlist/](https://xoom000.github.io/loadlist/)

### Option 2: Local Usage

1. Download all files from this repository
2. Open `index.html` in a web browser

### Option 3: Development Setup

```bash
# Clone the repository
git clone https://github.com/xoom000/loadlist.git

# Change directory
cd loadlist

# Install dependencies
npm install

# Start a local server
npm start
```

## 🏗️ Project Structure

```
/route-33-guide/
├── index.html               # Main application HTML
├── styles.css               # Custom styles
├── app.js                   # Core application logic
├── data-handler.js          # CSV loading and data processing
├── export-utils.js          # PDF and export functionality
├── csv-processor.js         # CSV analysis utilities
├── optimized-data-processor.js # Performance-optimized data handling
├── area-classifier.js       # Configurable area classification
├── error-handler.js         # Centralized error handling
├── ui-config-manager.js     # UI configuration and theming
├── data-storage-service.js  # Advanced data persistence
├── route-summary-component.js # UI component for route summaries
├── test-suite.js            # Testing framework
├── test-runner.js           # Test runner script
├── *.test.js                # Test files
└── package.json             # Project configuration
```

## 🧪 Testing

The project includes a comprehensive testing framework:

```bash
# Run all tests
npm test

# Run specific test file
npm test -- --file=optimized-data-processor.test.js

# Run with more detailed output
npm test -- --verbose

# Stop on first failure
npm test -- --stop-on-fail
```

## 🔜 Future Enhancements

- Service worker support for full offline capability
- Drag-and-drop stop reordering
- Enhanced distance-based route optimization
- Multiple route management
- Import/export of area configurations
- Multi-day route planning

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built using Tailwind CSS, Papa Parse, and jsPDF
- Icons provided by Lucide
- Optimized for modern browsers
