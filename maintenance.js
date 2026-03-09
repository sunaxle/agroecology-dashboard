(function () {
    const config = window.APP_CONFIG;

    // UI Elements
    const timeSlider = document.getElementById("timeSlider");
    const yearDisplay = document.getElementById("yearDisplay");
    const valHealthy = document.getElementById("valHealthy");
    const valPrune = document.getElementById("valPrune");
    const valDrought = document.getElementById("valDrought");
    const valDead = document.getElementById("valDead");
    const alertBox = document.getElementById("interventionAlert");
    const alertText = document.getElementById("alertText");

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

            const map = new Map({ basemap: config?.map?.basemap || "satellite" });

            const view = new MapView({
                container: "maintenanceMap",
                map,
                center: [-98.0700, 26.1668], // Temp default
                zoom: config?.map?.zoom || 18,
                constraints: {
                    minZoom: config?.map?.minZoom || 16,
                    maxZoom: config?.map?.maxZoom || 19
                }
            });

            const boundaryLayer = new GraphicsLayer();
            const treeLayer = new GraphicsLayer({ title: "Maintenance Tracking" });
            map.addMany([boundaryLayer, treeLayer]);

            // Widgets
            const basemapToggle = new BasemapToggle({ view, nextBasemap: "streets-vector" });
            view.ui.add(basemapToggle, "top-right");
            view.ui.add(new Zoom({ view }), "top-right");

            // Global Data vars
            let treesData = [];

            // A deterministic pseudo-random function based on coordinates to ensure 
            // the same tree dies or needs pruning every time we drag the slider back and forth.
            function pseudoRandom(lon, lat) {
                let seed = Math.abs(lon * lat * 100000);
                let x = Math.sin(seed++) * 10000;
                return x - Math.floor(x);
            }

            Promise.all([
                fetch("data/campus_boundary.json"),
                fetch("data/mock_trees.json")
            ])
                .then(responses => Promise.all(responses.map(res => res.json())))
                .then(([boundaryData, treeJson]) => {

                    // Draw Campus Boundary and center
                    if (boundaryData.features && boundaryData.features.length > 0) {
                        const coords = boundaryData.features[0].geometry.coordinates[0];
                        const polygon = new Polygon({ rings: coords });

                        boundaryLayer.add(new Graphic({
                            geometry: polygon,
                            symbol: {
                                type: "simple-fill",
                                color: [0, 0, 0, 0],
                                outline: { color: [255, 255, 0, 1], width: 3, style: "dash" }
                            }
                        }));

                        view.goTo({ target: polygon, zoom: 18 }, { duration: 1500 });
                    }

                    // Load Trees
                    const campusName = localStorage.getItem("activeCampusName") || "J.W. Caceres & M. Rivas Academy";

                    if (treeJson.features) {
                        treesData = treeJson.features;
                    } else {
                        treesData = treeJson[campusName] || [];
                    }

                    // Pre-process trees to assign them a permanent random 'DNA' seed
                    treesData.forEach(tree => {
                        let tLon = tree.geometry ? tree.geometry.coordinates[0] : tree.lon;
                        let tLat = tree.geometry ? tree.geometry.coordinates[1] : tree.lat;
                        tree._seed = pseudoRandom(tLon, tLat);
                        tree._species = (tree.properties ? tree.properties.species : tree.species) || "Unknown";
                    });

                    // Initial render at Year 1
                    renderTrees(1);
                });

            // The Schoeneman (1994) maintenance logic engine
            function renderTrees(currentYear) {
                treeLayer.removeAll();

                let countHealthy = 0;
                let countPrune = 0;
                let countDrought = 0;
                let countDead = 0;

                // Alerts logic
                let isDroughtYear = (currentYear % 4 === 0); // Severe drought every 4 years
                let isMajorPruneYear = (currentYear % 3 === 0);

                if (isDroughtYear) {
                    alertBox.style.display = "block";
                    alertBox.style.borderLeftColor = "#2196F3";
                    alertBox.querySelector("h3").style.color = "#1976D2";
                    alertBox.querySelector("h3").textContent = "Severe DROUGHT Event";
                    alertText.textContent = `Year ${currentYear} triggers regional drought protocols. Trees with shallow roots require manual irrigation.`;
                } else if (isMajorPruneYear) {
                    alertBox.style.display = "block";
                    alertBox.style.borderLeftColor = "#FF9800";
                    alertBox.querySelector("h3").style.color = "#E65100";
                    alertBox.querySelector("h3").textContent = "Pruning Cycle Required";
                    alertText.textContent = `Year ${currentYear} requires structural canopy pruning for fast-growing species to prevent wind-shear damage.`;
                } else {
                    alertBox.style.display = "none";
                }

                treesData.forEach(tree => {
                    let status = "healthy";
                    let color = [76, 175, 80, 0.9]; // Green
                    let outlineColor = [56, 142, 60, 1];
                    let size = "14px";
                    let markerStyle = "circle";

                    // 1. Mortality Check (Cumulates over time. 0.5% chance per year)
                    // If a tree's seed is less than the accumulated mortality threshold, it dies.
                    let mortalityThreshold = currentYear * 0.005;
                    if (tree._seed < mortalityThreshold) {
                        status = "dead";
                        color = [244, 67, 54, 0.9]; // Red
                        outlineColor = [211, 47, 47, 1];
                        markerStyle = "cross"; // Dead tree is a cross
                        size = "16px";
                    }
                    // 2. Drought Stress (Occurs selectively during drought years)
                    else if (isDroughtYear && tree._seed > 0.7) {
                        // 30% of remaining trees struggle in drought
                        status = "drought";
                        color = [33, 150, 243, 0.9]; // Blue
                        outlineColor = [25, 118, 210, 1];
                    }
                    // 3. Pruning Requirements (Species dependent)
                    else if (status === "healthy") {
                        // Fast growers need prune every 3 years. Slow growers every 5 years.
                        let fastGrower = (tree._species === "Mexican Sycamore" || tree._species === "Texas Pecan");
                        if ((fastGrower && currentYear % 3 === 0) || (!fastGrower && currentYear % 5 === 0)) {
                            status = "prune";
                            color = [255, 152, 0, 0.9]; // Orange
                            outlineColor = [245, 124, 0, 1];
                            markerStyle = "square";
                        }
                    }

                    // Tally KPIs
                    if (status === "healthy") countHealthy++;
                    if (status === "prune") countPrune++;
                    if (status === "drought") countDrought++;
                    if (status === "dead") countDead++;

                    let tLon = tree.geometry ? tree.geometry.coordinates[0] : tree.lon;
                    let tLat = tree.geometry ? tree.geometry.coordinates[1] : tree.lat;

                    const point = {
                        type: "point",
                        longitude: tLon,
                        latitude: tLat
                    };

                    const markerSymbol = {
                        type: "simple-marker",
                        style: markerStyle,
                        color: color,
                        size: size,
                        outline: {
                            color: outlineColor,
                            width: 2
                        }
                    };

                    const graphic = new Graphic({
                        geometry: point,
                        symbol: markerSymbol,
                        popupTemplate: {
                            title: `Status: ${status.toUpperCase()}`,
                            content: `Species: <b>${tree._species}</b><br>Maintenance priority flagged for Year ${currentYear} of canopy lifespan.`
                        }
                    });

                    treeLayer.add(graphic);
                });

                // Update UI Counters
                valHealthy.textContent = countHealthy;
                valPrune.textContent = countPrune;
                valDrought.textContent = countDrought;
                valDead.textContent = countDead;
            }

            // Bind Slider
            timeSlider.addEventListener("input", (e) => {
                const year = parseInt(e.target.value);
                yearDisplay.textContent = `Year ${year}`;
                if (year === 1) yearDisplay.textContent = `Year 1 (Install)`;
                if (year === 15) yearDisplay.textContent = `Year 15 (Mature Canopy)`;

                renderTrees(year);
            });

        });
})();
