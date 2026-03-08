(function () {
    const config = window.APP_CONFIG;
    const timeSlider = document.getElementById("timeSlider");
    const timeReadout = document.getElementById("timeReadout");
    const surfaceTempValue = document.getElementById("surfaceTempValue");
    const comfortScoreValue = document.getElementById("comfortScoreValue");

    function updateSummary() {
        let hour = Number(timeSlider.value);
        let ampm = hour >= 12 ? 'PM' : 'AM';
        let displayHour = hour % 12;
        displayHour = displayHour ? displayHour : 12; // the hour '0' should be '12'
        timeReadout.textContent = `${displayHour}:00 ${ampm}`;

        // Mock simulation logic
        let temp = 80 + ((hour - 8) * 3);
        if (hour > 15) temp = temp - ((hour - 15) * 2);

        surfaceTempValue.innerHTML = `${temp} &deg;F`;

        if (temp < 90) { comfortScoreValue.style.color = 'var(--green)'; comfortScoreValue.textContent = 'Good'; }
        else if (temp < 100) { comfortScoreValue.style.color = 'orange'; comfortScoreValue.textContent = 'Moderate'; }
        else { comfortScoreValue.style.color = '#d9534f'; comfortScoreValue.textContent = 'Poor (Danger)'; }
    }

    timeSlider.addEventListener("input", updateSummary);
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
            // Create map focused on Donna TX
            const map = new Map({ basemap: config?.map?.basemap || "satellite" });

            const view = new MapView({
                container: "temperatureMap",
                map,
                center: config?.map?.center || [-98.0520, 26.1704],
                zoom: config?.map?.zoom || 17,
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

            // deck.gl or 3D point cloud temperature rendering logic will hook in here
        }
    );
})();
