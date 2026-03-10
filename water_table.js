(function () {
    const config = window.APP_CONFIG;

    const depthSlider = document.getElementById("depthSlider");
    const depthReadout = document.getElementById("depthReadout");
    const waterLevelIndicator = document.getElementById("waterLevelIndicator");

    const valThriving = document.getElementById("valThriving");
    const valStressed = document.getElementById("valStressed");
    const valDrowning = document.getElementById("valDrowning");
    const valDying = document.getElementById("valDying");

    window.require(
        [
            "esri/Map",
            "esri/views/MapView",
            "esri/layers/GraphicsLayer",
            "esri/Graphic",
            "esri/geometry/Polygon",
            "esri/widgets/BasemapToggle",
            "esri/widgets/Zoom"
        ],
        (Map, MapView, GraphicsLayer, Graphic, Polygon, BasemapToggle, Zoom) => {

            const map = new Map({ basemap: config?.map?.basemap || "satellite" });

            const view = new MapView({
                container: "wtMap",
                map,
                center: [-98.0700, 26.1668], // Default to campus
                zoom: config?.map?.zoom || 18,
                constraints: {
                    minZoom: config?.map?.minZoom || 16,
                    maxZoom: config?.map?.maxZoom || 19
                }
            });

            const boundaryLayer = new GraphicsLayer();
            const treeLayer = new GraphicsLayer({ title: "Water Table Resilience" });
            map.addMany([boundaryLayer, treeLayer]);

            // Widgets
            const basemapToggle = new BasemapToggle({ view, nextBasemap: "streets-vector" });
            view.ui.add(basemapToggle, "top-right");
            view.ui.add(new Zoom({ view }), "top-right");

            let treesData = [];

            Promise.all([
                fetch("data/campus_boundary.json"),
                fetch("data/mock_trees.json")
            ])
                .then(responses => Promise.all(responses.map(res => res.json())))
                .then(([boundaryData, treeJson]) => {

                    // Draw Campus Boundary and Center Map
                    if (boundaryData.features && boundaryData.features.length > 0) {
                        const coords = boundaryData.features[0].geometry.coordinates[0];
                        const polygon = new Polygon({ rings: coords });

                        boundaryLayer.add(new Graphic({
                            geometry: polygon,
                            symbol: {
                                type: "simple-fill",
                                color: [0, 0, 0, 0],
                                outline: { color: [33, 150, 243, 1], width: 3, style: "dash" } // Blue dash
                            }
                        }));

                        view.goTo({ target: polygon, zoom: 18 }, { duration: 1500 });
                    }

                    const campusName = localStorage.getItem("activeCampusName") || "J.W. Caceres & M. Rivas Academy";

                    if (treeJson.features) {
                        treesData = treeJson.features;
                    } else {
                        treesData = treeJson[campusName] || [];
                    }

                    // Initial render at default slider value
                    updateWaterTable(parseFloat(depthSlider.value));
                });

            // Reverses the slider visual visually (0 is top, 30 is bottom physically)
            // But CSS input[type="range"][orient="vertical"] has max at top.
            // Let's ensure the visual mapping is correct: value 0 = Water at surface (100% height)
            // value 30 = Water entirely gone (0% height)

            function updateWaterTable(depthFt) {
                // Update Readout
                depthReadout.textContent = depthFt.toFixed(1) + " ft";

                // Update Visual Indicator (Height % relative to 30ft max)
                let fillPercent = ((30 - depthFt) / 30) * 100;
                waterLevelIndicator.style.height = `${fillPercent}%`;

                treeLayer.removeAll();

                let countThriving = 0;
                let countStressed = 0;
                let countDrowning = 0;
                let countDead = 0;

                treesData.forEach(tree => {
                    let species = (tree.properties ? tree.properties.species : tree.species) || "Unknown";
                    let status = "thriving";

                    let color = [76, 175, 80, 0.9]; // Green
                    let outlineColor = [56, 142, 60, 1];
                    let size = "14px";
                    let markerStyle = "circle";

                    // === ROOT TOLERANCE LOGIC ===

                    if (species === "Montezuma Cypress" || species === "Montezuma Bald Cypress") {
                        // Obligate Wetland / Riparian Edge
                        if (depthFt <= 6) { status = "thriving"; }
                        else if (depthFt > 6 && depthFt <= 15) { status = "stressed"; }
                        else { status = "dead"; }
                    }
                    else if (species === "Texas Pecan" || species === "Live Oak" || species === "Honey Mesquite") {
                        // Deep Taproots
                        if (depthFt < 3) { status = "drowning"; }
                        else if (depthFt >= 3 && depthFt <= 25) { status = "thriving"; }
                        else { status = "stressed"; }
                    }
                    else {
                        // Standard / Adaptable (Mexican Sycamore, Retama, Desert Willow, Anacua)
                        if (depthFt < 2) { status = "drowning"; }
                        else if (depthFt >= 2 && depthFt <= 15) { status = "thriving"; }
                        else if (depthFt > 15 && depthFt <= 25) { status = "stressed"; }
                        else { status = "dead"; }
                    }

                    // Map Status to Visuals
                    if (status === "thriving") {
                        countThriving++;
                        color = [76, 175, 80, 0.9];
                    } else if (status === "stressed") {
                        countStressed++;
                        color = [255, 152, 0, 0.9]; // Orange
                        outlineColor = [245, 124, 0, 1];
                        markerStyle = "square";
                    } else if (status === "drowning") {
                        countDrowning++;
                        color = [156, 39, 176, 0.9]; // Purple/Rot
                        outlineColor = [123, 31, 162, 1];
                        markerStyle = "square";
                    } else if (status === "dead") {
                        countDead++;
                        color = [244, 67, 54, 0.9]; // Red
                        outlineColor = [211, 47, 47, 1];
                        markerStyle = "cross";
                        size = "16px";
                    }

                    let tLon = tree.geometry ? tree.geometry.coordinates[0] : tree.lon;
                    let tLat = tree.geometry ? tree.geometry.coordinates[1] : tree.lat;

                    const point = { type: "point", longitude: tLon, latitude: tLat };

                    const markerSymbol = {
                        type: "simple-marker",
                        style: markerStyle,
                        color: color,
                        size: size,
                        outline: { color: outlineColor, width: 2 }
                    };

                    const graphic = new Graphic({
                        geometry: point,
                        symbol: markerSymbol,
                        popupTemplate: {
                            title: `Species: ${species}`,
                            content: `
                                <b>Status:</b> ${status.toUpperCase()}<br>
                                <b>Water Table Depth:</b> ${depthFt.toFixed(1)} ft<br><br>
                                <small>Calculated based on root access profiles and anoxic stress limits.</small>
                            `
                        }
                    });

                    treeLayer.add(graphic);
                });

                // Update Counters
                valThriving.textContent = countThriving;
                valStressed.textContent = countStressed;
                valDrowning.textContent = countDrowning;
                valDying.textContent = countDead;
            }

            // Slider Event Listener (Reverse the input range so pushing UP means shallower water/closer to 0)
            depthSlider.addEventListener("input", (e) => {
                let rawVal = parseFloat(e.target.value);
                // HTML range sliders are tricky when vertical. Max is top.
                // In our logic, 0 = Flood (Top of soil), 30 = Deep drought (Bottom of soil)
                // We want pushing the slider UP to mean raising the water (towards 0).
                // So let's invert the output calculated based on the slider value.
                // Assuming standard vertical input puts 30 at top and 0 at bottom:
                // We want Top = 0.
                let depthFt = 30 - rawVal;
                if (depthFt < 0) depthFt = 0;

                updateWaterTable(depthFt);
            });

            // Fix Initial Label due to the inversion logic
            // Default slider value is 12. depth = 30 - 12 = 18.
            // Let's explicitly set UI state on load to match the slider center (depth ~15ft)
            depthSlider.value = 15;
            updateWaterTable(15);
        });
})();
