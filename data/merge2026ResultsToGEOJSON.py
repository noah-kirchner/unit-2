import json
import csv
import re

# First, let's see what the actual column names are
with open('2026_unofficial_margins_AP.csv', 'r', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    print("Column names found in CSV:")
    print(reader.fieldnames)
    print("\nFirst few rows:")
    for i, row in enumerate(reader):
        if i < 3:
            print(row)
        else:
            break

# Load existing GeoJSON
with open('scowis_margins.geojson', 'r') as f:
    geojson_data = json.load(f)

# Read 2026 data from CSV
results_2026 = {}

with open('2026_unofficial_margins_AP.csv', 'r', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    
    # Get the actual column name (might have spaces or BOM)
    county_col = reader.fieldnames[0]  # First column
    leader_col = reader.fieldnames[1]  # Second column (Leader)
    
    print(f"\nUsing column names: '{county_col}' and '{leader_col}'")
    
    for row in reader:
        county = row[county_col].strip()
        leader_info = row[leader_col].strip()
        
        # Parse "Taylor +26.3" or "Lazar +2.9"
        match = re.match(r'([A-Za-z]+)\s*\+?([-\d.]+)', leader_info)
        
        if match:
            candidate = match.group(1)
            margin_value = float(match.group(2))
            
            # Taylor = Liberal (positive), Lazar = Conservative (negative)
            if candidate == 'Taylor':
                margin = margin_value
            elif candidate == 'Lazar':
                margin = -margin_value
            else:
                print(f"WARNING: Unknown candidate '{candidate}' for {county}")
                margin = 0
            
            results_2026[county] = round(margin, 2)
            print(f"{county}: {candidate} +{margin_value} → Margin: {margin}")
        else:
            print(f"WARNING: Could not parse leader info for {county}: {leader_info}")

# Add 2026 margin to each county in GeoJSON
counties_updated = 0
counties_missing = []

for feature in geojson_data['features']:
    county_name = feature['properties']['County']
    
    if county_name in results_2026:
        feature['properties']['Margin_2026'] = results_2026[county_name]
        counties_updated += 1
    else:
        print(f"WARNING: No 2026 data found for {county_name}")
        counties_missing.append(county_name)
        feature['properties']['Margin_2026'] = None

# Save updated GeoJSON
with open('scowis_margins_updated.geojson', 'w') as f:
    json.dump(geojson_data, f, indent=2)

print(f"\n=== Summary ===")
print(f"Counties updated: {counties_updated}")
print(f"Counties missing: {len(counties_missing)}")
if counties_missing:
    print(f"Missing counties: {', '.join(counties_missing)}")
print(f"\nUpdated GeoJSON saved to 'scowis_margins_updated.geojson'")