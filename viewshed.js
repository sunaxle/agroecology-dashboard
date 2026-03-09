(function () {
    /*
     * FUTURE ROADMAP NOTES (Saved from User Feedback):
     * 1. Exact Distance Measurement: Once the classroom window locations are 
     *    more defined and exact horizontally/vertically, we should add a tool 
     *    to measure the exact distance from a specific window to a specific tree.
     * 2. Directional Isolation (Green View Equity): The N/S/E/W window filter 
     *    is very important. We need to build advanced work to isolate these views 
     *    and calculate exactly who is getting what kind of "green view" space 
     *    to ensure students have equitable visual access to nature.
     */
    const config = window.APP_CONFIG;
    const windowSelect = document.getElementById("windowSelect");
    const greenScoreValue = document.getElementById("greenScoreValue");

    window.require(
        [
            "esri/Map",
            "esri/views/MapView",
            "esri/layers/GraphicsLayer",
            "esri/Graphic",
            "esri/geometry/Polygon",
            "esri/geometry/geometryEngine",
            "esri/widgets/BasemapToggle",
            "esri/widgets/Zoom"
        ],
        (Map, MapView, GraphicsLayer, Graphic, Polygon, geometryEngine, BasemapToggle, Zoom) => {
            const campusName = localStorage.getItem("activeCampusName") || "J.W. Caceres & M. Rivas Academy";
            const activeLng = parseFloat(localStorage.getItem("activeCampusLng"));
            const activeLat = parseFloat(localStorage.getItem("activeCampusLat"));
            let mapCenter = !isNaN(activeLng) && !isNaN(activeLat) ? [activeLng, activeLat] : [-98.0700, 26.1668];

            // Attempt to dynamically center based on drawn zones to fix the offset
            try {
                const savedZones = localStorage.getItem(`zones_${campusName}`);
                if (savedZones) {
                    const zones = JSON.parse(savedZones);
                    if (zones.length > 0) {
                        let x = zones[0].geometry.rings[0][0][0];
                        let y = zones[0].geometry.rings[0][0][1];
                        if (Math.abs(x) > 180) {
                            const lon = (x / 20037508.34) * 180;
                            const lat = (Math.atan(Math.exp((y / 20037508.34) * Math.PI)) * 360 / Math.PI) - 90;
                            mapCenter = [lon, lat];
                        } else {
                            mapCenter = [x, y];
                        }
                    }
                }
            } catch (e) { }

            const map = new Map({ basemap: config?.map?.basemap || "satellite" });

            const view = new MapView({
                container: "viewshedMap",
                map,
                center: mapCenter,
                zoom: config?.map?.zoom || 18,
                constraints: {
                    minZoom: config?.map?.minZoom || 16,
                    maxZoom: config?.map?.maxZoom || 19
                }
            });

            // Layer for School Boundary & 500m Buffer
            const boundaryLayer = new GraphicsLayer({
                title: "Campus Boundaries & 500m Buffer"
            });
            map.add(boundaryLayer);

            // Fetch and draw boundary
            fetch("data/campus_boundary.json")
                .then(response => response.json())
                .then(data => {
                    if (!data.features[0]) return;
                    const coords = data.features[0].geometry.coordinates[0];

                    const polygon = new Polygon({
                        rings: coords
                    });

                    // Draw the strict property line
                    const boundaryGraphic = new Graphic({
                        geometry: polygon,
                        symbol: {
                            type: "simple-fill",
                            color: [0, 0, 0, 0], // transparent fill
                            outline: {
                                color: [255, 255, 0, 1], // Yellow border
                                width: 3
                            }
                        }
                    });
                    boundaryLayer.add(boundaryGraphic);

                    // Auto-center map to the drawn campus
                    view.goTo({
                        target: polygon,
                        zoom: 17
                    }, { duration: 1500 });

                    // Calculate and draw the 500m community buffer (perfect circle around campus center)
                    const bufferPolygon = geometryEngine.geodesicBuffer(polygon.extent.center, 500, "meters");
                    const bufferGraphic = new Graphic({
                        geometry: bufferPolygon,
                        symbol: {
                            type: "simple-fill",
                            color: [255, 165, 0, 0.1], // light orange fill
                            outline: {
                                color: [255, 165, 0, 0.8], // Orange border
                                width: 2,
                                style: "dash"
                            }
                        }
                    });
                    boundaryLayer.add(bufferGraphic);
                });

            const basemapToggle = new BasemapToggle({
                view,
                nextBasemap: "streets-vector"
            });
            view.ui.add(basemapToggle, "top-right");
            const zoomWidget = new Zoom({ view });
            view.ui.add(zoomWidget, "top-right");

            const viewshedLayer = new GraphicsLayer({ title: "Green Sightlines" });
            const buildingLayer = new GraphicsLayer({ title: "Buildings" });
            map.addMany([buildingLayer, viewshedLayer]);

            // Fetch trees and zones to calculate sightlines
            let trees = [];
            let windows = [];

            Promise.all([
                fetch("data/mock_trees.json"),
                fetch("data/campus_zones.json")
            ])
                .then(responses => Promise.all(responses.map(res => res.json())))
                .then(([treeData, zoneData]) => {
                    const campusName = localStorage.getItem("activeCampusName") || "J.W. Caceres & M. Rivas Academy";
                    // If backend is returning a FeatureCollection, treeData[campusName] won't work perfectly if treeData is the direct feature collection. 
                    // Let's check if treeData has a 'features' array instead.
                    if (treeData.features) {
                        trees = treeData.features;
                    } else {
                        trees = treeData[campusName] || [];
                    }

                    // Extract 'windows' as points along the perimeter of Rooftops
                    let rooftops = zoneData.features.filter(f => f.properties.category === "Rooftop");

                    rooftops.forEach(roofFeature => {
                        const coords = roofFeature.geometry.coordinates[0];
                        const buildingPoly = new Polygon({ rings: coords });

                        // Render Building visually
                        buildingLayer.add(new Graphic({
                            geometry: buildingPoly,
                            symbol: {
                                type: "simple-fill",
                                color: [150, 150, 150, 0.8], // Solid grey building
                                outline: { color: [100, 100, 100, 1], width: 1 }
                            }
                        }));
                    });

                    rooftops.forEach((roof) => {
                        const ring = roof.geometry.coordinates[0];
                        // Sample points along the roof ring
                        for (let i = 0; i < ring.length; i += 2) {
                            let x = ring[i][0];
                            let y = ring[i][1];

                            windows.push([x, y]);
                        }
                    });

                    drawSightlines();
                });

            function drawSightlines() {
                viewshedLayer.removeAll();
                if (trees.length === 0 || windows.length === 0) return;

                const selectedSpecies = document.getElementById("speciesFilter").value;
                const viewDirection = document.getElementById("windowSelect").value;

                // Color palette for species
                const speciesColors = {
                    "Bur Oak": [139, 69, 19], // SaddleBrown
                    "Live Oak": [34, 139, 34], // ForestGreen
                    "Montezuma Bald Cypress": [85, 107, 47], // DarkOliveGreen
                    "Texas Pecan": [210, 105, 30], // Chocolate
                    "Mexican Sycamore": [189, 183, 107], // DarkKhaki
                    "default": [76, 175, 80] // Faint Green
                };

                let drawnCount = 0;
                let possibleCount = 0; // Total lines that theoretically exist in this direction

                // Draw a straight line from windows to trees
                windows.forEach((win) => {
                    trees.forEach((tree) => {
                        // Extract correctly from GeoJSON feature structure
                        let tLon, tLat, speciesName;
                        if (tree.geometry && tree.geometry.coordinates) {
                            tLon = tree.geometry.coordinates[0];
                            tLat = tree.geometry.coordinates[1];
                            speciesName = tree.properties ? tree.properties.species : "default";
                        } else {
                            // Fallback if data was flat
                            tLon = tree.lon;
                            tLat = tree.lat;
                            speciesName = tree.species || "default";
                        }

                        if (tLon === undefined || tLat === undefined) return;

                        // Directional Vector Filtering: Only draw line if the tree physically lies in the selected viewing angle
                        if (viewDirection === "east" && tLon <= win[0]) return;
                        if (viewDirection === "west" && tLon >= win[0]) return;
                        if (viewDirection === "north" && tLat <= win[1]) return;
                        if (viewDirection === "south" && tLat >= win[1]) return;

                        possibleCount++;

                        // Filtering logic (Species Dropdown)
                        if (selectedSpecies !== "All" && speciesName !== selectedSpecies) return;

                        // Keep a moderate density of visual lines (to prevent browser lag)
                        if (Math.random() > 0.3) return;

                        const polyline = {
                            type: "polyline",
                            paths: [[win[0], win[1]], [tLon, tLat]]
                        };

                        const lineColor = speciesColors[speciesName] || speciesColors["default"];

                        const lineSymbol = {
                            type: "simple-line",
                            color: [...lineColor, 0.6], // slightly higher alpha
                            width: 2 // Make lines thicker
                        };

                        const graphic = new Graphic({
                            geometry: polyline,
                            symbol: lineSymbol
                        });
                        viewshedLayer.add(graphic);
                        drawnCount++;
                    });
                });

                // Add tree nodes with SVGs
                trees.forEach(tree => {
                    let tLon, tLat, speciesName;
                    if (tree.geometry && tree.geometry.coordinates) {
                        tLon = tree.geometry.coordinates[0];
                        tLat = tree.geometry.coordinates[1];
                        speciesName = tree.properties ? tree.properties.species : "Unknown";
                    } else {
                        tLon = tree.lon;
                        tLat = tree.lat;
                        speciesName = tree.species || "Unknown";
                    }

                    if (tLon === undefined || tLat === undefined) return;

                    // Filtering logic
                    if (selectedSpecies !== "All" && speciesName !== selectedSpecies) return;

                    const point = {
                        type: "point",
                        longitude: tLon,
                        latitude: tLat
                    };

                    const treeSymbol = {
                        type: "picture-marker",
                        // A generic open-source tree SVG data URI
                        url: "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#2E7D32" width="48px" height="48px">
                                <path d="M12,2L5.5,10H8.5L2,19H10V22H14V19H22L15.5,10H18.5L12,2Z" />
                            </svg>
                        `),
                        width: "24px",
                        height: "24px",
                        yoffset: "12px"
                    };

                    const pointGraphic = new Graphic({
                        geometry: point,
                        symbol: treeSymbol,
                        popupTemplate: {
                            title: "Planned Tree",
                            content: `Species: <b>${speciesName}</b>`
                        }
                    });

                    viewshedLayer.add(pointGraphic);
                });

                // Update Green View Equity Score based on actual directional density!
                // An authentic metric comparing theoretical max lines to available view space.
                let densityScore = Math.min(100, Math.round((possibleCount / (windows.length * 4)) * 100));
                document.getElementById("greenScoreValue").textContent = densityScore + "%";
            }

            // Bind filter change to redraw map
            document.getElementById("speciesFilter").addEventListener("change", drawSightlines);
            document.getElementById("windowSelect").addEventListener("change", drawSightlines);
        }
    );
})();
