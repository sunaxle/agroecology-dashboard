// Logic for the Trail Mapping Page
document.addEventListener('DOMContentLoaded', () => {
    const config = window.APP_CONFIG;

    window.require([
        "esri/Map",
        "esri/views/MapView",
        "esri/layers/GraphicsLayer",
        "esri/Graphic",
        "esri/geometry/Polygon",
        "esri/geometry/Polyline",
        "esri/geometry/geometryEngine",
        "esri/geometry/Point",
        "esri/widgets/BasemapToggle"
    ], function (Map, MapView, GraphicsLayer, Graphic, Polygon, Polyline, geometryEngine, Point, BasemapToggle) {

        const activeLng = parseFloat(localStorage.getItem("activeCampusLng"));
        const activeLat = parseFloat(localStorage.getItem("activeCampusLat"));
        const mapCenter = !isNaN(activeLng) && !isNaN(activeLat) ? [activeLng, activeLat] : [-98.0520, 26.1704];
        const map = new Map({ basemap: config?.map?.basemap || "satellite" });

        const view = new MapView({
            container: "trailsMap",
            map: map,
            center: config?.map?.center || [-98.0706, 26.1675],
            zoom: 17,
            constraints: { minZoom: 16, maxZoom: 19 }
        });

        const basemapToggle = new BasemapToggle({ view, nextBasemap: "streets-vector" });
        view.ui.add(basemapToggle, "top-right");

        // 1) Load Campus Boundary
        const boundaryLayer = new GraphicsLayer({ title: "Boundaries" });
        map.add(boundaryLayer);

        fetch("data/campus_boundary.json")
            .then(res => res.json())
            .then(data => {
                if (!data.features) return;
                const polygon = new Polygon({ rings: data.features[0].geometry.coordinates[0] });
                boundaryLayer.add(new Graphic({
                    geometry: polygon,
                    symbol: {
                        type: "simple-fill",
                        color: [0, 0, 0, 0],
                        outline: { color: [255, 255, 0, 1], width: 2 }
                    }
                }));
            });

        // 2) Load the LineString Trails
        const trailsLayer = new GraphicsLayer({ title: "Trails" });
        map.add(trailsLayer);

        let allTrailGraphics = []; // Store them to filter later

        fetch("data/mock_trails.json")
            .then(res => res.json())
            .then(data => {
                if (!data.features) return;

                data.features.forEach(feature => {
                    const polyline = new Polyline({ paths: [feature.geometry.coordinates] });
                    const props = feature.properties;

                    let symbol;
                    if (props.type === "Permeable") {
                        // Dirt / Granite path representation
                        symbol = {
                            type: "simple-line",
                            color: [139, 69, 19, 0.9], // SaddleBrown
                            width: 5,
                            style: "short-dash"
                        };
                    } else {
                        // Impermeable concrete
                        symbol = {
                            type: "simple-line",
                            color: [169, 169, 169, 0.9], // DarkGray
                            width: 6,
                            style: "solid"
                        };
                    }

                    const graphic = new Graphic({
                        geometry: polyline,
                        symbol: symbol,
                        attributes: props,
                        popupTemplate: {
                            title: "{name}",
                            content: `
                                <ul>
                                    <li><b>Type:</b> {type} Surface</li>
                                    <li><b>Material:</b> {material}</li>
                                    <li><b>Base Length:</b> {length_ft} ft</li>
                                    <li><b>Shaded Cover:</b> {shaded_percent}%</li>
                                </ul>
                            `
                        }
                    });

                    allTrailGraphics.push(graphic);
                    trailsLayer.add(graphic);
                });
            });

        // 3) Filter Functionality
        document.getElementById('trailFilter').addEventListener('change', (e) => {
            const filterVal = e.target.value; // 'all', 'permeable', 'impermeable'

            trailsLayer.removeAll();

            allTrailGraphics.forEach(g => {
                if (filterVal === 'all') {
                    trailsLayer.add(g);
                } else if (filterVal === 'permeable' && g.attributes.type === 'Permeable') {
                    trailsLayer.add(g);
                } else if (filterVal === 'impermeable' && g.attributes.type === 'Impermeable') {
                    trailsLayer.add(g);
                }
            });
        });

        // ==========================================
        // ECOSYSTEM SERVICES (Bolund & Hunhammar 1999)
        // ==========================================

        const acousticLayer = new GraphicsLayer({ title: "Acoustic Dampening" });
        const airLayer = new GraphicsLayer({ title: "Air Filtration" });
        const studentLayer = new GraphicsLayer({ title: "Student Tracking" });
        map.addMany([acousticLayer, airLayer, studentLayer]);

        // 4) Acoustic Dampening Zone (Noise Reduction)
        // Simulating a sound buffer around the dense microforest planting area
        const acousticBufferCoords = [
            [mapCenter[0] + 0.0005, mapCenter[1] + 0.003],
            [mapCenter[0] + 0.0045, mapCenter[1] + 0.003],
            [mapCenter[0] + 0.0045, mapCenter[1] - 0.001],
            [mapCenter[0] + 0.0005, mapCenter[1] - 0.001],
            [mapCenter[0] + 0.0005, mapCenter[1] + 0.003]
        ];

        const acousticPoly = new Polygon({ rings: acousticBufferCoords });
        const acousticGraphic = new Graphic({
            geometry: acousticPoly,
            symbol: {
                type: "simple-fill",
                color: [255, 100, 100, 0.2], // Soft red/orange transparent
                outline: { color: [255, 100, 100, 0.8], width: 2, style: "dash" }
            },
            popupTemplate: {
                title: "-8 dB Noise Reduction Zone",
                content: "This dense foliage buffer intercepts traffic noise from the eastern road, creating a quiet space conducive to psychological recuperation (Bolund & Hunhammar, 1999)."
            }
        });
        acousticLayer.add(acousticGraphic);

        // 5) Air Filtration (PM10 Interception Points)
        // Randomly scatter points representing high-filtration capacity mature trees
        for (let i = 0; i < 40; i++) {
            const rx = mapCenter[0] + (Math.random() * 0.004 - 0.0005);
            const ry = mapCenter[1] + (Math.random() * 0.004 - 0.001);

            const airPoint = new Point({ longitude: rx, latitude: ry });
            const airGraphic = new Graphic({
                geometry: airPoint,
                symbol: {
                    type: "simple-marker",
                    color: [144, 238, 144, 0.6], // Light green transparent
                    size: "12px",
                    outline: { color: [34, 139, 34, 1], width: 1 }
                },
                popupTemplate: {
                    title: "Particulate Interception Node",
                    content: "Mature broadleaf surface capturing airborne PM10 particulate matter from surrounding suburban infrastructure (Bolund & Hunhammar, 1999)."
                }
            });
            airLayer.add(airGraphic);
        }

        // 6) Student Recreation Tracking (Animated Dots)
        // Simulate a few students walking constantly along the permeable trail bounds
        const students = [];
        for (let j = 0; j < 8; j++) {
            const studentGraphic = new Graphic({
                geometry: new Point({ longitude: mapCenter[0] + 0.001, latitude: mapCenter[1] + 0.001 }),
                symbol: {
                    type: "simple-marker",
                    color: [0, 150, 255, 1], // Bright blue
                    size: "8px",
                    outline: null
                },
                popupTemplate: { title: "Active Student Track", content: "Engaging in +45 mins of outdoor play." }
            });
            studentLayer.add(studentGraphic);

            students.push({
                graphic: studentGraphic,
                offsetLon: Math.random() * 0.0003,
                offsetLat: Math.random() * 0.0003,
                speed: 0.00002 + (Math.random() * 0.00003),
                angle: Math.random() * Math.PI * 2
            });
        }

        // Extremely simple animation loop moving students randomly within the boundary
        setInterval(() => {
            students.forEach(s => {
                let p = s.graphic.geometry.clone();
                p.longitude += Math.cos(s.angle) * s.speed;
                p.latitude += Math.sin(s.angle) * s.speed;

                // Keep them roughly in the microforest zone
                if (p.longitude > mapCenter[0] + 0.004 || p.longitude < mapCenter[0] ||
                    p.latitude > mapCenter[1] + 0.003 || p.latitude < mapCenter[1] - 0.001) {
                    s.angle += Math.PI; // turn around
                }

                // Add some random wandering
                if (Math.random() > 0.9) s.angle += (Math.random() - 0.5);

                s.graphic.geometry = p;
            });
        }, 100);

        // 7) UI Toggle Listeners
        document.getElementById('layerAcoustic').addEventListener('change', (e) => {
            acousticLayer.visible = e.target.checked;
        });
        document.getElementById('layerAir').addEventListener('change', (e) => {
            airLayer.visible = e.target.checked;
        });
        document.getElementById('layerStudents').addEventListener('change', (e) => {
            studentLayer.visible = e.target.checked;
        });

    });
});
