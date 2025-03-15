document.addEventListener("DOMContentLoaded", function () {
    const stopsList = document.getElementById("stopsList");
    const searchInput = document.getElementById("search");
    const statsDisplay = document.getElementById("stats-display");
    const exportBtn = document.getElementById("exportBtn");
    let stopsData = [];

    // Load the CSV file dynamically
    function loadCSV() {
        fetch("route_33_friday_20250314_220203_complete.csv")
            .then(response => response.text())
            .then(csvText => {
                const parsedData = Papa.parse(csvText, { header: true }).data;
                stopsData = parsedData.filter(row => row.CustomerNumber); // Remove empty rows
                renderStops();
            })
            .catch(error => console.error("Error loading CSV:", error));
    }

    // Render stops on the page
    function renderStops() {
        stopsList.innerHTML = "";
        let completedCount = 0;
        const query = searchInput.value.toLowerCase();

        stopsData.forEach(stop => {
            if (stop.AccountName.toLowerCase().includes(query) || stop.Address.toLowerCase().includes(query)) {
                const li = document.createElement("li");
                li.className = "p-4 bg-gray-800 rounded flex justify-between items-center";

                const infoDiv = document.createElement("div");
                infoDiv.innerHTML = `<strong>${stop.AccountName}</strong><br>
                                     <span class='text-sm text-gray-400'>${stop.Address}</span>`;

                const checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.className = "w-5 h-5";
                checkbox.checked = stop.Completed === "true";
                checkbox.addEventListener("change", () => {
                    stop.Completed = checkbox.checked.toString();
                    saveStops();
                    renderStops();
                });

                if (stop.Completed === "true") {
                    completedCount++;
                }

                li.appendChild(infoDiv);
                li.appendChild(checkbox);
                stopsList.appendChild(li);
            }
        });

        statsDisplay.textContent = `${stopsData.length} stops - ${completedCount} completed`;
    }

    // Save progress to localStorage
    function saveStops() {
        localStorage.setItem("routeStops", JSON.stringify(stopsData));
    }

    // Export the data to CSV
    exportBtn.addEventListener("click", () => {
        const csv = Papa.unparse(stopsData);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        saveAs(blob, "route_guide_export.csv");
    });

    // Search filtering
    searchInput.addEventListener("input", renderStops);

    // Load saved data if available
    const savedData = localStorage.getItem("routeStops");
    if (savedData) {
        stopsData = JSON.parse(savedData);
        renderStops();
    } else {
        loadCSV();
    }
});