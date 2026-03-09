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

                const extent = polygon.extent;
                const centerCoords = [extent.center.longitude, extent.center.latitude];
                const width = extent.xmax - extent.xmin;
                const height = extent.ymax - extent.ymin;

                // ==========================================
                // ECOSYSTEM SERVICES (Bolund & Hunhammar 1999)
                // ==========================================

                const acousticLayer = new GraphicsLayer({ title: "Acoustic Dampening" });
                const airLayer = new GraphicsLayer({ title: "Air Filtration" });
                const studentLayer = new GraphicsLayer({ title: "Student Tracking" });
                map.addMany([acousticLayer, airLayer, studentLayer]);

                // 4) Acoustic Dampening Zone (Noise Reduction)
                const acousticBufferCoords = [
                    [centerCoords[0] + width * 0.1, centerCoords[1] + height * 0.4],
                    [centerCoords[0] + width * 0.5, centerCoords[1] + height * 0.4],
                    [centerCoords[0] + width * 0.5, centerCoords[1] - height * 0.2],
                    [centerCoords[0] + width * 0.1, centerCoords[1] - height * 0.2],
                    [centerCoords[0] + width * 0.1, centerCoords[1] + height * 0.4]
                ];

                const acousticPoly = new Polygon({ rings: acousticBufferCoords });
                const acousticGraphic = new Graphic({
                    geometry: acousticPoly,
                    symbol: {
                        type: "simple-fill",
                        color: [255, 100, 100, 0.2],
                        outline: { color: [255, 100, 100, 0.8], width: 2, style: "dash" }
                    },
                    popupTemplate: {
                        title: "-8 dB Noise Reduction Zone",
                        content: "This dense foliage buffer intercepts traffic noise from the eastern road, creating a quiet space conducive to psychological recuperation (Bolund & Hunhammar, 1999)."
                    }
                });
                acousticLayer.add(acousticGraphic);

                // 5) Air Filtration (PM10 Interception Points)
                for (let i = 0; i < 40; i++) {
                    const rx = centerCoords[0] + (Math.random() * width - width / 2);
                    const ry = centerCoords[1] + (Math.random() * height - height / 2);

                    // Optional: Check if inside polygon
                    if (geometryEngine.contains(polygon, new Point({ longitude: rx, latitude: ry }))) {
                        const airPoint = new Point({ longitude: rx, latitude: ry });
                        const airGraphic = new Graphic({
                            geometry: airPoint,
                            symbol: {
                                type: "simple-marker",
                                color: [144, 238, 144, 0.6],
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
                }

                // 6) Student Recreation Tracking (Animated Dots)
                const students = [];
                for (let j = 0; j < 8; j++) {
                    const studentGraphic = new Graphic({
                        geometry: new Point({ longitude: centerCoords[0] + width * 0.1, latitude: centerCoords[1] + height * 0.1 }),
                        symbol: {
                            type: "simple-marker",
                            color: [0, 150, 255, 1],
                            size: "8px",
                            outline: null
                        },
                        popupTemplate: { title: "Active Student Track", content: "Engaging in +45 mins of outdoor play." }
                    });
                    studentLayer.add(studentGraphic);

                    students.push({
                        graphic: studentGraphic,
                        speed: 0.00002 + (Math.random() * 0.00003),
                        angle: Math.random() * Math.PI * 2
                    });
                }

                setInterval(() => {
                    students.forEach(s => {
                        let p = s.graphic.geometry.clone();
                        p.longitude += Math.cos(s.angle) * s.speed;
                        p.latitude += Math.sin(s.angle) * s.speed;

                        if (!geometryEngine.contains(polygon, p)) {
                            s.angle += Math.PI; // turn around immediately if exiting campus
                            p.longitude += Math.cos(s.angle) * (s.speed * 2);
                            p.latitude += Math.sin(s.angle) * (s.speed * 2);
                        }

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

        // 2) Load the LineString Trails

    });
});
