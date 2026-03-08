import json
import random
import os

# Base campus bounds
minLon = -98.0745
maxLon = -98.0675
minLat = 26.1650
maxLat = 26.1695
centerLon = (minLon + maxLon) / 2
centerLat = (minLat + maxLat) / 2

# Define logical cluster zones
zones = {
    # Front drop-off loop (East side)
    "entrance": { "minLon": centerLon + 0.0010, "maxLon": centerLon + 0.0020, "minLat": centerLat - 0.0010, "maxLat": centerLat + 0.0000 },
    # Main building interior
    "indoor": { "minLon": centerLon - 0.0005, "maxLon": centerLon + 0.0010, "minLat": centerLat - 0.0015, "maxLat": centerLat + 0.0010 },
    # Lunch/Shaded Courtyard (West side near building)
    "courtyard": { "minLon": centerLon - 0.0015, "maxLon": centerLon - 0.0005, "minLat": centerLat - 0.0005, "maxLat": centerLat + 0.0005 },
    # The new Microforest area
    "microforest": { "minLon": centerLon + 0.0010, "maxLon": centerLon + 0.0040, "minLat": centerLat + 0.0010, "maxLat": centerLat + 0.0025 },
    # The Recess Track/Field (Far West)
    "field": { "minLon": minLon + 0.0005, "maxLon": centerLon - 0.0015, "minLat": minLat + 0.0005, "maxLat": maxLat - 0.0005 }
}

def get_zone_coords(zone_name):
    z = zones[zone_name]
    return [
        round(random.uniform(z["minLon"], z["maxLon"]), 5),
        round(random.uniform(z["minLat"], z["maxLat"]), 5)
    ]

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
