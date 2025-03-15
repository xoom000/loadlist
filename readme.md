# Route 33 - Dynamic Guide

A privacy-focused, web-based route management tool for delivery drivers that works with your CSV files directly in the browser. Upload your route data, track progress, and export reports without ever sending your sensitive data to a server.

## Features

- **Data Management**
  - Load customer/item data from a CSV file
  - Store progress data in localStorage for persistence
  - Allow manual edits to notes directly in the interface

- **Export Options**
  - PDF export of the entire route list
  - CSV export of completion status
  - Print-optimized view

- **Communication Features**
  - Click-to-call functionality for contacts
  - Direct email capability
  - SMS capability for quick updates

- **Navigation Integration**
  - "Navigate to" button for each stop
  - Area-based organization

- **UI Enhancements**
  - Summary and detailed views
  - Search functionality
  - Real-time progress tracking
  - Mobile-friendly design

## Usage

1. **Open the app**: Visit the GitHub Pages URL or open `index.html` locally
2. **View stops**: Browse by area or search for specific items/customers
3. **Mark progress**: Check off items or entire stops as you complete them
4. **Export data**: Generate PDF reports or export CSV data
5. **Edit notes**: Customize access notes and driver tips as needed

## Privacy & Data Handling

Your route data stays completely private:

- All data is stored locally in your browser
- Nothing is sent to any servers
- Your CSV files are processed entirely on your device
- You maintain complete control over your sensitive data

## CSV Format

The app works with CSV files in the following format:

```
CustomerNumber,AccountName,Address,ItemID,Description,Quantity,DeliveryFrequency,DeliveryDay,Price,RouteNumber
297833,Balance Yoga Center,2821 Bechelli Ln.,70623600,Dust Mop-36 Untreate,1,Weekly,4,,33
```

The minimum required columns are:
- `CustomerNumber` - Unique identifier for the customer
- `AccountName` - Name of the customer/business
- `Address` - Location address
- `ItemID` - Unique identifier for the item (optional if no items)
- `Description` - Description of the item (optional)
- `Quantity` - Number of items (optional)

Additional columns will be preserved but might not be displayed.

## Installation

No installation required! This app runs entirely in the browser.

### Option 1: GitHub Pages (Recommended)

Access the app directly at: [YOUR-GITHUB-PAGES-URL]

### Option 2: Local Usage

1. Download all files from this repository
2. Open `index.html` in a web browser

## Technical Details

- Built with vanilla JavaScript (no frameworks)
- Uses Tailwind CSS for styling
- Includes the following libraries:
  - PapaParse for CSV parsing
  - jsPDF for PDF generation
  - Lucide for icons
  - FileSaver.js for export functionality
  - localForage for better localStorage management

## Project Structure

```
/route-33-guide/
  ├── index.html       # Main application
  ├── styles.css       # Custom styles
  ├── app.js           # Core application logic
  ├── data-handler.js  # CSV loading and data processing
  ├── export-utils.js  # PDF and export functionality
  ├── route_33_friday_20250314_220203_complete.csv # Sample data
  └── README.md        # This documentation
```

## Customization

- **Branding**: Edit the header in `index.html`
- **Driver Tips**: Edit directly in the UI
- **Access Notes**: Edit directly in the UI
- **CSV Path**: Change the default CSV path in `data-handler.js`

## Offline Support

The app works offline after initial load, with progress saved in your browser's local storage.

## Contributing

Feel free to submit issues or pull requests to improve the app.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
