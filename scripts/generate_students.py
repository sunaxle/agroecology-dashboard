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

# Load the Campus Boundary
zones_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'campus_zones.json')
with open(zones_path, 'r') as f:
    zones_data = json.load(f)

boundary_coords = []
for feature in zones_data.get('features', []):
    if feature.get('properties', {}).get('category') == 'Campus Boundary':
        boundary_coords = feature['geometry']['coordinates'][0]
        break

if not boundary_coords:
    minLon = -98.0745
    maxLon = -98.0675
    minLat = 26.1650
    maxLat = 26.1695
else:
    minLon = min(p[0] for p in boundary_coords)
    maxLon = max(p[0] for p in boundary_coords)
    minLat = min(p[1] for p in boundary_coords)
    maxLat = max(p[1] for p in boundary_coords)

w = maxLon - minLon
h = maxLat - minLat

centerLon = (minLon + maxLon) / 2
centerLat = (minLat + maxLat) / 2

# Define logical cluster zones relative to bounding box size
zones = {
    # East side
    "entrance": { "minLon": centerLon, "maxLon": centerLon + w*0.4, "minLat": centerLat - h*0.2, "maxLat": centerLat + h*0.2 },
    # Center
    "indoor": { "minLon": centerLon - w*0.2, "maxLon": centerLon + w*0.2, "minLat": centerLat - h*0.3, "maxLat": centerLat + h*0.3 },
    # West side slightly
    "courtyard": { "minLon": centerLon - w*0.4, "maxLon": centerLon - w*0.1, "minLat": centerLat - h*0.1, "maxLat": centerLat + h*0.1 },
    # Far East
    "microforest": { "minLon": centerLon + w*0.1, "maxLon": centerLon + w*0.4, "minLat": centerLat + h*0.1, "maxLat": maxLat },
    # Far West
    "field": { "minLon": minLon, "maxLon": centerLon - w*0.2, "minLat": minLat, "maxLat": maxLat }
}

def get_zone_coords(zone_name):
    z = zones[zone_name]
    while True:
        lon = round(random.uniform(z["minLon"], z["maxLon"]), 5)
        lat = round(random.uniform(z["minLat"], z["maxLat"]), 5)
        
        if boundary_coords and not point_in_polygon(lon, lat, boundary_coords):
            continue
            
        return [lon, lat]

num_students = 20
hours = range(8, 17) # 8 AM to 4 PM
features = []

for student_id in range(1, num_students + 1):
    # Determine what 'group' the student is in to stagger schedules slightly
    group = "A" if student_id % 2 == 0 else "B"
    
    for hour in hours:
        # Schedule Logic
        current_zone = "indoor"
        
        if hour == 8:
            # Drop off
            current_zone = "entrance"
        elif hour in [9, 10, 11]:
            # Morning Classes
            if group == "A" and hour == 10:
                current_zone = "microforest" # Environmental science class
            else:
                current_zone = "indoor"
        elif hour == 12:
            # Lunch
            current_zone = "courtyard"
        elif hour == 13:
            # Recess / Field Activity
            current_zone = "field" if group == "B" else "microforest"
        elif hour in [14, 15]:
            # Afternoon Classes
            current_zone = "indoor"
        elif hour == 16:
            # Pick up
            current_zone = "entrance"
            
        coords = get_zone_coords(current_zone)
        
        # We store the time as epoch milliseconds for the target day (just picking a static day like Oct 1, 2026)
        # 2026-10-01 00:00:00 UTC = 1790812800000
        # Timezone offset approx +5 for CST so 8am local is 1pm UTC -> +13 hours from midnight UTC approx.
        # Let's just use simple Unix epoch math.
        # Oct 1 2026 Midnight Local CST is roughly 1790834400000 ms
        base_epoch = 1790834400000
        time_ms = base_epoch + (hour * 3600000)

        # Add a little fuzz to the time down to the minute so they aren't all exactly 00
        time_ms += random.randint(-15, 15) * 60000

        features.append({
            "type": "Feature",
            "properties": {
                "student_id": f"Student_{student_id}",
                "group": group,
                "hour_of_day": hour,
                "timestamp": time_ms,
                "zone_desc": current_zone
            },
            "geometry": {
                "type": "Point",
                "coordinates": coords
            }
        })

geoJson = {
    "type": "FeatureCollection",
    "features": features
}

output_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'mock_students.json')
with open(output_path, 'w') as f:
    json.dump(geoJson, f, indent=2)

print(f"Successfully generated {len(features)} temporal data points for {num_students} mock students.")
