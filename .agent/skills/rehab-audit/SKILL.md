---
name: rehab-audit
description: Visual analysis of photos and cost estimation.
---

# Rehab Audit Skill

This skill uses visual analysis to audit property photos and estimate rehab costs.

## Instructions

1.  **Visual Analysis**:
    When given a photo URL or path, use the multi-modal capabilities to describe the condition of the room/property.
    *   Identify damage (holes, water damage, outdated fixtures).
    *   Grade condition (Poor, Fair, Good, Excellent).

2.  **Cost Cross-Ref**:
    Load local cost database: `./data/local_costs.json`.
    *   Map identified issues to line items (e.g., "Replace Vanity" -> $450).
    *   Apply a "Zip Code Multiplier" if available.

3.  **Output**:
    Generate a `rehab_estimate.json` artifact for the property.
