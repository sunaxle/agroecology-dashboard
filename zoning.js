document.addEventListener("DOMContentLoaded", () => {
    // 1. Read Global Campus Setup
    const campusName = localStorage.getItem("activeCampusName") || "J.W. Caceres & M. Rivas Academy";
    const activeLng = parseFloat(localStorage.getItem("activeCampusLng"));
    const activeLat = parseFloat(localStorage.getItem("activeCampusLat"));
    const mapCenter = !isNaN(activeLng) && !isNaN(activeLat) ? [activeLng, activeLat] : [-98.0520, 26.1704];

    document.getElementById("campusReadout").textContent = campusName;

    // 2. Define Category Styling
    const zoneStyles = {
        "Campus Boundary": { color: [156, 39, 176, 0.1], outline: [156, 39, 176, 1] }, // Purple outline
        "Rooftop": { color: [158, 158, 158, 0.5], outline: [97, 97, 97, 1] },       // Grey
        "Parking Lot": { color: [66, 66, 66, 0.4], outline: [33, 33, 33, 1] },      // Dark Grey
        "Courtyard": { color: [255, 193, 7, 0.3], outline: [255, 160, 0, 1] },      // Amber
        "Corridor": { color: [3, 169, 244, 0.3], outline: [2, 119, 189, 1] },       // Light Blue
        "Front Yard": { color: [139, 195, 74, 0.4], outline: [104, 159, 56, 1] },   // Light Green
        "Open Land": { color: [76, 175, 80, 0.3], outline: [56, 142, 60, 1] }       // Green
    };

    let drawnZones = [];

    // Load previously saved zones from localStorage
    try {
        const saved = localStorage.getItem(`zones_${campusName}`);
        if (saved) drawnZones = JSON.parse(saved);
    } catch (e) {
        console.warn("No saved zones found.");
    }

    // 3. Initialize ArcGIS Map & Sketch Tools
    require([
        "esri/Map",
        "esri/views/MapView",
        "esri/layers/GraphicsLayer",
        "esri/widgets/Sketch",
        "esri/Graphic",
        "esri/geometry/Polygon",
        "esri/geometry/support/webMercatorUtils",
        "esri/geometry/geometryEngine"
    ], function (Map, MapView, GraphicsLayer, Sketch, Graphic, Polygon, webMercatorUtils, geometryEngine) {

        const map = new Map({ basemap: "satellite" });

        // We will store all the persistent saved zones here
        const zoneLayer = new GraphicsLayer({ title: "Site Zones" });
        map.add(zoneLayer);

        // The scratchpad layer where the Sketch widget physically draws
        const sketchLayer = new GraphicsLayer({ title: "Sketch Drafts" });
        map.add(sketchLayer);

        const view = new MapView({
            container: "viewDiv",
            map: map,
            center: mapCenter,
            zoom: 18 // Extremely tight zoom for accurate drawing
        });

        const sketch = new Sketch({
            layer: sketchLayer,
            view: view,
            creationMode: "update",
            availableCreateTools: ["polygon"]
        });

        // 4. Populate existing zones onto the map
        function renderSavedZones() {
            zoneLayer.removeAll();
            const listEl = document.getElementById("zoneList");
            listEl.innerHTML = "";

            if (drawnZones.length === 0) {
                listEl.innerHTML = "<li style='color:#777; font-size:0.9em; padding:10px;'>No zones defined yet.</li>";
                return;
            }

            drawnZones.forEach((z, idx) => {
                const style = zoneStyles[z.category];

                // Map Graphic
                const polygon = new Polygon({ rings: z.geometry.rings, spatialReference: view.spatialReference });

                // Area calculation engine
                let areaText = `Area ${idx + 1}`;
                try {
                    const acres = Math.abs(geometryEngine.geodesicArea(polygon, "acres"));
                    const sqft = Math.abs(geometryEngine.geodesicArea(polygon, "square-feet"));
                    if (acres > 0) {
                        areaText = `<strong>${acres.toFixed(2)} Acres</strong> <span style="color:#999;font-size:0.9em;">(${sqft.toLocaleString(undefined, { maximumFractionDigits: 0 })} sq ft)</span>`;
                    }
                } catch (e) { }

                const graphic = new Graphic({
                    geometry: polygon,
                    symbol: {
                        type: "simple-fill",
                        color: style.color,
                        outline: { color: style.outline, width: z.category === "Campus Boundary" ? 4 : 2 }
                    },
                    attributes: z
                });
                zoneLayer.add(graphic);

                // UI list element
                const rgb = `rgb(${style.color[0]}, ${style.color[1]}, ${style.color[2]})`;
                const li = document.createElement("li");
                li.className = "zone-item";
                li.innerHTML = `
                    <div>
                        <span class="zone-color-swatch" style="background-color: ${rgb};"></span>
                        <strong>${z.category}</strong>
                        <div style="font-size: 0.85em; color: var(--green-dark); margin-left:24px; margin-top: 3px;">${areaText}</div>
                    </div>
                    <button class="btn btn-danger" style="padding: 4px 8px; width: auto; min-width: 60px;" onclick="window.deleteZone(${idx})">Delete</button>
                `;
                listEl.appendChild(li);
            });
        }

        // Wait for map load
        view.when(() => {
            renderSavedZones();
        });

        // 5. Button Bindings to trigger ArcGIS Sketch
        const btnDraw = document.getElementById("btnDrawPolygon");
        const btnCancel = document.getElementById("btnClearSelection");
        const btnClearAll = document.getElementById("btnClearAll");
        const btnExport = document.getElementById("btnExportGeoJSON");
        const selectType = document.getElementById("zoneTypeSelect");

        btnDraw.addEventListener("click", () => {
            sketch.create("polygon");
            btnDraw.style.display = "none";
            btnCancel.style.display = "block";
            selectType.disabled = true;
        });

        btnCancel.addEventListener("click", () => {
            sketch.cancel();
            btnDraw.style.display = "block";
            btnCancel.style.display = "none";
            selectType.disabled = false;
        });

        btnClearAll.addEventListener("click", () => {
            if (confirm("Are you sure you want to delete all delineated zones on this campus?")) {
                drawnZones = [];
                localStorage.removeItem(`zones_${campusName}`);
                renderSavedZones();
            }
        });

        // 6. Native Sketch Event Listener for when a user finishes drawing
        sketch.on("create", (event) => {
            if (event.state === "complete") {
                const category = selectType.value;
                const graphic = event.graphic;

                // Save the data object
                drawnZones.push({
                    category: category,
                    campus: campusName,
                    timestamp: new Date().toISOString(),
                    geometry: {
                        type: "polygon",
                        rings: graphic.geometry.rings
                    }
                });

                // Persist
                localStorage.setItem(`zones_${campusName}`, JSON.stringify(drawnZones));

                // Cleanup UI
                sketchLayer.removeAll(); // Clear draft
                renderSavedZones();      // Rerender perm layer

                btnDraw.style.display = "block";
                btnCancel.style.display = "none";
                selectType.disabled = false;
            }
        });

        // Global delete binding for the UI list
        window.deleteZone = function (index) {
            drawnZones.splice(index, 1);
            localStorage.setItem(`zones_${campusName}`, JSON.stringify(drawnZones));
            renderSavedZones();
        };

        // 7. GeoJSON Export Logic
        btnExport.addEventListener("click", () => {
            if (drawnZones.length === 0) {
                alert("Please draw some zones first.");
                return;
            }

            const features = drawnZones.map(z => {
                // Must convert WebMercator geometry rings to clean Longitude/Latitude for GeoJSON standards
                const polygon = new Polygon({ rings: z.geometry.rings, spatialReference: view.spatialReference });
                const geographic = webMercatorUtils.webMercatorToGeographic(polygon);

                return {
                    "type": "Feature",
                    "properties": {
                        "category": z.category,
                        "campus": z.campus,
                        "dateAdded": z.timestamp
                    },
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": geographic.rings
                    }
                };
            });

            const geojson = {
                "type": "FeatureCollection",
                "features": features
            };

            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(geojson, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", `campus_zones_${campusName.replace(/\s+/g, '_').toLowerCase()}.geojson`);
            document.body.appendChild(downloadAnchorNode); // required for firefox
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        });
    });
});
