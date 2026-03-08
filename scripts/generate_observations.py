import json
import random
import os
import math

# Load the species data
bio_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'mock_biodiversity.json')
with open(bio_path, 'r') as f:
    biodiversity = json.load(f)

# Approximate bounding box for Rivas Elementary Campus (Donna, TX)
minLon = -98.0745
maxLon = -98.0675
minLat = 26.1650
maxLat = 26.1695

centerLon = (minLon + maxLon) / 2
centerLat = (minLat + maxLat) / 2

features = []

def generate_point(category, item, index):
    # Determine coordinates based on category strategy
    if category == 'birds':
        # Push to the edges: random angle, push towards the perimeter
        angle = random.uniform(0, 2 * math.pi)
        # Random radius closer to the max distance from center to edge
        r = random.uniform(0.7, 1.0) 
        lon = centerLon + math.cos(angle) * ((maxLon - minLon) * 0.5 * r)
        lat = centerLat + math.sin(angle) * ((maxLat - minLat) * 0.5 * r)
    elif category == 'plants':
        # Clustered closer to the center (representing buildings/courtyards)
        lon = random.gauss(centerLon, (maxLon - minLon) * 0.15)
        lat = random.gauss(centerLat, (maxLat - minLat) * 0.15)
        # Keep within bounds
        lon = max(minLon, min(maxLon, lon))
        lat = max(minLat, min(maxLat, lat))
    elif category == 'insects':
        # Scattered evenly across the field areas
        lon = random.uniform(minLon, maxLon)
        lat = random.uniform(minLat, maxLat)

    # Make the point slightly fuzzy to not look too artificial
    lon += random.uniform(-0.0001, 0.0001)
    lat += random.uniform(-0.0001, 0.0001)

    return {
        "type": "Feature",
        "properties": {
            "id": index,
            "category": category,
            "common_name": item.get('common_name'),
            "scientific_name": item.get('scientific_name'),
            "image_url": item.get('image_url', ''),
            "observations": item.get('observations', 0)
        },
        "geometry": {
            "type": "Point",
            "coordinates": [round(lon, 5), round(lat, 5)]
        }
    }

idx = 1
# Generate exactly mapping 20 birds, 25 plants, 25 insects (70 total)
# The mock_biodiversity string has exactly those lengths
for item in biodiversity.get('birds', [])[:20]:
    features.append(generate_point('birds', item, idx))
    idx += 1

for item in biodiversity.get('plants', [])[:25]:
    features.append(generate_point('plants', item, idx))
    idx += 1

for item in biodiversity.get('insects', [])[:25]:
    features.append(generate_point('insects', item, idx))
    idx += 1

geoJson = {
    "type": "FeatureCollection",
    "features": features
}

output_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'mock_observations.json')
with open(output_path, 'w') as f:
    json.dump(geoJson, f, indent=2)

print(f"Successfully generated {len(features)} spatial observations targeted near Rivas Elementary.")
