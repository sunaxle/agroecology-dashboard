import json
import urllib.request
import os

# Bounding box for deep South Texas (Hidalgo County / Donna area)
nelat = 26.5
nelng = -97.8
swlat = 26.0
swlng = -98.4

def fetch_species(iconic_taxa, limit):
    url = f"https://api.inaturalist.org/v1/observations/species_counts?nelat={nelat}&nelng={nelng}&swlat={swlat}&swlng={swlng}&iconic_taxa={iconic_taxa}&per_page={limit}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            results = []
            for item in data.get('results', []):
                taxon = item.get('taxon', {})
                results.append({
                    "common_name": taxon.get('preferred_common_name') or taxon.get('name'),
                    "scientific_name": taxon.get('name'),
                    "image_url": taxon.get('default_photo', {}).get('medium_url'),
                    "observations": item.get('count')
                })
            return results
    except Exception as e:
        print(f"Error fetching {iconic_taxa}: {e}")
        return []

print("Fetching data from iNaturalist API for South Texas...")

birds = fetch_species("Aves", 20)
plants = fetch_species("Plantae", 25)
insects = fetch_species("Insecta", 25)

data = {
    "birds": birds,
    "plants": plants,
    "insects": insects
}

output_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'mock_biodiversity.json')
with open(output_path, 'w') as f:
    json.dump(data, f, indent=2)

print(f"Successfully extracted {len(birds)} birds, {len(plants)} plants, and {len(insects)} insects from iNaturalist.")
