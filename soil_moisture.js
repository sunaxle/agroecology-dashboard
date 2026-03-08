document.addEventListener("DOMContentLoaded", () => {
    // 1. Campus Persistence
    const campusName = localStorage.getItem("activeCampusName") || "J.W. Caceres & M. Rivas Academy";
    let activeLng = parseFloat(localStorage.getItem("activeCampusLng"));
    let activeLat = parseFloat(localStorage.getItem("activeCampusLat"));
    let mapCenter = !isNaN(activeLng) && !isNaN(activeLat) ? [activeLng, activeLat] : [-98.0700, 26.1668]; // default JWC

    // Deep Check: If user drew zones, use the first point of the first zone to perfectly lock the camera
    try {
        const savedZones = localStorage.getItem(`zones_${campusName}`);
        if (savedZones) {
            const zones = JSON.parse(savedZones);
            if (zones.length > 0) {
                let x = zones[0].geometry.rings[0][0][0];
                let y = zones[0].geometry.rings[0][0][1];

                if (Math.abs(x) > 180) { // It's WebMercator
                    const lon = (x / 20037508.34) * 180;
                    const lat = (Math.atan(Math.exp((y / 20037508.34) * Math.PI)) * 360 / Math.PI) - 90;
                    mapCenter = [lon, lat];
                } else {
                    mapCenter = [x, y];
                }
            }
        }
    } catch (e) { console.error("Could not parse map center from zones", e) }

    document.getElementById("campusNameDisplay").textContent = campusName;

    // 2. UI Controls
    const rainSlider = document.getElementById("rainSlider");
    const rainReadout = document.getElementById("rainReadout");
    const exposedVal = document.getElementById("exposedMoistureValue");
    const shadedVal = document.getElementById("shadedMoistureValue");

    let daysSinceRain = 3;

    function updateMetrics() {
        daysSinceRain = parseInt(rainSlider.value, 10);
        rainReadout.textContent = `${daysSinceRain} Day${daysSinceRain === 1 ? '' : 's'}`;

        // Exposed soil loses moisture rapidly (exponential decay sim)
        let exposedM = 85 * Math.pow(0.5, daysSinceRain);
        // Shaded soil base loses moisture slowly
        let shadedM = 95 * Math.pow(0.85, daysSinceRain);

        // Floor limits
        if (exposedM < 2) exposedM = 2;
        if (shadedM < 15) shadedM = 15;

        exposedVal.textContent = exposedM.toFixed(1) + "%";
        shadedVal.textContent = shadedM.toFixed(1) + "%";

        // Color coding for exposed
        if (exposedM > 30) exposedVal.style.color = "#2196F3"; // Blue
        else if (exposedM > 15) exposedVal.style.color = "#4CAF50"; // Green
        else exposedVal.style.color = "#FF9800"; // Orange
        if (exposedM < 5) exposedVal.style.color = "#d9534f"; // Red

        // Color coding for shaded
        if (shadedM > 30) shadedVal.style.color = "#2196F3";
        else if (shadedM > 15) shadedVal.style.color = "#4CAF50";
        else shadedVal.style.color = "#FF9800";

        // trigger map update if it exists
        if (window.updateMoistureMap) {
            window.updateMoistureMap(daysSinceRain);
        }
    }

    rainSlider.addEventListener("input", updateMetrics);
    updateMetrics(); // Init

    // 3. ArcGIS Map Init
    require([
        "esri/Map",
        "esri/views/MapView",
        "esri/layers/GraphicsLayer",
        "esri/Graphic",
        "esri/geometry/Polygon",
        "esri/geometry/Point",
        "esri/geometry/geometryEngine"
    ], function (Map, MapView, GraphicsLayer, Graphic, Polygon, Point, geometryEngine) {

        const map = new Map({ basemap: "satellite" });

        // Layers
        const mockMoistureBaseLayer = new GraphicsLayer({ title: "Background Soil Moisture", opacity: 0.5 });
        const treeBaseMoistureLayer = new GraphicsLayer({ title: "Tree Root Moisture Retention", opacity: 0.7 });

        map.addMany([mockMoistureBaseLayer, treeBaseMoistureLayer]);

        const view = new MapView({
            container: "moistureMap",
            map: map,
            center: mapCenter,
            zoom: 18
        });

        let treePoints = [];

        // Try to fetch mock trees to render high-moisture zones under them
        fetch("data/mock_trees.json")
            .then(res => res.json())
            .then(data => {
                let campusData = [];
                if (data.features) {
                    campusData = data.features;
                } else {
                    campusData = data[campusName] || [];
                }

                // if empty, drop a few mock points around center
                if (campusData.length > 0) {
                    treePoints = campusData.map(node => {
                        let tLon, tLat;
                        if (node.geometry && node.geometry.coordinates) {
                            tLon = node.geometry.coordinates[0];
                            tLat = node.geometry.coordinates[1];
                        } else {
                            tLon = node.lon;
                            tLat = node.lat;
                        }
                        return new Point({ longitude: tLon, latitude: tLat });
                    });
                } else {
                    for (let i = 0; i < 15; i++) {
                        treePoints.push(new Point({
                            longitude: mapCenter[0] + (Math.random() - 0.5) * 0.002,
                            latitude: mapCenter[1] + (Math.random() - 0.5) * 0.002
                        }));
                    }
                }

                // Draw initial state
                renderMoisture(daysSinceRain);
            })
            .catch(e => console.log("Tree data fetch error", e));

        window.updateMoistureMap = function (days) {
            renderMoisture(days);
        };

        function renderMoisture(days) {
            treeBaseMoistureLayer.removeAll();
            mockMoistureBaseLayer.removeAll();

            // Background exposed soil (we'll just draw a large semi-transparent polygon over the whole immediate area)
            const extentPoints = [
                [mapCenter[0] - 0.005, mapCenter[1] - 0.005],
                [mapCenter[0] - 0.005, mapCenter[1] + 0.005],
                [mapCenter[0] + 0.005, mapCenter[1] + 0.005],
                [mapCenter[0] + 0.005, mapCenter[1] - 0.005],
                [mapCenter[0] - 0.005, mapCenter[1] - 0.005]
            ];

            const backgroundPoly = new Polygon({ rings: [extentPoints] });

            // Calculate base color based on days
            let bgAlpha = 0.5;
            let bgColor = [255, 152, 0]; // Dry orange
            if (days <= 1) bgColor = [33, 150, 243]; // Wet blue
            else if (days <= 4) bgColor = [76, 175, 80]; // Mod green

            const bgGraphic = new Graphic({
                geometry: backgroundPoly,
                symbol: {
                    type: "simple-fill",
                    color: [...bgColor, bgAlpha],
                    outline: { width: 0 }
                }
            });
            mockMoistureBaseLayer.add(bgGraphic);

            // Draw moisture circles under trees
            treePoints.forEach(pt => {
                // Trees retain moisture much longer.

                // Base radius of moisture pool
                let rMeters = 5 + (Math.random() * 3);

                let treeAlpha = 0.7;
                let treeColor = [33, 150, 243]; // Default blue (wet)

                if (days > 7) {
                    treeColor = [76, 175, 80]; // Turns green after a week
                    treeAlpha = 0.6;
                    rMeters *= 0.8; // Shrinks slightly
                }
                if (days > 12) {
                    treeColor = [255, 152, 0]; // Starts drying out at nearly 2 weeks without rain
                    treeAlpha = 0.5;
                    rMeters *= 0.6;
                }

                const circle = geometryEngine.geodesicBuffer(pt, rMeters, "meters");

                const treeMoistureGraphic = new Graphic({
                    geometry: circle,
                    symbol: {
                        type: "simple-fill",
                        color: [...treeColor, treeAlpha],
                        outline: { width: 0 }
                    }
                });
                treeBaseMoistureLayer.add(treeMoistureGraphic);
            });
        }
    });

});
