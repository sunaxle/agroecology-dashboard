{
    id: "donna_jw_caceres",
        name: "J.W. Caceres & M. Rivas Academy",
            district: "Donna ISD",
                status: "Active Implementation",
                    baselinePlanted: 154,
                        projectedShade: "36%",
                            coords: [-98.0700, 26.1668]
},
{
    id: "edinburg_econ",
        name: "Economedes High School",
            district: "Edinburg CISD",
                status: "Baseline Data Collection",
                    baselinePlanted: 0,
                        projectedShade: "25%",
                            coords: [-98.1363, 26.3195]
},
{
    id: "mcallen_rowe",
        name: "Nikki Rowe High School",
            district: "McAllen ISD",
                status: "Pending Design Approval",
                    baselinePlanted: 0,
                        projectedShade: "40%",
                            coords: [-98.2435, 26.1823]
},
// Mocking 11 more entries for visual completion of the 14-campus grant
{ id: "mock_4", name: "Donna High School", district: "Donna ISD", status: "Baseline Data Collection", baselinePlanted: 0, projectedShade: "30%", coords: [-98.0469, 26.1661] },
{ id: "mock_5", name: "La Joya High", district: "La Joya ISD", status: "Baseline Data Collection", baselinePlanted: 0, projectedShade: "28%", coords: [-98.3973, 26.2483] },
{ id: "mock_6", name: "Juarez-Lincoln", district: "La Joya ISD", status: "Pending Design Approval", baselinePlanted: 0, projectedShade: "35%", coords: [-98.3900, 26.2500] },
{ id: "mock_7", name: "PSJA North", district: "PSJA ISD", status: "Baseline Data Collection", baselinePlanted: 0, projectedShade: "22%", coords: [-98.1824, 26.2165] },
{ id: "mock_8", name: "PSJA Southwest", district: "PSJA ISD", status: "Pending Design Approval", baselinePlanted: 0, projectedShade: "28%", coords: [-98.1700, 26.1600] },
{ id: "mock_9", name: "Mission High", district: "Mission CISD", status: "Baseline Data Collection", baselinePlanted: 0, projectedShade: "31%", coords: [-98.3306, 26.2155] },
{ id: "mock_10", name: "Veterans Memorial", district: "Mission CISD", status: "Pending Design Approval", baselinePlanted: 0, projectedShade: "25%", coords: [-98.3100, 26.2300] },
{ id: "mock_11", name: "Weslaco High", district: "Weslaco ISD", status: "Baseline Data Collection", baselinePlanted: 0, projectedShade: "29%", coords: [-97.9868, 26.1557] },
{ id: "mock_12", name: "Weslaco East", district: "Weslaco ISD", status: "Pending Design Approval", baselinePlanted: 0, projectedShade: "34%", coords: [-97.9600, 26.1700] },
{ id: "mock_13", name: "McAllen High", district: "McAllen ISD", status: "Baseline Data Collection", baselinePlanted: 0, projectedShade: "27%", coords: [-98.2281, 26.2086] },
{ id: "mock_14", name: "Edinburg North", district: "Edinburg CISD", status: "Pending Design Approval", baselinePlanted: 0, projectedShade: "33%", coords: [-98.1600, 26.3300] }
];

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
