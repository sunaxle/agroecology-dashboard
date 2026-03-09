import json
import random
import os

# Ray-casting algorithm to check if a point is inside a polygon
def point_in_polygon(x, y, polygon):
    n = len(polygon)
    inside = False
    p1x, p1y = polygon[0]
    for i in range(1, n + 1):
        p2x, p2y = polygon[i % n]
        if y > min(p1y, p2y):
            if y <= max(p1y, p2y):
                if x <= max(p1x, p2x):
                    if p1y != p2y:
                        xints = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                    if p1x == p2x or x <= xints:
                        inside = not inside
        p1x, p1y = p2x, p2y
    return inside

# Load the Campus Boundary from zones
zones_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'campus_zones.json')
with open(zones_path, 'r') as f:
    zones_data = json.load(f)

boundary_coords = []
for feature in zones_data.get('features', []):
    if feature.get('properties', {}).get('category') == 'Campus Boundary':
        boundary_coords = feature['geometry']['coordinates'][0]
        break

if not boundary_coords:
    # Fallback bounding box if no boundary is defined
    min_lon, max_lon = -98.0745, -98.0675
    min_lat, max_lat = 26.1650, 26.1695
else:
    # Find active bounding box
    min_lon = min(p[0] for p in boundary_coords)
    max_lon = max(p[0] for p in boundary_coords)
    min_lat = min(p[1] for p in boundary_coords)
    max_lat = max(p[1] for p in boundary_coords)

species_list = [
  "Bur Oak",
  "Live Oak",
  "Montezuma Bald Cypress",
  "Texas Pecan",
  "Mexican Sycamore"
]

total_trees = 158
features = []

while len(features) < total_trees:
    lon = random.uniform(min_lon, max_lon)
    lat = random.uniform(min_lat, max_lat)
    
    if boundary_coords and not point_in_polygon(lon, lat, boundary_coords):
        continue
        
    species = random.choice(species_list)
    plant_year = random.randint(2024, 2026)
    base_radius = round(random.uniform(2.5, 4.5), 1)
    max_radius_feet = random.randint(35, 55)

    features.append({
      "type": "Feature",
      "properties": {
        "id": len(features) + 1,
        "species": species,
        "plantYear": plant_year,
        "baseRadiusFeet": base_radius,
        "maxRadiusFeet": max_radius_feet,
        "campus": "J.W. Caceres & M. Rivas Academy"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [round(lon, 4), round(lat, 4)]
      }
    })

geo_json = {
  "type": "FeatureCollection",
  "features": features
}

output_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'mock_trees.json')
with open(output_path, 'w') as f:
    json.dump(geo_json, f, indent=2)

print(f"Successfully generated {total_trees} mock trees and wrote to mock_trees.json")
