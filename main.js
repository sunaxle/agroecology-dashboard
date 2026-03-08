(function () {
  const config = window.APP_CONFIG;
  if (!config) {
    console.error("APP_CONFIG not found.");
    return;
  }

  const districtSelect = document.getElementById("districtSelect");
  const districtName = document.getElementById("districtName");
  const canopyValue = document.getElementById("canopyValue");
  const albedoValue = document.getElementById("albedoValue");
  const lstSummer = document.getElementById("lstSummer");
  const lstSpring = document.getElementById("lstSpring");
  const lstFall = document.getElementById("lstFall");
  const lstWinter = document.getElementById("lstWinter");
  const statusBox = document.getElementById("statusBox");
  const activeSchoolName = document.getElementById("activeSchoolName");
  const drawAreaBtn = document.getElementById("drawAreaBtn");
  const finishDrawingBtn = document.getElementById("finishDrawingBtn");
  const cancelDrawingBtn = document.getElementById("cancelDrawingBtn");
  const addObservationBtn = document.getElementById("addObservationBtn");
  const downloadAreasBtn = document.getElementById("downloadAreasBtn");
  const downloadObservationsBtn = document.getElementById("downloadObservationsBtn");
  const downloadObservationsCsvBtn = document.getElementById("downloadObservationsCsvBtn");
  const fieldStatus = document.getElementById("fieldStatus");
  const areasTableHint = document.getElementById("areasTableHint");
  const observationsTableHint = document.getElementById("observationsTableHint");
  const layerPanelToggle = document.getElementById("layerPanelToggle");


  config.districts.forEach((district) => {
    const option = document.createElement("option");
    option.value = district.id;
    option.textContent = district.name;
    districtSelect.appendChild(option);
  });

  function setMetrics(districtId) {
    const metrics = config.metrics[districtId];
    if (!metrics) return;
    districtName.textContent = config.districts.find((d) => d.id === districtId)?.name || "District";
    canopyValue.textContent = `${metrics.canopyPct}%`;
    albedoValue.textContent = `${metrics.albedoPct}%`;
    lstSummer.textContent = `${metrics.lst.summer}°F`;
    lstSpring.textContent = `${metrics.lst.spring}°F`;
    lstFall.textContent = `${metrics.lst.fall}°F`;
    lstWinter.textContent = `${metrics.lst.winter}°F`;
  }

  function setFieldStatus(message) {
    fieldStatus.textContent = message;
    if (statusBox) statusBox.textContent = message;
  }

  window.require(
    [
      "esri/Map",
      "esri/views/MapView",
      "esri/layers/FeatureLayer",
      "esri/layers/ImageryLayer",
      "esri/Graphic",
      "esri/layers/GraphicsLayer",
      "esri/layers/GroupLayer",
      "esri/widgets/Legend",
      "esri/widgets/BasemapToggle",
      "esri/widgets/Zoom",
      "esri/widgets/FeatureTable",
      "esri/widgets/Sketch",
      "esri/geometry/geometryEngine",
      "esri/geometry/support/webMercatorUtils",
      "esri/widgets/LayerList"
    ],
    (Map, MapView, FeatureLayer, ImageryLayer, Graphic, GraphicsLayer, GroupLayer, Legend, BasemapToggle, Zoom, FeatureTable, Sketch, geometryEngine, webMercatorUtils, LayerList) => {
      function createLayer(layerConfig) {
        if (!layerConfig.url) return null;
        if (layerConfig.type === "imagery") {
          return new ImageryLayer({
            url: layerConfig.url,
            title: layerConfig.title
          });
        }
        return new FeatureLayer({
          url: layerConfig.url,
          title: layerConfig.title
        });
      }

      const map = new Map({ basemap: config.map.basemap });
      const sketchLayer = new GraphicsLayer({ title: "Sketch Layer", listMode: "hide" });
      map.add(sketchLayer);

      const districtsLayer = createLayer(config.layers.districts);
      const schoolsLayer = createLayer(config.layers.schools);
      const schoolAreasLayer = config.layers.schoolAreas.url
        ? createLayer(config.layers.schoolAreas)
        : new FeatureLayer({
            title: "School Areas",
            source: [],
            fields: [
              { name: "ObjectID", type: "oid" },
              { name: config.fields.areaSchool, type: "string" },
              { name: config.fields.areaName, type: "string" }
            ],
            objectIdField: "ObjectID",
            geometryType: "polygon"
          });
      const treeObservationsLayer = config.layers.treeObservations.url
        ? createLayer(config.layers.treeObservations)
        : new FeatureLayer({
            title: "Tree Observations",
            source: [],
            fields: [
              { name: "ObjectID", type: "oid" },
              { name: config.fields.observationSchool, type: "string" },
              { name: config.fields.observationCount, type: "integer" },
              { name: config.fields.observationObserver, type: "string" },
              { name: config.fields.observationDate, type: "date" },
              { name: config.fields.observationMethod, type: "string" },
              { name: config.fields.observationNotes, type: "string" }
            ],
            objectIdField: "ObjectID",
            geometryType: "point"
          });
      const imageryLayers = {};

      Object.entries(config.layers).forEach(([key, layerConfig]) => {
        if (layerConfig.type === "imagery") {
          const layer = createLayer(layerConfig);
          if (layer) imageryLayers[key] = layer;
        }
      });

      if (districtsLayer) {
        const districtWhere = config.districts.map((d) => `(${d.where})`).join(" OR ");
        districtsLayer.definitionExpression = districtWhere;
        districtsLayer.renderer = {
          type: "simple",
          symbol: {
            type: "simple-fill",
            color: [120, 189, 170, 0.15],
            outline: {
              color: [27, 77, 43, 1],
              width: 2
            }
          }
        };
        districtsLayer.legendEnabled = true;
        map.add(districtsLayer);
      }
      if (schoolsLayer) {
        const districtWhere = config.districts.map((d) => `(${d.where})`).join(" OR ");
        const levelWhere = `${config.fields.schoolsLevel} IN ('Elementary','Elementary School')`;
        schoolsLayer.definitionExpression = `${districtWhere} AND ${levelWhere}`;
        schoolsLayer.renderer = {
          type: "simple",
          symbol: {
            type: "simple-marker",
            size: 16,
            color: [46, 107, 63, 0.65],
            outline: {
              color: [255, 255, 255, 1],
              width: 1.5
            }
          }
        };
        schoolsLayer.labelingInfo = [
          {
            labelExpressionInfo: {
              expression: `$feature.${config.fields.schoolsName}`
            },
            symbol: {
              type: "text",
              color: [27, 77, 43, 1],
              haloColor: [255, 255, 255, 1],
              haloSize: 1.5,
              font: {
                size: 10,
                family: "Georgia"
              }
            },
            labelPlacement: "above-center"
          }
        ];
        schoolsLayer.labelsVisible = true;
        schoolsLayer.legendEnabled = true;
        map.add(schoolsLayer);
      }

      if (schoolAreasLayer) {
        schoolAreasLayer.renderer = {
          type: "simple",
          symbol: {
            type: "simple-fill",
            color: [46, 107, 63, 0.1],
            outline: {
              color: [46, 107, 63, 1],
              width: 2
            }
          }
        };
        schoolAreasLayer.legendEnabled = true;
        map.add(schoolAreasLayer);
      }

      if (treeObservationsLayer) {
        treeObservationsLayer.renderer = {
          type: "simple",
          symbol: {
            type: "simple-marker",
            size: 10,
            color: [27, 77, 43, 1],
            outline: {
              color: [255, 255, 255, 1],
              width: 1
            }
          }
        };
        treeObservationsLayer.legendEnabled = true;
        map.add(treeObservationsLayer);
      }

      function addRgvLayers() {
        const rgvConfig = config.layers.rgv;
        if (!rgvConfig) return;

        const referenceGroup = new GroupLayer({
          title: rgvConfig.reference.title,
          visibilityMode: "independent",
          layers: rgvConfig.reference.layers.map(
            (layer) =>
              new FeatureLayer({
                url: layer.url,
                title: layer.title,
                visible: true
              })
          )
        });

        const residentialGroup = new GroupLayer({
          title: rgvConfig.residential.title,
          visibilityMode: "independent",
          visible: false,
          layers: rgvConfig.residential.layers.map(
            (layer) =>
              new FeatureLayer({
                url: layer.url,
                title: layer.title,
                visible: true
              })
          )
        });

        const standaloneLayers = rgvConfig.standalone.map(
          (layer) =>
            new FeatureLayer({
              url: layer.url,
              title: layer.title,
              visible: layer.visible
            })
        );

        map.addMany([referenceGroup, residentialGroup, ...standaloneLayers]);
      }

      addRgvLayers();
      Object.values(imageryLayers).forEach((layer) => map.add(layer));

      const view = new MapView({
        container: "mapView",
        map,
        center: config.map.center,
        zoom: config.map.zoom
      });

      // Ensure client-side layers share the view spatial reference to avoid dropping graphics.
      if (!config.layers.schoolAreas.url) {
        schoolAreasLayer.spatialReference = view.spatialReference;
      }
      if (!config.layers.treeObservations.url) {
        treeObservationsLayer.spatialReference = view.spatialReference;
      }

      new Legend({
        view,
        container: "legendContainer"
      });

      const layerList = new LayerList({
        view,
        container: "layerListContainer"
      });

      const areasTable = new FeatureTable({
        view,
        layer: schoolAreasLayer,
        container: "areasTableContainer"
      });

      const basemapToggle = new BasemapToggle({
        view,
        nextBasemap: "satellite"
      });
      view.ui.add(basemapToggle, "top-right");

      const zoomWidget = new Zoom({ view });
      view.ui.add(zoomWidget, "top-right");

      if (layerPanelToggle) {
        layerPanelToggle.addEventListener("click", () => {
          const panel = document.querySelector(".layer-panel");
          if (!panel) return;
          panel.style.display = panel.style.display === "none" ? "flex" : "none";
        });
      }

      const observationsTable = new FeatureTable({
        view,
        layer: treeObservationsLayer,
        container: "tableContainer"
      });

      function loadLocalFeatures(storageKey, layer) {
        try {
          const raw = localStorage.getItem(storageKey);
          if (!raw) return;
          const items = JSON.parse(raw);
          items.forEach((item) => {
            const graphic = new Graphic(item);
            layer.source.add(graphic);
          });
        } catch (error) {
          console.error(error);
          setFieldStatus("Could not load saved local data.");
        }
      }

      function getNextObjectId(layer) {
        const features = layer.source?.toArray?.() || [];
        const ids = features.map((feature) => feature.attributes?.ObjectID || 0);
        return Math.max(0, ...ids) + 1;
      }

      function saveLocalFeature(storageKey, graphic) {
        try {
          const raw = localStorage.getItem(storageKey);
          const items = raw ? JSON.parse(raw) : [];
          items.push(graphic.toJSON());
          localStorage.setItem(storageKey, JSON.stringify(items));
        } catch (error) {
          console.error(error);
          setFieldStatus("Could not save local data.");
        }
      }

      const sketch = new Sketch({
        view,
        layer: sketchLayer,
        availableCreateTools: ["polygon", "rectangle"],
        creationMode: "single"
      });
      // Keep Sketch UI hidden; use our own buttons for a simpler flow.

      async function tightenToDistricts() {
        if (!districtsLayer) return;
        const districtWhere = config.districts.map((d) => `(${d.where})`).join(" OR ");
        const extentResult = await districtsLayer.queryExtent({ where: districtWhere });
        if (!extentResult.extent) return;
        const expanded = extentResult.extent.expand(1.2);
        view.goTo(expanded);
        view.constraints = {
          geometry: expanded
        };
      }

      let activeSchool = null;
      let addingObservation = false;
      let isDrawing = false;
      let localAreaId = 1;
      let localObsId = 1;

      function setButtonsEnabled(isEnabled) {
        drawAreaBtn.disabled = !isEnabled;
        addObservationBtn.disabled = !isEnabled;
        finishDrawingBtn.disabled = !isDrawing;
        cancelDrawingBtn.disabled = !isDrawing;
      }

      setFieldStatus("Step 1: Click a school point to select it.");
      setButtonsEnabled(false);

      if (!schoolAreasLayer.url) {
        loadLocalFeatures("rg-school-areas", schoolAreasLayer);
        localAreaId = getNextObjectId(schoolAreasLayer);
      }
      if (!treeObservationsLayer.url) {
        loadLocalFeatures("rg-tree-observations", treeObservationsLayer);
        localObsId = getNextObjectId(treeObservationsLayer);
      }

      async function getActiveSchoolAreaGeometry() {
        if (!activeSchool || !schoolAreasLayer) return null;
        const areaField = config.fields.areaSchool;
        if (schoolAreasLayer.source?.toArray) {
          const match = schoolAreasLayer
            .source
            .toArray()
            .find((feature) => feature.attributes?.[areaField] === activeSchool.id);
          return match?.geometry || null;
        }
        const query = schoolAreasLayer.createQuery();
        query.where = `${areaField} = '${activeSchool.id.replace(/'/g, "''")}'`;
        query.returnGeometry = true;
        const results = await schoolAreasLayer.queryFeatures(query);
        return results.features[0]?.geometry || null;
      }

      view.on("click", async (event) => {
        if (addingObservation) {
          if (!activeSchool) {
            setFieldStatus("Select a school first by clicking its point.");
            addingObservation = false;
            return;
          }
          const attributes = promptForObservation();
          if (!attributes) {
            addingObservation = false;
            return;
          }
          let point = event.mapPoint;
          const areaGeom = await getActiveSchoolAreaGeometry();
          if (areaGeom && !geometryEngine.contains(areaGeom, point)) {
            const snapped = geometryEngine.nearestCoordinate(areaGeom, point);
            if (snapped?.coordinate) {
              point = snapped.coordinate;
              setFieldStatus("Observation snapped to school area boundary.");
            } else {
              setFieldStatus("Observation added outside school area.");
            }
          }
          const graphic = new Graphic({
            geometry: point,
            attributes: {
              ObjectID: localObsId++,
              ...attributes
            }
          });
          if (treeObservationsLayer.url) {
            await treeObservationsLayer.applyEdits({ addFeatures: [graphic] });
          } else {
            treeObservationsLayer.source.add(graphic);
            saveLocalFeature("rg-tree-observations", graphic);
            treeObservationsLayer.refresh();
            observationsTable.refresh();
          }
          addingObservation = false;
          setFieldStatus("Observation saved. Click another school or add more.");
          return;
        }

        if (!schoolsLayer) return;
        const hit = await view.hitTest(event);
        const schoolGraphic = hit.results.find(
          (result) => result.graphic?.layer === schoolsLayer
        )?.graphic;
        if (!schoolGraphic) return;
        const nameField = config.fields.schoolsName;
        activeSchool = {
          name: schoolGraphic.attributes[nameField],
          id: schoolGraphic.attributes[nameField]
        };
        activeSchoolName.textContent = activeSchool.name;
        const safeId = activeSchool.id.replace(/'/g, "''");
        view.whenLayerView(schoolAreasLayer).then((layerView) => {
          layerView.filter = { where: `${config.fields.areaSchool} = '${safeId}'` };
        });
        view.whenLayerView(treeObservationsLayer).then((layerView) => {
          layerView.filter = { where: `${config.fields.observationSchool} = '${safeId}'` };
        });
        if (areasTableHint) {
          areasTableHint.textContent = `Draft area for ${activeSchool.name} (not saved yet).`;
        }
        if (observationsTableHint) {
          observationsTableHint.textContent = `Observations for ${activeSchool.name} will appear here.`;
        }
        setButtonsEnabled(true);
        setFieldStatus("Step 2: Click 'Draw School Area' or 'Add Tree Observation'.");
      });

      function promptForObservation() {
        if (!activeSchool) {
          setFieldStatus("Select a school first by clicking its point.");
          return null;
        }
        const count = Number(prompt("Tree count observed:", "0"));
        if (Number.isNaN(count)) return null;
        const observer = prompt("Observer name:", "") || "";
        const method = prompt("Method (e.g., ground survey):", "") || "";
        const notes = prompt("Notes:", "") || "";
        return {
          [config.fields.observationSchool]: activeSchool.id,
          [config.fields.observationCount]: count,
          [config.fields.observationObserver]: observer,
          [config.fields.observationDate]: new Date(),
          [config.fields.observationMethod]: method,
          [config.fields.observationNotes]: notes
        };
      }

      addObservationBtn.addEventListener("click", () => {
        if (!activeSchool) {
          setFieldStatus("Select a school first by clicking its point.");
          return;
        }
        addingObservation = true;
        setFieldStatus("Step 3: Click the map to place the observation.");
      });

      drawAreaBtn.addEventListener("click", () => {
        if (!activeSchool) {
          setFieldStatus("Select a school first by clicking its point.");
          return;
        }
        sketch.create("polygon");
        isDrawing = true;
        finishDrawingBtn.disabled = false;
        cancelDrawingBtn.disabled = false;
        setFieldStatus("Step 3: Click to draw the polygon, then click 'Finish Drawing' (do not double-click).");
      });

      finishDrawingBtn.addEventListener("click", () => {
        if (!isDrawing || sketch.state !== "active") {
          setFieldStatus("No active drawing. Click 'Draw School Area' to start a new one.");
          return;
        }
        sketch.complete();
      });

      cancelDrawingBtn.addEventListener("click", () => {
        if (!isDrawing) return;
        sketch.cancel();
        isDrawing = false;
        finishDrawingBtn.disabled = true;
        cancelDrawingBtn.disabled = true;
        setFieldStatus("Drawing cancelled. Click 'Draw School Area' to try again.");
      });

      sketch.on("create", async (event) => {
        if (event.state !== "complete" || !activeSchool) return;
        const attributes = {
          [config.fields.areaSchool]: activeSchool.id,
          [config.fields.areaName]: activeSchool.name
        };
        event.graphic.attributes = attributes;
        try {
          const geometry = event.graphic.geometry;
          const rings = geometry?.rings?.[0] || [];
          if (!geometry || rings.length < 3) {
            setFieldStatus("Polygon not closed. Add a few more points, then click Finish Drawing again.");
            return;
          }
          if (schoolAreasLayer.url) {
            await schoolAreasLayer.applyEdits({ addFeatures: [event.graphic] });
          } else {
            const areaGraphic = new Graphic({
              geometry,
              attributes: {
                ObjectID: localAreaId++,
                ...attributes
              }
            });
            schoolAreasLayer.source.add(areaGraphic);
            saveLocalFeature("rg-school-areas", areaGraphic);
            schoolAreasLayer.refresh();
            areasTable.refresh();
          }
          // Remove sketch graphic so only the saved area remains.
          sketchLayer.remove(event.graphic);
          setFieldStatus(`School area saved for ${activeSchool.name}. You can add observations now.`);
        } catch (error) {
          console.error(error);
          setFieldStatus("Could not save the area. Try again.");
        } finally {
          isDrawing = false;
          finishDrawingBtn.disabled = true;
          cancelDrawingBtn.disabled = true;
        }
      });

      function geometryToGeoJSON(geometry) {
        if (!geometry) return null;
        let geo = geometry;
        if (geo.spatialReference?.isWebMercator) {
          geo = webMercatorUtils.webMercatorToGeographic(geo);
        }
        if (geo.type === "point") {
          return {
            type: "Point",
            coordinates: [geo.x, geo.y]
          };
        }
        if (geo.type === "polygon") {
          return {
            type: "Polygon",
            coordinates: geo.rings
          };
        }
        if (geo.type === "polyline") {
          return {
            type: "LineString",
            coordinates: geo.paths?.[0] || []
          };
        }
        return null;
      }

      function downloadGeoJSON(layer, filename) {
        const features = layer.source?.toArray?.() || [];
        const geojson = {
          type: "FeatureCollection",
          features: features.map((feature) => ({
            type: "Feature",
            geometry: geometryToGeoJSON(feature.geometry),
            properties: { ...feature.attributes }
          }))
        };
        const blob = new Blob([JSON.stringify(geojson, null, 2)], {
          type: "application/json"
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
      }

      downloadAreasBtn.addEventListener("click", () => {
        downloadGeoJSON(schoolAreasLayer, "school-areas.geojson");
      });

      downloadObservationsBtn.addEventListener("click", () => {
        downloadGeoJSON(treeObservationsLayer, "tree-observations.geojson");
      });

      function toCsv(rows) {
        if (!rows.length) return "";
        const headers = Object.keys(rows[0]);
        const escape = (value) => {
          const str = value == null ? "" : String(value);
          if (/[,\"\n]/.test(str)) return `"${str.replace(/"/g, "\"\"")}"`;
          return str;
        };
        const lines = [headers.join(",")];
        rows.forEach((row) => {
          lines.push(headers.map((h) => escape(row[h])).join(","));
        });
        return lines.join("\\n");
      }

      async function downloadObservationsCsv() {
        let rows = [];
        if (treeObservationsLayer.source?.toArray) {
          rows = treeObservationsLayer.source.toArray().map((feature) => ({
            ...feature.attributes
          }));
        } else {
          const query = treeObservationsLayer.createQuery();
          query.where = "1=1";
          query.outFields = ["*"];
          query.returnGeometry = false;
          const results = await treeObservationsLayer.queryFeatures(query);
          rows = results.features.map((feature) => ({ ...feature.attributes }));
        }
        const csv = toCsv(rows);
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "tree-observations.csv";
        link.click();
        URL.revokeObjectURL(url);
      }

      downloadObservationsCsvBtn.addEventListener("click", () => {
        downloadObservationsCsv();
      });

      async function selectDistrict(districtId) {
        const district = config.districts.find((d) => d.id === districtId);
        if (!district || !districtsLayer) return;
        const query = districtsLayer.createQuery();
        query.where = district.where;
        query.returnGeometry = true;
        const results = await districtsLayer.queryFeatures(query);
        if (results.features.length === 0) return;
        const geometry = results.features[0].geometry;
        view.goTo(geometry.extent.expand(1.5));

        if (schoolsLayer) {
          const layerView = await view.whenLayerView(schoolsLayer);
          layerView.filter = { geometry };
        }
      }

      districtSelect.addEventListener("change", () => {
        const districtId = districtSelect.value;
        setMetrics(districtId);
        selectDistrict(districtId);
      });

      setMetrics(config.districts[0].id);
      tightenToDistricts();
      selectDistrict(config.districts[0].id);
    }
  );
})();
