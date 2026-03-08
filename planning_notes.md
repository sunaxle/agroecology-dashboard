# Planning Notes & Questions for Architects

These are actionable planning notes and follow-up questions to share with the landscape architects and UTRGV planning team based on the initial brainstorm.

## Data Requests from Architects
To build the interactive dashboard, we need the following data exports from their design software:
1. **AutoCAD files (.dwg or .dxf) exported to GeoJSON/Shapefile**
   - We need exact lat/long coordinates of the proposed "Microforest" and individual tree placements.
   - We need the specific species tagged to each data point.
2. **Current Topography & Building Footprints**
   - Exact building footprints and heights (critical for shadow and wind modeling).
   - Any point cloud data (LiDAR) they might already have of the existing campus.
3. **Pathway Vectors**
   - The exact routes of the planned pathways (e.g., the path through the "successional forest").

## Research & Development Tasks
1. **Tree Growth Matrix:** 
   - Build a JSON dataset of the specific trees (Bur Oak, Live Oak, Montezuma Bald Cypress, Texas Pecan, Mexican Sycamore) containing:
     - Average starting diameter/height at planting.
     - Annual growth rate (2-3 feet/year).
     - Maximum expected canopy width and height.
2. **Tech Stack Vetting:**
   - Test **deck.gl** vs. **Mapbox GL JS** for handling 3D extrusions and heatmaps on the current UTRGV dashboard.
   - Investigate **Turf.js** performance for calculating the "shading percentage" of walkways in the browser.

## Questions for Next Meeting
- Do we have a source for historical wind data at this specific campus location, or should we use regional weather station data?
- To calculate the "Viewshed/Green View Score," can the architects provide us the exact locations/heights of classroom windows? 
- Will the pathways be composed of materials with different albedos (e.g., dark asphalt vs. light concrete or DG surface like in the plans)? This will drastically affect the temperature modeling.
