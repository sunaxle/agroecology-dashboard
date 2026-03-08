import json
import os

# Base coordinates around Rivas Elementary
min_lon = -98.0745
max_lon = -98.0675
min_lat = 26.1650
max_lat = 26.1695

center_lon = (min_lon + max_lon) / 2
center_lat = (min_lat + max_lat) / 2

# We will generate 3 main trails mapping over the property
# 1. Main concrete loop around the building (Impermeable)
# 2. Dirt trail cutting through the new microforest fields (Permeable)
# 3. Connection path from street to entrance (Impermeable)

features = []

# Trail 1: Concrete Loop (Impermeable)
# Draws a rectangle roughly around the center "building" area
loop_coords = [
    [center_lon - 0.0015, center_lat + 0.0015],
    [center_lon + 0.0015, center_lat + 0.0015],
    [center_lon + 0.0015, center_lat - 0.0015],
    [center_lon - 0.0015, center_lat - 0.0015],
    [center_lon - 0.0015, center_lat + 0.0015] # close the loop
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
    [center_lon + 0.0010, center_lat + 0.0010], # starts off the loop
    [center_lon + 0.0020, center_lat + 0.0025],
    [center_lon + 0.0035, center_lat + 0.0020],
    [center_lon + 0.0040, center_lat + 0.0005],
    [center_lon + 0.0030, center_lat - 0.0010]
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
    [min_lon + 0.0005, center_lat], # starts at west street
    [center_lon - 0.0015, center_lat] # connects to loop
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
