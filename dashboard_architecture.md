# UTRGV Agroecology Dashboard Architecture & Planning

This document captures the ideas, features, and technical architecture for the UTRGV Agroecology tree canopy and environmental dashboard, based on brainstorms, landscape architect meetings, and site visits (March 2026).

## 1. Core Vision & Data Integration
- **Concept:** Convert static landscape architecture models (from AutoCAD) into an interactive, "zoomed-up" virtual campus dashboard.
- **Data Needs:** 
  - AutoCAD / layout exports in GeoJSON or Shapefile format. We need exact object locations, tree species, and initial canopy polygons.
- **Key Features:**
  - **Time-Series Canopy Progression:** A timeline slider (Year 0 to Year 30) simulating tree growth.
  - **Species Data integration:** Using growth rates (e.g., large shade trees like Bur Oak, Live Oak, Montezuma Bald Cypress, Texas Pecan, Mexican Sycamore at 2-3 feet per year) to dynamically expand tree canopy radii on the map as the user interacts with the slider.

## 2. Wind Directional Analysis
- **Concept:** Visualize uni-directional and multi-directional wind patterns across the campus. Users should see how buildings and new landscape designs (like the "Microforest") act as windbreaks or funnels.
- **Data Needs:** Live or historical wind data sources.
- **Tech Stack:** JavaScript mapping plugins like `leaflet-velocity` or Mapbox wind vector animations to render flowing wind particle lines right over the campus map.

## 3. Viewshed & Greenery Analysis (Line of Sight)
- **Concept:** Calculate "Line of Sight" from school campus windows to assess visual access to greenery versus concrete/asphalt. This could generate a "Green View Score" for different classrooms.
- **Data Needs:** 
  - Precise mapping of school window locations.
  - Tree canopy polygons, heights, and building footprints.
- **Tech Stack:** Client-side spatial analysis via **Turf.js** (or backend via **PostGIS**). Draw sightlines from windows and calculate what percentage of those vectors intersect with the tree canopy vs. parking lots.

## 4. 3D Microclimate & Orbital Shadow Simulation
- **Concept:** Provide a 3D orbital view of a simulated Montezuma Cypress tree to demonstrate how canopy shade dynamically cools specific microclimate zones throughout the day.
- **Data Needs:** Mock localized temperature data from 6:00 AM to 6:00 PM showing the temperature differential between the sun-exposed exterior and the shaded interior.
- **Key Features:**
  - A 3D generated tree representing a broad, weeping Montezuma Cypress canopy.
  - A "Time of Day" slider (6 AM to 6 PM) that physically moves a directional sun light to cast dynamic shadows across the ground plane.
  - Live data readouts updating the mock temperature for "In Sun" vs "In Shade" as the hours pass.
  - An orbital camera allowing the user to smoothly pan 360-degrees around the tree infrastructure.
- **Tech Stack:** 
  - **Three.js** to handle the web-native 3D rendering, mesh generation, real-time shadow mapping, and camera orbital controls.

## 5. Walkable Distance & Trail Analysis
- **Concept:** Trace the pedestrian trails and walkable areas on top of the campus map (both existing and proposed) to analyze shade equity and surface permeability.
- **Data Needs:** 
  - Mapped pedestrian pathway vectors (from the site plan, e.g., identifying the path through the "successional forest" vs open areas).
  - Building height data, tree heights, and canopy widths.
- **Key Metrics:**
  - Total walkable space (miles/feet).
  - **Shade Equity:** Covered (shaded) vs. Uncovered trail distance.
  - **Surface Type:** Permeable (dirt/decomposed granite) vs. Impermeable (concrete/asphalt) trail distance.
- **Tech Stack:**
  - Spatial intersection to measure the overlap of shadows cast by buildings and trees onto the pedestrian pathways. Gives a live readout like "This route is currently 80% shaded at 2:00 PM."
  - Heat maps of walking intensity and time spent in specific zones.

## 6. Student Movement Heatmap (Time-Based)
- **Concept:** Visualize where students and teachers are spending their outdoor time across the campus over the course of a school day (8:00 AM to 4:00 PM).
- **Data Needs:** Simulated temporal point data representing a sample group of the 350+ students on campus (e.g., 20 tracked individuals or "dots") returning inside or going outside to different zones based on the time of day.
- **Key Features:**
  - A "Time of Day" slider that dynamically updates the position of student clusters.
  - Heat map or dot visualization showing clustering (e.g. gathering in the shaded microforest during lunch, or out on the field for recess).
- **Tech Stack:**
  - ArcGIS `FeatureLayer` or Mapbox animated points where coordinates update smoothly based on the slider timestamp.

## 7. Biodiversity Tracking (iNaturalist Integration)
- **Concept:** Track and visualize observations of nature made on campus by students, parents, and teachers over time, pulling in data from iNaturalist to build a living catalog of the microforest ecosystem.
- **Key Features:**
  - A running tally board and photo gallery of all bird species noticed on campus.
  - Tracking for all butterfly species and pollinators.
  - Tracking for all plant and tree species identified on the property.
  - A dashboard section to allow direct uploads of observations or automatic syncing with a specific iNaturalist project for the J.W. Caceres campus.
- **Tech Stack:**
  - iNaturalist API for scraping/fetching recent observations based on the campus geographic bounding box.
  - A dynamic photo grid and tally board to render the recorded photos, species names, and descriptions.