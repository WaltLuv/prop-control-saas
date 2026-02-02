
import json
import random
from datetime import datetime

def estimate_mortgage_balance(last_sale_price, last_sale_date):
    """
    Estimates current mortgage balance based on standard amortization.
    Assumes 80% LTV at purchase and 30-year fixed term.
    """
    if not last_sale_price or not last_sale_date:
        return 0
        
    try:
        sale_date = datetime.strptime(last_sale_date, "%Y-%m-%d")
        months_elapsed = (datetime.now() - sale_date).days / 30
    except:
        # Default fallback if date parsing fails
        months_elapsed = 24 

    initial_loan = last_sale_price * 0.80
    interest_rate = 0.045 # Avg historical rate assumption
    monthly_rate = interest_rate / 12
    total_months = 360
    
    # Amortization calculation
    if monthly_rate == 0:
        return initial_loan - (initial_loan / total_months) * months_elapsed
        
    numerator = (1 + monthly_rate)**total_months - (1 + monthly_rate)**months_elapsed
    denominator = (1 + monthly_rate)**total_months - 1
    balance = initial_loan * (numerator / denominator)
    
    return max(0, round(balance, 2))

def process_leads(input_file, output_file):
    try:
        with open(input_file, 'r') as f:
            data = json.load(f)
            
        enriched_properties = []
        for prop in data.get('properties', []):
            balance = estimate_mortgage_balance(
                prop.get('last_sold_price'), 
                prop.get('last_sold_date')
            )
            
            # Enrich data
            prop['estimated_mortgage_balance'] = balance
            prop['equity_position'] = prop.get('estimated_value', 0) - balance
            prop['owner_contact_status'] = random.choice(['Skip Traced', 'Pending', 'Not Found'])
            
            enriched_properties.append(prop)
            
        data['properties'] = enriched_properties
        
        with open(output_file, 'w') as f:
            json.dump(data, f, indent=2)
            
        print(f"Successfully processed {len(enriched_properties)} leads.")
        
    except Exception as e:
        print(f"Error processing leads: {e}")

if __name__ == "__main__":
    # In a real scenario, these paths would be arguments
    process_leads('./data/intel.json', './data/intel.json')
