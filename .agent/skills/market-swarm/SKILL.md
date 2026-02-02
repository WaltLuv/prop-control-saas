---
name: market-swarm
description: Find off-market leads and save comps to local JSON.
---

# Market Swarm Skill

This skill triggers the Kimi CLI to perform a "swarm" search for off-market properties.

## Instructions

1.  **Trigger Kimi Swarm**:
    Use the `run_command` tool to execute:
    ```bash
    kimi swarm --city "[City Name]" --count 50 --output ./data/intel.json
    ```

2.  **Skip Trace**:
    For each property in `intel.json`, perform a simulated skip-trace (placeholder logic for now) to enrich data.

3.  **Calculate Mortgage Balance**:
    Use python script `scripts/estimate_mortgage.py` (you must create this if missing) to estimate balance based on last sale date + standard amortization.

4.  **Save Results**:
    Update `./data/intel.json` with enriched fields: `estimated_mortgage_balance`, `owner_contact_status`.
