import csv

# Hardcoded mapping: country name (lowercase) -> region
COUNTRY_REGION_MAP = {
    'united states': 'North America',
    'canada': 'North America',
    'mexico': 'North America',
    'germany': 'West Europe',
    'france': 'West Europe',
    'united kingdom': 'West Europe',
    'italy': 'West Europe',
    'spain': 'West Europe',
    'netherlands': 'West Europe',
    'belgium': 'West Europe',
    'switzerland': 'West Europe',
    'austria': 'West Europe',
    'sweden': 'North Europe',
    'norway': 'North Europe',
    'denmark': 'North Europe',
    'finland': 'North Europe',
    'russia': 'East Europe',
    'china': 'East Asia',
    'japan': 'East Asia',
    'south korea': 'East Asia',
    'india': 'South Asia',
    'brazil': 'South America',
    'argentina': 'South America',
    'chile': 'South America',
    'australia': 'Oceania',
    'new zealand': 'Oceania',
    # Add more mappings as needed
}

def populate_regions(input_csv, output_csv):
    with open(input_csv, newline='', encoding='utf-8') as infile, \
         open(output_csv, 'w', newline='', encoding='utf-8') as outfile:
        reader = csv.DictReader(infile)
        fieldnames = reader.fieldnames
        writer = csv.DictWriter(outfile, fieldnames=fieldnames)
        writer.writeheader()
        for row in reader:
            country = row['Country'].strip().lower()
            region = COUNTRY_REGION_MAP.get(country, '')
            row['Region'] = region
            writer.writerow(row)

if __name__ == '__main__':
    populate_regions('country-code-to-currency-code-mapping-with-region.csv',
                    'country-code-to-currency-code-mapping-with-region.csv')
