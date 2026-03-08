import json
import random
import os

# Updated bounding box for the target field area based on the image provided
# This targets the large grassy field to the west of the main buildings and track
minLon = -98.0725
maxLon = -98.0700
minLat = 26.1660
maxLat = 26.1690

speciesList = [
    "Bur Oak",
    "Live Oak",
    "Montezuma Bald Cypress",
    "Texas Pecan",
    "Mexican Sycamore"
]

totalTrees = 158
features = []

for i in range(1, totalTrees + 1):
    lon = random.uniform(minLon, maxLon)
    lat = random.uniform(minLat, maxLat)
    species = random.choice(speciesList)
    plantYear = random.randint(2024, 2026)
    baseRadius = round(random.uniform(2.5, 4.5), 1)
    maxRadiusFeet = random.randint(35, 55)

    features.append({
        "type": "Feature",
        "properties": {
            "id": i,
            "species": species,
            "plantYear": plantYear,
            "baseRadiusFeet": baseRadius,
            "maxRadiusFeet": maxRadiusFeet
        },
        "geometry": {
            "type": "Point",
            "coordinates": [round(lon, 4), round(lat, 4)]
        }
    })

geoJson = {
    "type": "FeatureCollection",
    "features": features
}

output_path = os.path.join(os.path.dirname(__file__), "..", "data", "mock_trees.json")
with open(output_path, "w") as f:
    json.dump(geoJson, f, indent=2)

print("Successfully regenerated {} mock trees into the target field zone.".format(totalTrees))
