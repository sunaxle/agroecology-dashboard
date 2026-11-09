document.addEventListener("DOMContentLoaded", () => {
    
    // 1. Render Prosperity Pantry Inventory
    const inventoryData = [
        { item: "Artisanal Canned Tomatoes", stock: 145, target: 300, price: 12 },
        { item: "Loose-leaf Herbal Tea Tin", stock: 42, target: 150, price: 15 },
        { item: "Hub of Prosperity Honey", stock: 12, target: 50, price: 20 },
        { item: "Dehydrated Herb Packets", stock: 89, target: 100, price: 8 }
    ];

    const inventoryContainer = document.getElementById("inventoryContainer");
    inventoryData.forEach(inv => {
        const isLow = inv.stock < (inv.target * 0.3);
        const revenue = (inv.stock * inv.price).toLocaleString();
        
        const el = document.createElement("div");
        el.className = `inventory-item ${isLow ? 'low-stock' : ''}`;
        el.innerHTML = `
            <div>
                <strong style="color: #fff;">${inv.item}</strong><br>
                <span style="font-size: 13px; color: #cbd5e1;">Projected Value: $${revenue}</span>
            </div>
            <div style="text-align: right;">
                <strong style="color: ${isLow ? '#ef4444' : '#22c55e'};">${inv.stock} Units</strong><br>
                <span style="font-size: 13px; color: #cbd5e1;">Target: ${inv.target}</span>
            </div>
        `;
        inventoryContainer.appendChild(el);
    });

    // 2. Render Student Plots
    const studentData = [
        { name: "Maria S. (Plot A1)", crop: "Radishes & Carrots", yield_lbs: 45, target_lbs: 60, status: "Harvesting" },
        { name: "Jorge L. (Plot A2)", crop: "Heirloom Tomatoes", yield_lbs: 110, target_lbs: 100, status: "Surplus" },
        { name: "Elena V. (Plot B1)", crop: "Cilantro & Basil", yield_lbs: 15, target_lbs: 30, status: "Growing" },
        { name: "David R. (Plot B2)", crop: "Butternut Squash", yield_lbs: 85, target_lbs: 100, status: "Maturing" }
    ];

    const studentContainer = document.getElementById("studentContainer");
    studentData.forEach(student => {
        const percent = Math.min((student.yield_lbs / student.target_lbs) * 100, 100);
        
        const el = document.createElement("div");
        el.className = "student-plot";
        el.innerHTML = `
            <div style="display: flex; justify-content: space-between;">
                <h4>${student.name}</h4>
                <span style="font-size: 12px; padding: 4px 8px; background: rgba(255,255,255,0.1); border-radius: 12px;">${student.status}</span>
            </div>
            <div style="font-size: 14px; color: #cbd5e1; margin-bottom: 5px;">
                <strong>Primary Crop:</strong> ${student.crop}
            </div>
            <div style="font-size: 13px; color: #94a3b8; display: flex; justify-content: space-between;">
                <span>Current Yield: ${student.yield_lbs} lbs</span>
                <span>Target: ${student.target_lbs} lbs</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${percent}%;"></div>
            </div>
        `;
        studentContainer.appendChild(el);
    });

    // 3. Initialize ArcGIS Map for Plot View
    require([
        "esri/Map",
        "esri/views/MapView",
        "esri/layers/GraphicsLayer",
        "esri/Graphic",
        "esri/geometry/Polygon"
    ], function(Map, MapView, GraphicsLayer, Graphic, Polygon) {
        
        const map = new Map({ basemap: "satellite" });
        const view = new MapView({
            container: "mapView",
            map: map,
            center: [-98.0520, 26.1704], // Approximate Hub location
            zoom: 18,
            ui: { components: ["attribution"] } // Minimal UI
        });

        const plotLayer = new GraphicsLayer();
        map.add(plotLayer);

        view.when(() => {
            // Add a mock polygon representing the student plots
            const polygon = new Polygon({
                rings: [
                    [
                        [-98.0522, 26.1705],
                        [-98.0518, 26.1705],
                        [-98.0518, 26.1703],
                        [-98.0522, 26.1703],
                        [-98.0522, 26.1705]
                    ]
                ]
            });

            const graphic = new Graphic({
                geometry: polygon,
                symbol: {
                    type: "simple-fill",
                    color: [34, 197, 94, 0.4], // Green, semi-transparent
                    outline: { color: [255, 255, 255], width: 1 }
                },
                popupTemplate: {
                    title: "Student Incubator Zone",
                    content: "25 Active Student Plots. <br>Current phase: Late Spring Harvest."
                }
            });

            plotLayer.add(graphic);
        });
    });

    // 4. Poll Python Sensor Pipeline Data
    const telemetryOutput = document.getElementById("telemetryOutput");
    const sensorStatus = document.getElementById("sensorStatus");

    setInterval(async () => {
        try {
            // Using a timestamp to bust cache
            const response = await fetch(`data_dumps/live_sensor_data.json?t=${new Date().getTime()}`);
            if (response.ok) {
                const data = await response.json();
                
                let outputHtml = `<div><strong>TIMESTAMP:</strong> ${data.timestamp}</div><br>`;
                
                data.hardware_nodes.forEach(node => {
                    outputHtml += `<div style="margin-bottom: 8px;">`;
                    outputHtml += `<span style="color: #60a5fa;">[${node.id}]</span> ${node.type} | Bat: ${node.battery}%<br>`;
                    
                    if (node.metrics) {
                        for (const [key, value] of Object.entries(node.metrics)) {
                            outputHtml += `  -- ${key}: <span style="color: #fde047;">${value}</span><br>`;
                        }
                    }
                    outputHtml += `</div>`;
                });
                
                telemetryOutput.innerHTML = outputHtml;
                sensorStatus.innerHTML = `● Online (Updated ${new Date().toLocaleTimeString()})`;
                sensorStatus.style.color = "#4ade80";
            }
        } catch (e) {
            console.error("Telemetry fetch failed:", e);
            sensorStatus.innerHTML = `● Disconnected`;
            sensorStatus.style.color = "#ef4444";
        }
    }, 5000); // Poll every 5 seconds matching the python pipeline

});
