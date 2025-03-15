ROUTE 33 - DYNAMIC GUIDE
=================================

OVERVIEW
---------
This project is a **web-based route management tool** that dynamically loads delivery stops from a CSV file. It allows users to **search stops, track completion, and export data** in real-time.

FEATURES
---------
✅ Loads stop data from `route_33_friday_20250314_220203_complete.csv`
✅ Search stops dynamically
✅ Mark stops as **completed** (saved in `localStorage`)
✅ Export updated stop data as a CSV file
✅ Uses **CDNs** (no extra dependencies to install)

PROJECT STRUCTURE
------------------
```
/route-guide/
  ├── index.html       # Main web application
  ├── app.js           # Handles CSV parsing, search, progress tracking, and exporting
  ├── route-data.csv   # The main data file (replaceable)
  ├── README.txt       # This documentation
```

HOW TO USE
-----------
1. **Open `index.html`** in a web browser.
2. The route data **loads automatically** from the CSV.
3. **Search** for stops by name or address.
4. Click checkboxes to **mark stops as completed** (saved locally).
5. Click **Export CSV** to download the updated stop list.

UPDATING ROUTE DATA
---------------------
To update the route data, simply replace `route_33_friday_20250314_220203_complete.csv` with a new CSV file (keeping the same format).

DEPENDENCIES
-------------
This project relies on the following **CDNs**:
- Tailwind CSS
- Lucide Icons
- PapaParse (CSV Parsing)
- FileSaver.js (Export CSV)

NOTES
------
- **Internet connection required** to load CDN dependencies.
- **LocalStorage** saves progress even after refreshing.

FUTURE ENHANCEMENTS
--------------------
- Sort stops by area or priority
- Show detailed stop information in a popup modal
- Add PDF export option

🚀 **Enjoy your optimized route management!**

