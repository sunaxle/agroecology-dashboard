document.addEventListener('DOMContentLoaded', () => {
    const config = window.APP_CONFIG;
    const timeSlider = document.getElementById('timeSlider');
    const timeDisplay = document.getElementById('timeDisplay');
    const outdoorsCount = document.getElementById('outdoorsCount');
    const primaryZone = document.getElementById('primaryZone');

    let rawStudentData = [];
    let studentLayer; // The graphics layer holding the point dots
    let mapBoundaryLayer;

    // Tracker for Cumulative Outdoor Minutes by Department
    let cumulativeTracking = {
        "Science": 0,
        "Art": 0,
        "English": 0,
        "Standard": 0
    };

    // Helper: Convert slider 24hr value to 12hr AM/PM string
    function formatHourString(hour24) {
        const ampm = hour24 >= 12 ? 'PM' : 'AM';
        const hr12 = hour24 > 12 ? hour24 - 12 : (hour24 === 0 ? 12 : hour24);
        return `${hr12}:00 ${ampm}`;
    }

    window.require([
        "esri/Map",
        "esri/views/MapView",
        "esri/layers/GraphicsLayer",
        "esri/Graphic",
        "esri/geometry/Polygon",
        "esri/geometry/Point",
        "esri/geometry/geometryEngine",
        "esri/widgets/BasemapToggle"
    ], function (Map, MapView, GraphicsLayer, Graphic, Polygon, Point, geometryEngine, BasemapToggle) {

        const activeLng = parseFloat(localStorage.getItem("activeCampusLng"));
        const activeLat = parseFloat(localStorage.getItem("activeCampusLat"));
        const mapCenter = !isNaN(activeLng) && !isNaN(activeLat) ? [activeLng, activeLat] : [-98.0520, 26.1704];
        const map = new Map({ basemap: config?.map?.basemap || "satellite" });

        const view = new MapView({
            container: "studentMap",
            map: map,
            center: config?.map?.center || [-98.0706, 26.1675],
            zoom: 18,
            constraints: { minZoom: 17, maxZoom: 20 }
        });

        const basemapToggle = new BasemapToggle({ view, nextBasemap: "streets-vector" });
        view.ui.add(basemapToggle, "top-right");

        // 1) Load Campus Boundary
        mapBoundaryLayer = new GraphicsLayer({ title: "Boundaries" });
        map.add(mapBoundaryLayer);

        fetch("data/campus_boundary.json")
            .then(res => res.json())
            .then(data => {
                const rings = data.features[0].geometry.coordinates[0];
                const polygon = new Polygon({ rings: rings });
                mapBoundaryLayer.add(new Graphic({
                    geometry: polygon,
                    symbol: {
                        type: "simple-fill",
                        color: [0, 0, 0, 0],
                        outline: { color: [255, 255, 0, 1], width: 2 }
                    }
                }));
            });

        // 2) Load Student Layer Data
        studentLayer = new GraphicsLayer({ title: "Students" });
        map.add(studentLayer);

        fetch("data/mock_students.json")
            .then(res => res.json())
            .then(data => {
                if (!data.features) return;
                rawStudentData = data.features;
                updateMapForHour(parseInt(timeSlider.value, 10)); // Initial Render
            });

        // 3) Hook up Slider Logic
        timeSlider.addEventListener('input', (e) => {
            const hr = parseInt(e.target.value, 10);
            timeDisplay.textContent = formatHourString(hr);
            updateMapForHour(hr);
        });

        // Core Render Function based on the selected hour
        function updateMapForHour(targetHour) {
            studentLayer.removeAll(); // Clear existing dots

            // Filter down to just the points representing the current hour
            const currentPoints = rawStudentData.filter(f => f.properties.hour_of_day === targetHour);

            let outdoors = 0;

            // Reset cumulative trackers if we jump back in time
            if (targetHour === 8) {
                cumulativeTracking = { "Science": 0, "Art": 0, "English": 0, "Standard": 0 };
            }

            // Calculate historical outdoor time up to this hour
            const historicalPoints = rawStudentData.filter(f => f.properties.hour_of_day <= targetHour);
            let currentCumulative = { "Science": 0, "Art": 0, "English": 0, "Standard": 0 };

            historicalPoints.forEach(f => {
                // If a point is in an outdoor zone, log 60 minutes of outdoor time
                if (f.properties.zone_desc !== "indoor" && f.properties.zone_desc !== "entrance") {
                    // Assign a mock department based on the student's group
                    let dept = "Standard";
                    if (f.properties.group === "A" || f.properties.group === "B") dept = "Science";
                    if (f.properties.group === "C") dept = "English";
                    if (f.properties.group === "D") dept = "Art";

                    currentCumulative[dept] += 60; // 60 mins per hour spent outside
                }
            });

            // Normalize minutes purely for the dashboard visualization so the bars look nice at 4pm
            const MAX_MINUTES = 180; // Assuming 3 hours total outdoor is the cap

            ['Science', 'Art', 'English', 'Standard'].forEach(dept => {
                const totalMins = currentCumulative[dept];
                const cleanId = dept;
                const pct = Math.min((totalMins / MAX_MINUTES) * 100, 100);

                document.getElementById(`track${cleanId}`).textContent = `${totalMins} mins`;
                document.getElementById(`bar${cleanId}`).style.width = `${pct}%`;
            });


            currentPoints.forEach(feature => {
                const props = feature.properties;
                const zone = props.zone_desc;

                let symbol;
                if (zone === "indoor") {
                    // Make indoors visually distinct (e.g. red and slightly smaller)
                    symbol = {
                        type: "simple-marker",
                        style: "circle",
                        color: [220, 20, 60, 0.9], // Crimson
                        size: "10px",
                        outline: { color: [255, 255, 255, 0.4], width: 1 }
                    };
                } else {
                    outdoors++;
                    // Outdoors (forest, field, courtyard)
                    symbol = {
                        type: "simple-marker",
                        style: "circle",
                        color: [32, 178, 170, 0.9], // LightSeaGreen
                        size: "14px",
                        outline: { color: [255, 255, 255, 1], width: 1.5 }
                    };
                }

                // Append department info to popup
                let deptName = "Standard Group";
                if (props.group === "A" || props.group === "B") deptName = "Science Group";
                if (props.group === "C") deptName = "English Group";
                if (props.group === "D") deptName = "Art Group";


                const point = new Point({
                    longitude: feature.geometry.coordinates[0],
                    latitude: feature.geometry.coordinates[1]
                });

                const graphic = new Graphic({
                    geometry: point,
                    symbol: symbol,
                    attributes: props,
                    popupTemplate: {
                        title: "{student_id}",
                        content: `<b>Current Zone:</b> {zone_desc}<br><b>Department Focus:</b> ${deptName}`
                    }
                });

                studentLayer.add(graphic);
            });

            // Analytics Updates
            outdoorsCount.textContent = outdoors;
        }

        // Play/Pause Auto-Animation
        let isPlaying = false;
        let playInterval;
        const playBtn = document.getElementById('playBtn');

        function togglePlay() {
            isPlaying = !isPlaying;
            playBtn.textContent = isPlaying ? "Pause" : "Play";
            playBtn.style.background = isPlaying ? "#d32f2f" : "#2e7d32";

            if (isPlaying) {
                playInterval = setInterval(() => {
                    let currentVal = parseInt(timeSlider.value, 10);
                    currentVal += 1; // 1 hour steps
                    if (currentVal > 16) currentVal = 8; // Loop back to 8 AM

                    timeSlider.value = currentVal;
                    timeDisplay.textContent = formatHourString(currentVal);
                    updateMapForHour(currentVal);
                }, 1000); // Ticks every 1 second
            } else {
                clearInterval(playInterval);
            }
        }

        if (playBtn) {
            playBtn.addEventListener('click', togglePlay);
        }

        // Pause if user manually interacts with slider
        timeSlider.addEventListener('mousedown', () => {
            if (isPlaying) togglePlay();
        });
    });

});
