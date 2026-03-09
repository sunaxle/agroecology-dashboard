import json
import os

zones_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'campus_boundary.json')
with open(zones_path, 'r') as f:
    zones_data = json.load(f)

boundary_coords = []
if zones_data.get('features'):
    boundary_coords = zones_data['features'][0]['geometry']['coordinates'][0]

if not boundary_coords:
    min_lon, max_lon = -98.0745, -98.0675
    min_lat, max_lat = 26.1650, 26.1695
else:
    min_lon = min(p[0] for p in boundary_coords)
    max_lon = max(p[0] for p in boundary_coords)
    min_lat = min(p[1] for p in boundary_coords)
    max_lat = max(p[1] for p in boundary_coords)

center_lon = (min_lon + max_lon) / 2
center_lat = (min_lat + max_lat) / 2

w = max_lon - min_lon
h = max_lat - min_lat

# We will generate 3 main trails mapping over the property
# 1. Main concrete loop around the building (Impermeable)
# 2. Dirt trail cutting through the new microforest fields (Permeable)
# 3. Connection path from street to entrance (Impermeable)

features = []

# Trail 1: Concrete Loop (Impermeable)
# Draws a rectangle roughly around the center "building" area
loop_coords = [
    [center_lon - w*0.2, center_lat + h*0.2],
    [center_lon + w*0.2, center_lat + h*0.2],
    [center_lon + w*0.2, center_lat - h*0.2],
    [center_lon - w*0.2, center_lat - h*0.2],
    [center_lon - w*0.2, center_lat + h*0.2] # close the loop
]
features.append({
    "type": "Feature",
    "properties": {
        "id": "T1",
        "name": "Main Building Loop",
        "type": "Impermeable",
        "material": "Concrete",
        "length_ft": 2450,
        "shaded_percent": 15
    },
    "geometry": {
        "type": "LineString",
        "coordinates": loop_coords
    }
})

# Trail 2: Microforest Dirt Trail (Permeable)
# Winding path through the eastern/northern fields
forest_coords = [
    [center_lon + w*0.1, center_lat + h*0.1], # starts off the loop
    [center_lon + w*0.25, center_lat + h*0.3],
    [center_lon + w*0.4, center_lat + h*0.2],
    [center_lon + w*0.35, center_lat + h*0.05],
    [center_lon + w*0.2, center_lat - h*0.1]
]
features.append({
    "type": "Feature",
    "properties": {
        "id": "T2",
        "name": "Microforest Nature Walk",
        "type": "Permeable",
        "material": "Decomposed Granite / Dirt",
        "length_ft": 3120,
        "shaded_percent": 80
    },
    "geometry": {
        "type": "LineString",
        "coordinates": forest_coords
    }
})

# Trail 3: Street Access (Impermeable)
access_coords = [
    [min_lon, center_lat], # starts at west edge
    [center_lon - w*0.2, center_lat] # connects to loop
]
features.append({
    "type": "Feature",
    "properties": {
        "id": "T3",
        "name": "Front Entrance Access",
        "type": "Impermeable",
        "material": "Concrete Sidewalk",
        "length_ft": 840,
        "shaded_percent": 5
    },
    "geometry": {
        "type": "LineString",
        "coordinates": access_coords
    }
})


geo_json = {
    "type": "FeatureCollection",
    "features": features
}

output_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'mock_trails.json')
with open(output_path, 'w') as f:
    json.dump(geo_json, f, indent=2)

print("Successfully generated mock_trails.json")
