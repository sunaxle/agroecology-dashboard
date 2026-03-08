import json
import random
import os

min_lon = -98.0745
max_lon = -98.0675
min_lat = 26.1650
max_lat = 26.1695

species_list = [
  "Bur Oak",
  "Live Oak",
  "Montezuma Bald Cypress",
  "Texas Pecan",
  "Mexican Sycamore"
]

total_trees = 158
features = []

for i in range(1, total_trees + 1):
  lon = random.uniform(min_lon, max_lon)
  lat = random.uniform(min_lat, max_lat)
  species = random.choice(species_list)
  plant_year = random.randint(2024, 2026)
  base_radius = round(random.uniform(2.5, 4.5), 1)
  max_radius_feet = random.randint(35, 55)

  features.append({
    "type": "Feature",
    "properties": {
      "id": i,
      "species": species,
      "plantYear": plant_year,
      "baseRadiusFeet": base_radius,
      "maxRadiusFeet": max_radius_feet
    },
    "geometry": {
      "type": "Point",
      "coordinates": [round(lon, 4), round(lat, 4)] # Decreased precision slightly to match map standard bounds
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
