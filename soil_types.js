(function () {
    const config = window.APP_CONFIG;

    const toggleSoil = document.getElementById("toggleSoil");
    const toggleTrees = document.getElementById("toggleTrees");

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
                container: "soilMap",
                map,
                center: [-98.0700, 26.1668], // Default to campus
                zoom: config?.map?.zoom || 18,
                constraints: {
                    minZoom: config?.map?.minZoom || 16,
                    maxZoom: config?.map?.maxZoom || 19
                }
            });

            const boundaryLayer = new GraphicsLayer();
            const soilLayer = new GraphicsLayer({ title: "Soil Types" });
            const treeLayer = new GraphicsLayer({ title: "Reference Canopy", visible: false });

            map.addMany([soilLayer, boundaryLayer, treeLayer]); // Soil on bottom, boundary, then trees on top

            // Widgets
            const basemapToggle = new BasemapToggle({ view, nextBasemap: "streets-vector" });
            view.ui.add(basemapToggle, "top-right");
            view.ui.add(new Zoom({ view }), "top-right");

            // Define the 4 Soil Graphic Types
            const soilStyles = {
                "heavy_clay": { color: [140, 90, 76, 0.45], outline: [140, 90, 76, 0.8] }, // Brown
                "sandy_loam": { color: [215, 181, 107, 0.45], outline: [215, 181, 107, 0.8] }, // Yellow
                "urban_fill": { color: [121, 124, 128, 0.45], outline: [121, 124, 128, 0.8] }, // Grey
                "silt_loam": { color: [139, 153, 82, 0.45], outline: [139, 153, 82, 0.8] } // Muddy Green
            };

            // Hardcode 4 large generalized polygons covering the J.W. Caceres property
            const mockSoilPolygons = [
                {
                    type: "urban_fill",
                    name: "Compacted Urban Fill",
                    rings: [
                        [-98.070438, 26.167383],
                        [-98.069418, 26.167393],
                        [-98.069450, 26.166680],
                        [-98.070460, 26.166650],
                        [-98.070438, 26.167383]
                    ],
                    desc: "Parking lot and foundation backfill. Highly compacted and alkaline."
                },
                {
                    type: "heavy_clay",
                    name: "Rio Grande Heavy Clay",
                    rings: [
                        [-98.070460, 26.166650],
                        [-98.069450, 26.166680],
                        [-98.069480, 26.166000],
                        [-98.070500, 26.165980],
                        [-98.070460, 26.166650]
                    ],
                    desc: "Southern athletic fields. High flood risk due to poor percolation."
                },
                {
                    type: "sandy_loam",
                    name: "Sandy Loam",
                    rings: [
                        [-98.071200, 26.167300],
                        [-98.070438, 26.167383],
                        [-98.070460, 26.166650],
                        [-98.071250, 26.166500],
                        [-98.071200, 26.167300]
                    ],
                    desc: "Western courtyard and front entrance. Excellent drainage for establishing the Microforest."
                },
                {
                    type: "silt_loam",
                    name: "Riparian Silt Loam",
                    rings: [
                        [-98.071250, 26.166500],
                        [-98.070460, 26.166650],
                        [-98.070500, 26.165980],
                        [-98.071300, 26.165950],
                        [-98.071250, 26.166500]
                    ],
                    desc: "South-western lowlands. High organic matter."
                }
            ];

            // Render Soil Polygons
            mockSoilPolygons.forEach(pData => {
                const polygon = new Polygon({ rings: pData.rings });
                const style = soilStyles[pData.type];

                const graphic = new Graphic({
                    geometry: polygon,
                    symbol: {
                        type: "simple-fill",
                        color: style.color,
                        outline: { color: style.outline, width: 2, style: "solid" }
                    },
                    popupTemplate: {
                        title: pData.name,
                        content: `<b>Description:</b> ${pData.desc}`
                    }
                });
                soilLayer.add(graphic);
            });

            // Fetch Boundary
            fetch("data/campus_boundary.json")
                .then(res => res.json())
                .then(boundaryData => {
                    if (boundaryData.features && boundaryData.features.length > 0) {
                        const coords = boundaryData.features[0].geometry.coordinates[0];
                        const polygon = new Polygon({ rings: coords });

                        boundaryLayer.add(new Graphic({
                            geometry: polygon,
                            symbol: {
                                type: "simple-fill",
                                color: [0, 0, 0, 0],
                                outline: { color: [255, 255, 255, 1], width: 3, style: "dash" } // White dash for visibility over soil
                            }
                        }));

                        view.goTo({ target: polygon, zoom: 18 }, { duration: 1500 });
                    }
                });

            // Fetch Trees for Reference Overlay
            fetch("data/mock_trees.json")
                .then(res => res.json())
                .then(treeJson => {
                    const campusName = localStorage.getItem("activeCampusName") || "J.W. Caceres & M. Rivas Academy";
                    let treesData = treeJson.features ? treeJson.features : (treeJson[campusName] || []);

                    treesData.forEach(tree => {
                        let tLon = tree.geometry ? tree.geometry.coordinates[0] : tree.lon;
                        let tLat = tree.geometry ? tree.geometry.coordinates[1] : tree.lat;

                        const point = { type: "point", longitude: tLon, latitude: tLat };

                        treeLayer.add(new Graphic({
                            geometry: point,
                            symbol: {
                                type: "simple-marker",
                                style: "circle",
                                color: [76, 175, 80, 0.9],
                                size: "12px",
                                outline: { color: [255, 255, 255, 0.8], width: 1 }
                            }
                        }));
                    });
                });

            // UI Toggles
            toggleSoil.addEventListener("change", (e) => {
                soilLayer.visible = e.target.checked;
            });

            toggleTrees.addEventListener("change", (e) => {
                treeLayer.visible = e.target.checked;
            });

        });
})();
