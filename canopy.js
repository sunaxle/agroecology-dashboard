(function () {
  const config = window.APP_CONFIG;
  const yearSlider = document.getElementById("yearSlider");
  const yearReadout = document.getElementById("yearReadout");
  const scenarioSelect = document.getElementById("scenarioSelect");
  const summaryText = document.getElementById("summaryText");
  const trend2020 = document.getElementById("trend2020");
  const trend2025 = document.getElementById("trend2025");
  const trend2030 = document.getElementById("trend2030");
  const canopyNotes = document.getElementById("canopyNotes");
  const saveCanopyNotes = document.getElementById("saveCanopyNotes");

  function updateSummary() {
    const year = Number(yearSlider.value);
    const scenario = scenarioSelect.value;
    yearReadout.textContent = year;
    summaryText.textContent = `Scenario: ${scenario} | Year: ${year}`;
  }

  function loadNotes() {
    const notes = localStorage.getItem("canopy-notes");
    if (notes) canopyNotes.value = notes;
  }

  function saveNotes() {
    localStorage.setItem("canopy-notes", canopyNotes.value || "");
  }

  yearSlider.addEventListener("input", updateSummary);
  scenarioSelect.addEventListener("change", updateSummary);
  saveCanopyNotes.addEventListener("click", saveNotes);

  updateSummary();
  loadNotes();

  window.require(
    [
      "esri/Map",
      "esri/views/MapView",
      "esri/layers/FeatureLayer",
      "esri/layers/GraphicsLayer",
      "esri/Graphic",
      "esri/geometry/Point",
      "esri/geometry/Polygon",
      "esri/geometry/geometryEngine",
      "esri/widgets/LayerList",
      "esri/widgets/BasemapToggle",
      "esri/widgets/Zoom"
    ],
    (Map, MapView, FeatureLayer, GraphicsLayer, Graphic, Point, Polygon, geometryEngine, LayerList, BasemapToggle, Zoom) => {
      let activeLng = parseFloat(localStorage.getItem("activeCampusLng"));
      let activeLat = parseFloat(localStorage.getItem("activeCampusLat"));
      let mapCenter = !isNaN(activeLng) && !isNaN(activeLat) ? [activeLng, activeLat] : [-98.0520, 26.1704];

      // Deep Check: If user drew zones, use the first point of the first zone to perfectly lock the camera
      try {
        const campusName = localStorage.getItem("activeCampusName") || "J.W. Caceres & M. Rivas Academy";
        const savedZones = localStorage.getItem(`zones_${campusName}`);
        if (savedZones) {
          const zones = JSON.parse(savedZones);
          if (zones.length > 0) {
            let x = zones[0].geometry.rings[0][0][0];
            let y = zones[0].geometry.rings[0][0][1];

            if (Math.abs(x) > 180) { // It's WebMercator
              const lon = (x / 20037508.34) * 180;
              const lat = (Math.atan(Math.exp((y / 20037508.34) * Math.PI)) * 360 / Math.PI) - 90;
              mapCenter = [lon, lat];
            } else {
              mapCenter = [x, y];
            }
          }
        }
      } catch (e) { console.error("Could not parse map center from zones", e) }
      const map = new Map({ basemap: config?.map?.basemap || "satellite" });

      const districts = config?.layers?.districts?.url
        ? new FeatureLayer({
          url: config.layers.districts.url,
          title: "School Districts",
          opacity: 0.3
        })
        : null;

      if (districts) map.add(districts);

      // Create a layer for our dynamic dynamic tree canopies
      const treeCanopyLayer = new GraphicsLayer({
        title: "Microforest Canopy Progression"
      });
      map.add(treeCanopyLayer);

      const view = new MapView({
        container: "canopyMap",
        map,
        center: mapCenter,
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

      let mockTreesData = null;

      // Render canopy based on selected year
      const renderCanopy = () => {
        if (!mockTreesData || !view.ready) return;

        treeCanopyLayer.removeAll();
        const targetYear = Number(yearSlider.value);

        mockTreesData.features.forEach(feature => {
          const props = feature.properties;
          const coords = feature.geometry.coordinates;

          if (targetYear < props.plantYear) return; // Tree not planted yet

          const speciesConfig = config.treeSpecies[props.species] || { growthRateFeetPerYear: 2, color: [34, 139, 34, 0.6] };
          const yearsGrown = targetYear - props.plantYear;

          let currentRadiusFeet = props.baseRadiusFeet + (yearsGrown * speciesConfig.growthRateFeetPerYear);
          if (currentRadiusFeet > props.maxRadiusFeet) currentRadiusFeet = props.maxRadiusFeet;

          const currentRadiusMeters = currentRadiusFeet * 0.3048; // Convert feet to meters

          const point = new Point({
            longitude: coords[0],
            latitude: coords[1]
          });

          // Generate a circle polygon around the point
          const circle = geometryEngine.geodesicBuffer(point, currentRadiusMeters, "meters");

          const graphic = new Graphic({
            geometry: circle,
            symbol: {
              type: "simple-fill",
              color: speciesConfig.color,
              outline: {
                color: [255, 255, 255, 0.8],
                width: 1
              }
            },
            attributes: props,
            popupTemplate: {
              title: "{species}",
              content: `Planted: {plantYear}<br/>Current Year: ${targetYear}<br/>Estimated Canopy Radius: ${currentRadiusFeet} ft`
            }
          });

          treeCanopyLayer.add(graphic);
        });
      };

      // Re-bind the event listener to our render function
      yearSlider.addEventListener("input", renderCanopy);

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
            let currentVal = parseInt(yearSlider.value, 10);
            currentVal += 1; // 1 year steps
            if (currentVal > 2055) currentVal = 2020; // Loop back

            yearSlider.value = currentVal;
            yearReadout.textContent = currentVal;
            renderCanopy();
          }, 500); // Ticks every half second
        } else {
          clearInterval(playInterval);
        }
      }

      if (playBtn) {
        playBtn.addEventListener('click', togglePlay);
      }

      yearSlider.addEventListener('mousedown', () => {
        if (isPlaying) togglePlay();
      });

      // Fetch the mock trees JSON 
      fetch("data/mock_trees.json")
        .then(response => response.json())
        .then(data => {
          mockTreesData = data;

          // Render initial state once view is ready
          if (view.ready) {
            renderCanopy();
          } else {
            view.when(renderCanopy);
          }
        })
        .catch(err => console.error("Error loading mock trees:", err));


      trend2020.textContent = "5.2%";
      trend2025.textContent = "8.1%";
      trend2030.textContent = "36.4%";
    }
  );
})();
