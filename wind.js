(function () {
    const config = window.APP_CONFIG;
    const windSpeedSlider = document.getElementById("windSpeed");
    const windSpeedReadout = document.getElementById("windSpeedReadout");
    const windDirectionSelect = document.getElementById("windDirection");

    function updateSummary() {
        windSpeedReadout.textContent = `${windSpeedSlider.value} mph`;
    }

    windSpeedSlider.addEventListener("input", updateSummary);
    windDirectionSelect.addEventListener("change", updateSummary);

    updateSummary();

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
            let activeLng = parseFloat(localStorage.getItem("activeCampusLng"));
            let activeLat = parseFloat(localStorage.getItem("activeCampusLat"));

            // Convert WebMercator to GPS if necessary
            if (!isNaN(activeLng) && !isNaN(activeLat)) {
                if (Math.abs(activeLng) > 180) {
                    const lon = (activeLng / 20037508.34) * 180;
                    const lat = (Math.atan(Math.exp((activeLat / 20037508.34) * Math.PI)) * 360 / Math.PI) - 90;
                    activeLng = lon;
                    activeLat = lat;
                }
            }

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
                container: "windMap",
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

            const windLayer = new GraphicsLayer({ title: "Wind Vectors" });
            const windbreakLayer = new GraphicsLayer({ title: "Proposed Windbreaks", visible: false });
            map.addMany([windLayer, windbreakLayer]);

            // Setup Windbreaks
            document.getElementById("toggleWindbreaksBtn").addEventListener("click", () => {
                windbreakLayer.visible = !windbreakLayer.visible;
                document.getElementById("toggleWindbreaksBtn").textContent = windbreakLayer.visible ? "Hide Windbreaks" : "Show Windbreaks";
                document.getElementById("toggleWindbreaksBtn").style.background = windbreakLayer.visible ? "#ccc" : "var(--green-light)";
            });

            // Draw some mock proposed windbreak lines around the campus
            const windbreakLines = [
                [
                    [mapCenter[0] + 0.001, mapCenter[1] - 0.0015],
                    [mapCenter[0] + 0.002, mapCenter[1] - 0.001],
                    [mapCenter[0] + 0.0025, mapCenter[1] - 0.0005]
                ],
                [
                    [mapCenter[0] - 0.001, mapCenter[1] + 0.002],
                    [mapCenter[0], mapCenter[1] + 0.002],
                    [mapCenter[0] + 0.001, mapCenter[1] + 0.0015]
                ]
            ];

            windbreakLines.forEach(path => {
                const graphic = new Graphic({
                    geometry: { type: "polyline", paths: [path] },
                    symbol: {
                        type: "simple-line",
                        color: [34, 139, 34, 0.9], // Forest Green
                        width: 6,
                        style: "short-dash"
                    },
                    popupTemplate: { title: "Proposed Windbreak", content: "Dense tree planting to disrupt wind corridors." }
                });
                windbreakLayer.add(graphic);
            });

            // Draw Wind Vectors (Streaks)
            let animationFrameId;
            let offset = 0;

            function drawWindVectors() {
                windLayer.removeAll();
                const speed = parseInt(windSpeedSlider.value);
                if (speed === 0) return;

                const dir = windDirectionSelect.value;
                let dx = 0, dy = 0;

                // SE blows to NW
                if (dir === "SE") { dx = -0.0001; dy = 0.0001; }
                // N blows to S
                if (dir === "N") { dx = 0; dy = -0.00015; }
                // S blows to N
                if (dir === "S") { dx = 0; dy = 0.00015; }

                // Modify line length by speed
                const speedMult = speed / 15;
                dx *= speedMult;
                dy *= speedMult;

                const cols = 20;
                const rows = 20;
                const spanLng = 0.008;
                const spanLat = 0.008;

                const startLng = mapCenter[0] - spanLng / 2;
                const startLat = mapCenter[1] - spanLat / 2;

                const vecSymbol = {
                    type: "simple-line",
                    color: [200, 200, 200, 0.6],
                    width: 2,
                    style: "short-dot"
                };

                for (let i = 0; i < cols; i++) {
                    for (let j = 0; j < rows; j++) {
                        // stagger grid slightly
                        let x = startLng + (i * spanLng / cols) + ((j % 2) * 0.0001);
                        let y = startLat + (j * spanLat / rows);

                        // animate by shifting
                        let animDx = dx * (offset % 10);
                        let animDy = dy * (offset % 10);

                        // Calculate end point
                        let endX = x + dx * 2 + animDx;
                        let endY = y + dy * 2 + animDy;
                        let startX = x + animDx;
                        let startY = y + animDy;

                        // Check if line hits a windbreak (simplified: just reduce vector if it's near center where windbreaks are)
                        let isBlocked = windbreakLayer.visible &&
                            Math.abs(startX - mapCenter[0]) < 0.0015 &&
                            Math.abs(startY - mapCenter[1]) < 0.0015;

                        if (isBlocked) {
                            endX = startX + (dx * 0.2); // drastically slow wind behind break
                            endY = startY + (dy * 0.2);
                        }

                        const line = {
                            type: "polyline",
                            paths: [[startX, startY], [endX, endY]]
                        };

                        windLayer.add(new Graphic({ geometry: line, symbol: vecSymbol }));
                    }
                }
            }

            function animate() {
                offset += 0.2;
                drawWindVectors();
                animationFrameId = requestAnimationFrame(animate);
            }

            // Start animation
            animate();

            // Interactivity
            windDirectionSelect.addEventListener("change", drawWindVectors);
            windSpeedSlider.addEventListener("input", drawWindVectors);
        }
    );
})();
