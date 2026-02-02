
import json
import random
import time
from datetime import datetime, timedelta

def generate_address():
    streets = ["Beacon", "High", "Broad", "Main", "Oak", "Pine", "Maple", "Cedar", "Elm", "Washington"]
    suffixes = ["St", "Ave", "Blvd", "Ln", "Rd", "Ct"]
    number = random.randint(100, 9999)
    street = random.choice(streets)
    suffix = random.choice(suffixes)
    return f"{number} {street} {suffix}"

def generate_mock_data(city="Columbus, OH", count=50):
    print(f"Initializing Swarm Intelligence for {city}...")
    properties = []
    
    for _ in range(count):
        price = random.randint(150000, 550000)
        sqft = random.randint(1200, 3500)
        beds = random.randint(2, 5)
        baths = random.randint(1, 4)
        rent = int(sqft * random.uniform(0.9, 1.4))
        
        last_sold_date = (datetime.now() - timedelta(days=random.randint(300, 5000))).strftime("%Y-%m-%d")
        
        prop = {
            "address": f"{generate_address()}, {city}",
            "price": price,
            "sqft": sqft,
            "beds": beds,
            "baths": baths,
            "estimated_rent": rent,
            "last_sold_price": int(price * random.uniform(0.6, 0.9)),
            "last_sold_date": last_sold_date,
            "off_market_status": random.choice(["Pre-Foreclosure", "Absentee Owner", "High Equity", "Probate"]),
            "confidence_score": round(random.uniform(0.7, 0.99), 2)
        }
        properties.append(prop)
        
    data = {
        "meta": {
            "city": city,
            "timestamp": datetime.now().isoformat(),
            "source": "Kimi Neural Swarm (Simulated)",
            "node_count": count
        },
        "properties": properties
    }
    
    with open('./data/intel.json', 'w') as f:
        json.dump(data, f, indent=2)
        
    print(f"Swarm complete. {count} high-conviction leads identified.")

if __name__ == "__main__":
    generate_mock_data()
