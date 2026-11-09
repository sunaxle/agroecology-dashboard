const projectCampuses = [
    {
        id: "donna_jw_caceres",
        name: "J.W. Caceres & M. Rivas Academy",
        district: "Donna ISD",
        status: "Active Implementation",
        coords: [-98.0700, 26.1668],
        canopy: { baselinePercent: 5, targetPercent: 30 },
        metrics: { airTemp: 94.2, surfaceTempExposed: 122.5, surfaceTempShaded: 89.1, albedo: 0.18, soilMoisture: 14.2, biodiversityCount: 12, treeCount: 154 },
        iTreeData: { carbonSequesteredLbs: 1250, pollutionRemovedOz: 45, avoidedRunoffGal: 3200 }
    },
    {
        id: "edinburg_econ",
        name: "Economedes High School",
        district: "Edinburg CISD",
        status: "Baseline Data Collection",
        coords: [-98.1363, 26.3195],
        canopy: { baselinePercent: 2, targetPercent: 30 },
        metrics: { airTemp: 96.0, surfaceTempExposed: 128.0, surfaceTempShaded: 91.0, albedo: 0.12, soilMoisture: 8.5, biodiversityCount: 4, treeCount: 0 },
        iTreeData: { carbonSequesteredLbs: 0, pollutionRemovedOz: 0, avoidedRunoffGal: 0 }
    },
    {
        id: "mcallen_rowe",
        name: "Nikki Rowe High School",
        district: "McAllen ISD",
        status: "Pending Design Approval",
        coords: [-98.2435, 26.1823],
        canopy: { baselinePercent: 8, targetPercent: 30 },
        metrics: { airTemp: 93.5, surfaceTempExposed: 118.5, surfaceTempShaded: 88.0, albedo: 0.20, soilMoisture: 16.0, biodiversityCount: 18, treeCount: 0 },
        iTreeData: { carbonSequesteredLbs: 0, pollutionRemovedOz: 0, avoidedRunoffGal: 0 }
    },
    // Mocking 11 more entries for visual completion of the 14-campus grant
    { id: "mock_4", name: "Donna High School", district: "Donna ISD", status: "Baseline Data Collection", coords: [-98.0469, 26.1661], canopy: { baselinePercent: 4, targetPercent: 30 }, metrics: { airTemp: 95.1, surfaceTempExposed: 124.0, surfaceTempShaded: 90.5, albedo: 0.15, soilMoisture: 11.2, biodiversityCount: 6, treeCount: 0 }, iTreeData: { carbonSequesteredLbs: 0, pollutionRemovedOz: 0, avoidedRunoffGal: 0 } },
    { id: "mock_5", name: "La Joya High", district: "La Joya ISD", status: "Baseline Data Collection", coords: [-98.3973, 26.2483], canopy: { baselinePercent: 3, targetPercent: 30 }, metrics: { airTemp: 96.5, surfaceTempExposed: 129.2, surfaceTempShaded: 92.1, albedo: 0.11, soilMoisture: 7.8, biodiversityCount: 5, treeCount: 0 }, iTreeData: { carbonSequesteredLbs: 0, pollutionRemovedOz: 0, avoidedRunoffGal: 0 } },
    { id: "mock_6", name: "Juarez-Lincoln", district: "La Joya ISD", status: "Pending Design Approval", coords: [-98.3900, 26.2500], canopy: { baselinePercent: 5, targetPercent: 30 }, metrics: { airTemp: 95.8, surfaceTempExposed: 125.5, surfaceTempShaded: 90.8, albedo: 0.14, soilMoisture: 9.5, biodiversityCount: 7, treeCount: 0 }, iTreeData: { carbonSequesteredLbs: 0, pollutionRemovedOz: 0, avoidedRunoffGal: 0 } },
    { id: "mock_7", name: "PSJA North", district: "PSJA ISD", status: "Baseline Data Collection", coords: [-98.1824, 26.2165], canopy: { baselinePercent: 6, targetPercent: 30 }, metrics: { airTemp: 94.5, surfaceTempExposed: 120.1, surfaceTempShaded: 89.5, albedo: 0.17, soilMoisture: 13.0, biodiversityCount: 9, treeCount: 0 }, iTreeData: { carbonSequesteredLbs: 0, pollutionRemovedOz: 0, avoidedRunoffGal: 0 } },
    { id: "mock_8", name: "PSJA Southwest", district: "PSJA ISD", status: "Pending Design Approval", coords: [-98.1700, 26.1600], canopy: { baselinePercent: 4, targetPercent: 30 }, metrics: { airTemp: 95.2, surfaceTempExposed: 123.8, surfaceTempShaded: 90.2, albedo: 0.16, soilMoisture: 10.5, biodiversityCount: 6, treeCount: 0 }, iTreeData: { carbonSequesteredLbs: 0, pollutionRemovedOz: 0, avoidedRunoffGal: 0 } },
    { id: "mock_9", name: "Mission High", district: "Mission CISD", status: "Baseline Data Collection", coords: [-98.3306, 26.2155], canopy: { baselinePercent: 7, targetPercent: 30 }, metrics: { airTemp: 94.0, surfaceTempExposed: 119.5, surfaceTempShaded: 88.8, albedo: 0.19, soilMoisture: 14.5, biodiversityCount: 11, treeCount: 0 }, iTreeData: { carbonSequesteredLbs: 0, pollutionRemovedOz: 0, avoidedRunoffGal: 0 } },
    { id: "mock_10", name: "Veterans Memorial", district: "Mission CISD", status: "Pending Design Approval", coords: [-98.3100, 26.2300], canopy: { baselinePercent: 5, targetPercent: 30 }, metrics: { airTemp: 95.5, surfaceTempExposed: 124.6, surfaceTempShaded: 91.0, albedo: 0.13, soilMoisture: 9.2, biodiversityCount: 5, treeCount: 0 }, iTreeData: { carbonSequesteredLbs: 0, pollutionRemovedOz: 0, avoidedRunoffGal: 0 } },
    { id: "mock_11", name: "Weslaco High", district: "Weslaco ISD", status: "Baseline Data Collection", coords: [-97.9868, 26.1557], canopy: { baselinePercent: 6, targetPercent: 30 }, metrics: { airTemp: 94.8, surfaceTempExposed: 121.3, surfaceTempShaded: 89.9, albedo: 0.16, soilMoisture: 12.1, biodiversityCount: 8, treeCount: 0 }, iTreeData: { carbonSequesteredLbs: 0, pollutionRemovedOz: 0, avoidedRunoffGal: 0 } },
    { id: "mock_12", name: "Weslaco East", district: "Weslaco ISD", status: "Pending Design Approval", coords: [-97.9600, 26.1700], canopy: { baselinePercent: 4, targetPercent: 30 }, metrics: { airTemp: 95.4, surfaceTempExposed: 125.1, surfaceTempShaded: 90.7, albedo: 0.14, soilMoisture: 10.0, biodiversityCount: 6, treeCount: 0 }, iTreeData: { carbonSequesteredLbs: 0, pollutionRemovedOz: 0, avoidedRunoffGal: 0 } },
    { id: "mock_13", name: "McAllen High", district: "McAllen ISD", status: "Baseline Data Collection", coords: [-98.2281, 26.2086], canopy: { baselinePercent: 7, targetPercent: 30 }, metrics: { airTemp: 93.8, surfaceTempExposed: 118.9, surfaceTempShaded: 88.5, albedo: 0.18, soilMoisture: 15.2, biodiversityCount: 10, treeCount: 0 }, iTreeData: { carbonSequesteredLbs: 0, pollutionRemovedOz: 0, avoidedRunoffGal: 0 } },
    { id: "mock_14", name: "Edinburg North", district: "Edinburg CISD", status: "Pending Design Approval", coords: [-98.1600, 26.3300], canopy: { baselinePercent: 5, targetPercent: 30 }, metrics: { airTemp: 95.9, surfaceTempExposed: 126.3, surfaceTempShaded: 91.2, albedo: 0.12, soilMoisture: 8.9, biodiversityCount: 5, treeCount: 0 }, iTreeData: { carbonSequesteredLbs: 0, pollutionRemovedOz: 0, avoidedRunoffGal: 0 } }
];;

document.addEventListener('DOMContentLoaded', () => {

    // 1. Render the HTML Grid
    const gridContainer = document.getElementById("campusGridContainer");

    projectCampuses.forEach(campus => {
        const isReady = campus.id === "donna_jw_caceres" || campus.id === "edinburg_econ" || campus.id === "mcallen_rowe";
        const badgeClass = campus.status === "Active Implementation" ? "status-active" : "status-pending";
        const btnHtml = isReady ? `<button class="campus-action" onclick="selectCampus('${campus.id}')">View Dashboard Models</button>` : `<button class="campus-action" style="background:#ccc; cursor:not-allowed;" disabled>Awaiting Implementation</button>`;

        const html = `
            <div class="campus-card">
                <div class="campus-header">
                    <h2>${campus.name}</h2>
                    <p>${campus.district}</p>
                </div>
                <div class="campus-body">
                    <span class="status-badge ${badgeClass}">${campus.status}</span>
                    <div class="metrics-mini">
                        <div class="metric-mini-box">
                            <div class="lbl">Trees Planted</div>
                            <div class="val">${campus.baselinePlanted}</div>
                        </div>
                        <div class="metric-mini-box">
                            <div class="lbl">2040 Shade Goal</div>
                            <div class="val" style="color:#d84315;">${campus.projectedShade}</div>
                        </div>
                    </div>
                </div>
                ${btnHtml}
            </div>
        `;
        gridContainer.insertAdjacentHTML('beforeend', html);
    });

    // 2. Initialize Overview Map
    require([
        "esri/Map",
        "esri/views/MapView",
        "esri/Graphic",
        "esri/layers/GraphicsLayer"
    ], function (Map, MapView, Graphic, GraphicsLayer) {

        const map = new Map({
            basemap: "satellite"
        });

        const view = new MapView({
            container: "overviewMap",
            map: map,
            center: [-98.15, 26.22], // Center of RGV generally
            zoom: 10
        });

        const pinLayer = new GraphicsLayer();
        map.add(pinLayer);

        // Add pins for all 14 campuses
        projectCampuses.forEach(c => {
            const isReady = c.status === "Active Implementation";

            const pointMarker = {
                type: "simple-marker",
                color: isReady ? [46, 125, 50, 0.9] : [255, 152, 0, 0.8], // Dark Green or Orange
                outline: {
                    color: [255, 255, 255],
                    width: 2
                },
                size: isReady ? "14px" : "10px"
            };

            const pointGraphic = new Graphic({
                geometry: {
                    type: "point",
                    longitude: c.coords[0],
                    latitude: c.coords[1]
                },
                symbol: pointMarker,
                attributes: c,
                popupTemplate: {
                    title: "{name}",
                    content: "District: {district}<br>Status: {status}<br>Current Trees: {baselinePlanted}"
                }
            });

            pinLayer.add(pointGraphic);
        });
    });
});

// 3. Selection Logic (Saves to localStorage and redirects)
function selectCampus(campusId) {
    if (!campusId) return;

    // Find the specific campus data
    const chosen = projectCampuses.find(c => c.id === campusId);
    if (chosen) {
        // Save the currently active campus context to localStorage so other pages can read it
        localStorage.setItem("activeCampusId", chosen.id);
        localStorage.setItem("activeCampusName", chosen.name);
        localStorage.setItem("activeCampusLng", chosen.coords[0]);
        localStorage.setItem("activeCampusLat", chosen.coords[1]);

        // Redirect to the main dashboard
        window.location.href = "index.html";
    }
}
