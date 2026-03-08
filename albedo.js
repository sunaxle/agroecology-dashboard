document.addEventListener("DOMContentLoaded", () => {
    // 1. Campus Persistence
    const campusName = localStorage.getItem("activeCampusName") || "J.W. Caceres & M. Rivas Academy";
    let activeLng = parseFloat(localStorage.getItem("activeCampusLng"));
    let activeLat = parseFloat(localStorage.getItem("activeCampusLat"));
    let mapCenter = !isNaN(activeLng) && !isNaN(activeLat) ? [activeLng, activeLat] : [-98.0700, 26.1668];

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

    // 2. Select Filter Logic
    const typeSelect = document.getElementById("albedoTypeSelect");
    const riskVal = document.getElementById("riskValue");
    const riskText = document.getElementById("riskText");

    typeSelect.addEventListener("change", (e) => {
        const val = e.target.value;
        if (val === "all") {
            riskVal.textContent = "High";
            riskVal.style.color = "#d9534f"; // Red
            riskText.textContent = "Large continuous expanses of asphalt increase ambient temperatures by 5-8°F.";
        } else if (val === "parking") {
            riskVal.textContent = "Severe";
            riskVal.style.color = "#8b0000"; // Dark Red
            riskText.textContent = "Asphalt absorbs up to 95% of solar radiation, re-emitting it as sensible heat.";
        } else if (val === "roof") {
            riskVal.textContent = "Moderate";
            riskVal.style.color = "#FF9800"; // Orange
            riskText.textContent = "Standard roofs absorb heat, increasing AC load inside and ambient temps outside.";
        } else if (val === "veg") {
            riskVal.textContent = "Cooling";
            riskVal.style.color = "#4CAF50"; // Green
            riskText.textContent = "High albedo and evapo-transpiration naturally cool the surrounding microclimate.";
        }

        if (window.filterAlbedoMap) {
            window.filterAlbedoMap(val);
        }
    });

    // 3. ArcGIS Map Init
    require([
        "esri/Map",
        "esri/views/MapView",
        "esri/layers/GraphicsLayer",
        "esri/Graphic",
        "esri/geometry/Polygon",
        "esri/geometry/geometryEngine"
    ], function (Map, MapView, GraphicsLayer, Graphic, Polygon, geometryEngine) {

        const map = new Map({ basemap: "satellite" });
        const surfaceLayer = new GraphicsLayer({ title: "Surface Albedo Analysis", opacity: 0.8 });

        map.add(surfaceLayer);

        const view = new MapView({
            container: "albedoMap",
            map: map,
            center: mapCenter,
            zoom: 18
        });

        let allZones = [];

        // Try to fetch custom zones (user generated) or fallback to static json
        function loadZones() {
            let zones = [];
            try {
                const savedModes = localStorage.getItem(`zones_${campusName}`);
                if (savedModes) zones = JSON.parse(savedModes);
            } catch (e) { }

            if (zones.length > 0) {
                renderZones(zones);
            } else {
                fetch("data/campus_zones.json")
                    .then(res => res.json())
                    .then(data => {
                        // GeoJSON format mapping
                        zones = data.features.map(f => ({
                            category: f.properties.category,
                            geometry: { rings: f.geometry.coordinates }
                        }));
                        renderZones(zones);
                    })
                    .catch(e => console.log("Failed to load zones", e));
            }
        }

        function renderZones(zones) {
            allZones = zones;
            drawSurfaces("all");
        }

        function drawSurfaces(filterType) {
            surfaceLayer.removeAll();

            allZones.forEach(z => {
                let show = false;
                let color = [255, 255, 255, 0];

                // Map UI filter to category types
                if (filterType === "all") show = true;
                if (filterType === "parking" && z.category === "Parking Lot") show = true;
                if (filterType === "roof" && z.category === "Rooftop") show = true;
                if (filterType === "veg" && (z.category === "Open Land" || z.category === "Courtyard" || z.category === "Front Yard")) show = true;

                if (!show) return;

                // Color based on Albedo (Heat Absorption)
                if (z.category === "Parking Lot") color = [244, 67, 54, 0.7]; // Red = Hot/Low Albedo
                else if (z.category === "Rooftop") color = [255, 152, 0, 0.6]; // Orange = Warm/Med Albedo
                else if (z.category === "Open Land" || z.category === "Front Yard" || z.category === "Courtyard") color = [76, 175, 80, 0.6]; // Green = Cool/High Albedo
                else color = [255, 255, 255, 0.3]; // Default unknown

                const polygon = new Polygon({ rings: z.geometry.rings });
                const graphic = new Graphic({
                    geometry: polygon,
                    symbol: {
                        type: "simple-fill",
                        color: color,
                        outline: { width: 1, color: [255, 255, 255, 0.8] }
                    },
                    popupTemplate: { title: "Surface Material", content: `<strong>Category:</strong> ${z.category}` }
                });

                surfaceLayer.add(graphic);
            });
        }

        window.filterAlbedoMap = drawSurfaces;

        // Init load
        loadZones();
    });
});
