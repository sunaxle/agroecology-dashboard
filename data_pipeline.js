document.addEventListener("DOMContentLoaded", () => {

    // 1. Campus Persistence
    const campusName = localStorage.getItem("activeCampusName") || "J.W. Caceres & M. Rivas Academy";
    let activeLng = parseFloat(localStorage.getItem("activeCampusLng"));
    let activeLat = parseFloat(localStorage.getItem("activeCampusLat"));
    let mapCenter = !isNaN(activeLng) && !isNaN(activeLat) ? [activeLng, activeLat] : [-98.0520, 26.1704];

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

    // 2. Kiosk Mode Toggle Logic
    const kioskBtn = document.getElementById("btnKioskToggle");
    const appHeader = document.querySelector(".app-header");
    const appNav = document.querySelector(".app-nav");
    const rPanel = document.querySelector(".panel-right");

    let isKiosk = false;
    kioskBtn.addEventListener("click", () => {
        isKiosk = !isKiosk;
        if (isKiosk) {
            appNav.style.display = "none";
            rPanel.style.display = "none";
            document.body.style.background = "#000";
            document.getElementById("mainGrid").style.height = "100vh";
            document.getElementById("mainGrid").style.gridTemplateColumns = "350px 1fr";
            kioskBtn.textContent = "Exit Kiosk";
            kioskBtn.style.background = "var(--text)";
        } else {
            appNav.style.display = "flex";
            rPanel.style.display = "block";
            document.body.style.background = "";
            document.getElementById("mainGrid").style.height = "calc(100vh - 120px)";
            document.getElementById("mainGrid").style.gridTemplateColumns = "350px 1fr 400px";
            kioskBtn.textContent = "Enter Kiosk Mode";
            kioskBtn.style.background = "#2196F3";
        }
    });

    // 3. Media Gallery Logic (DSLR/Thermal)
    const mediaDisplay = document.getElementById("mediaDisplay");
    const mediaPlaceholder = document.getElementById("mediaPlaceholder");
    const mediaTimestamp = document.getElementById("mediaTimestamp");
    const mediaSelector = document.getElementById("mediaSelector");

    // Hardcoded mock feeds until FTP API is built
    const mediaFeeds = {
        "thermal": {
            url: "https://images.unsplash.com/photo-1590494025134-874e4be24c7f?q=80&w=600&auto=format&fit=crop", // placeholder
            timestamp: "Baseline Capture (Thermal)"
        },
        "timelapse": {
            url: "https://images.unsplash.com/photo-1448375240586-882707db8855?q=80&w=600&auto=format&fit=crop", // placeholder green tree
            timestamp: "Live Feed: North Node"
        }
    };

    mediaSelector.addEventListener("change", (e) => {
        const feed = mediaFeeds[e.target.value];
        if (feed) {
            mediaPlaceholder.style.display = "none";
            mediaDisplay.style.display = "block";
            mediaDisplay.src = feed.url;
            mediaTimestamp.textContent = feed.timestamp;
            // Add a simple flicker effect to mimic feed switching
            mediaDisplay.style.opacity = 0.5;
            setTimeout(() => mediaDisplay.style.opacity = 1, 200);
        }
    });
    // Trigger initial load
    mediaSelector.dispatchEvent(new Event('change'));

    // 4. Initialize ArcGIS Map
    require([
        "esri/Map",
        "esri/views/MapView",
        "esri/layers/GraphicsLayer",
        "esri/Graphic",
        "esri/geometry/Polygon",
        "esri/geometry/Point",
        "esri/geometry/support/webMercatorUtils"
    ], function (Map, MapView, GraphicsLayer, Graphic, Polygon, Point, webMercatorUtils) {

        const map = new Map({ basemap: "satellite" });
        const zoneLayer = new GraphicsLayer({ title: "Custom Zones", opacity: 0.6 });
        const deviceLayer = new GraphicsLayer({ title: "HOBO/Camera Hardware" });

        map.addMany([zoneLayer, deviceLayer]);

        const view = new MapView({
            container: "loggerMap",
            map: map,
            center: mapCenter,
            zoom: 17
        });

        // Parse LocalStorage Zones (drawn in zoning.html)
        try {
            const savedZones = localStorage.getItem(`zones_${campusName}`);
            if (savedZones) {
                const zones = JSON.parse(savedZones);
                zones.forEach(z => {
                    const polygon = new Polygon({ rings: z.geometry.rings });

                    // Derive color loosely based on category config in zoning.js
                    let c = [255, 255, 255, 0.2];
                    let outlineColor = [255, 255, 255, 0.8];
                    let outlineWidth = 1;

                    if (z.category === "Campus Boundary") {
                        c = [156, 39, 176, 0.05];
                        outlineColor = [156, 39, 176, 1];
                        outlineWidth = 2;
                    }
                    else if (z.category === "Rooftop") c = [158, 158, 158, 0.5];
                    else if (z.category === "Parking Lot") c = [66, 66, 66, 0.4];
                    else if (z.category === "Courtyard") c = [255, 193, 7, 0.3];
                    else if (z.category === "Open Land") c = [76, 175, 80, 0.3];

                    const graphic = new Graphic({
                        geometry: polygon,
                        symbol: {
                            type: "simple-fill",
                            color: c,
                            outline: { width: outlineWidth, color: outlineColor }
                        },
                        popupTemplate: { title: "Delineated Area", content: `Zone Type: **${z.category}**` }
                    });
                    zoneLayer.add(graphic);
                });
            }
        } catch (e) {
            console.error("Failed to parse local zones.", e);
        }

        // Mock Hardware Coordinates dynamically centered on drawn zones
        view.when(() => {
            let trueCenterLat = mapCenter[1];
            let trueCenterLng = mapCenter[0];

            // Calculate true center based on the drawn polygons
            try {
                const savedZones = localStorage.getItem(`zones_${campusName}`);
                if (savedZones) {
                    const zones = JSON.parse(savedZones);
                    if (zones.length > 0) {
                        // Grab the first ring of the first drawn property to use as anchor
                        let x = zones[0].geometry.rings[0][0][0];
                        let y = zones[0].geometry.rings[0][0][1];
                        if (Math.abs(x) > 180) {
                            trueCenterLng = (x / 20037508.34) * 180;
                            trueCenterLat = (Math.atan(Math.exp((y / 20037508.34) * Math.PI)) * 360 / Math.PI) - 90;
                        } else {
                            trueCenterLng = x;
                            trueCenterLat = y;
                        }
                    }
                }
            } catch (e) { }

            const hardwareNodes = [
                { type: "RX2106 Base Station", lat: trueCenterLat, lon: trueCenterLng, color: [33, 150, 243] }, // Blue
                { type: "EC-5 Soil Node (Shaded)", lat: trueCenterLat + 0.0001, lon: trueCenterLng - 0.0001, color: [76, 175, 80] }, // Green
                { type: "EC-5 Soil Node (Exposed)", lat: trueCenterLat - 0.0002, lon: trueCenterLng + 0.0001, color: [255, 152, 0] }, // Orange
                { type: "FLIR Thermal Camera", lat: trueCenterLat + 0.00005, lon: trueCenterLng + 0.0002, color: [244, 67, 54] }, // Red
                { type: "Time-Lapse DSLR", lat: trueCenterLat - 0.0001, lon: trueCenterLng - 0.0002, color: [156, 39, 176] } // Purple
            ];

            hardwareNodes.forEach(node => {
                const point = new Point({ longitude: node.lon, latitude: node.lat });
                const graphic = new Graphic({
                    geometry: point,
                    symbol: {
                        type: "simple-marker",
                        color: node.color,
                        size: 14,
                        outline: { color: [255, 255, 255], width: 2 }
                    },
                    popupTemplate: { title: "Hardware Node", content: `<strong>${node.type}</strong><br>Telemetry Active` }
                });
                deviceLayer.add(graphic);
            });
        });
    });

    // 5. Chart.js Implementation for Microclimate
    const ctxTemp = document.getElementById('chartTempRH').getContext('2d');

    // Initialize empty chart arrays
    const timeLabels = [];
    const tempSeries = [];
    const rhSeries = [];

    const liveChart = new Chart(ctxTemp, {
        type: 'line',
        data: {
            labels: timeLabels,
            datasets: [
                {
                    label: 'Temp (°F)',
                    data: tempSeries,
                    borderColor: '#ff5722',
                    backgroundColor: 'rgba(255, 87, 34, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y'
                },
                {
                    label: 'Humidity (%)',
                    data: rhSeries,
                    borderColor: '#03a9f4',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    tension: 0.4,
                    borderDash: [5, 5],
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 400,
                easing: 'linear'
            },
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: { display: false },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    min: 70, max: 110,
                    grid: { color: '#eee' }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    min: 20, max: 100,
                    grid: { drawOnChartArea: false }
                }
            }
        }
    });

    // 6. Real-time Mock Datalink (Simulating HOBOlink API Polling every 2.5s)
    let tempF = 85.2;
    let humidity = 45.0;

    setInterval(() => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        // Random walk the metrics
        tempF += (Math.random() - 0.45) * 0.5; // slight upward drift
        humidity += (Math.random() - 0.55) * 0.5; // slight downward drift

        // Bound checks
        if (tempF > 105) tempF = 105;
        if (tempF < 75) tempF = 75;
        if (humidity > 95) humidity = 95;
        if (humidity < 30) humidity = 30;

        // Push to UI Strings
        document.getElementById("valTemp").textContent = tempF.toFixed(1) + "°F";
        document.getElementById("valRH").textContent = humidity.toFixed(0) + "%";

        // Soil
        document.getElementById("valSoil1").textContent = (Math.random() * 2 + 22).toFixed(1) + "%"; // Shaded
        document.getElementById("valSoil2").textContent = (Math.random() * 2 + 12).toFixed(1) + "%"; // Exposed

        // Radiation/Wind (fluctuates more rapidly)
        document.getElementById("valPAR").textContent = Math.floor(Math.random() * 200 + 1200);
        document.getElementById("valSolar").textContent = Math.floor(Math.random() * 100 + 700) + " W";
        document.getElementById("valWind").textContent = (Math.random() * 3 + 1).toFixed(2) + " m/s";

        // Push to Chart
        timeLabels.push(timeStr);
        tempSeries.push(tempF);
        rhSeries.push(humidity);

        // Keep trailing window of 25 data points
        if (timeLabels.length > 25) {
            timeLabels.shift();
            tempSeries.shift();
            rhSeries.shift();
        }

        liveChart.update();

    }, 2500); // Fire every 2.5 seconds to feel "Live"

    // 7. Temporal Photography Gallery Logic
    const tempBtns = document.querySelectorAll(".temporal-btn");
    const tempImg = document.getElementById("temporalImageDisplay");
    const tempOverlay = document.getElementById("temporalOverlay");

    const phaseData = {
        "baseline": { src: "assets/baseline_field.png", text: "Phase 1: Barren Field Baseline (Oct 2024)" },
        "year1": { src: "assets/year_1_saplings.png", text: "Phase 2: Initial Planting & Mulch (Spring 2025)" },
        "year5": { src: "assets/year_5_canopy.png", text: "Phase 3: Dense Young Canopy Established (2029)" },
        "year10": { src: "assets/year_10_mature.png", text: "Phase 4: Mature Native Microforest (2034+)" }
    };

    tempBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            // Reset all buttons
            tempBtns.forEach(b => {
                b.style.background = "#e0e0e0";
                b.style.color = "#333";
            });

            // Set active
            btn.style.background = "var(--green)";
            btn.style.color = "white";

            const phase = btn.getAttribute("data-phase");
            if (phaseData[phase]) {
                tempImg.style.opacity = 0; // fade out
                setTimeout(() => {
                    tempImg.src = phaseData[phase].src;
                    tempOverlay.textContent = phaseData[phase].text;
                    tempImg.style.opacity = 1; // fade in
                }, 300);
            }
        });
    });

});
