---
name: pitch-generator
description: Generate Bank-Ready Loan Pitch PDF.
---

# Pitch Generator Skill

This skill compiles data from various modules to create a professional DSCR loan pitch.

## Instructions

1.  **Data Gathering**:
    *   **Market Intel**: Load `./data/intel.json` (Comps, Mortgage).
    *   **Rehab**: Load `./data/rehab_estimate.json` (Reno Budget).
    *   **Underwriting**: Load `./data/underwriting_ledger.json` (NOI, Cap Rate).

2.  **DSCR Calculation**:
    $$ \text{DSCR} = \frac{\text{Net Operating Income}}{\text{Total Debt Service}} $$
    *   Ensure DSCR > 1.25 for "Bank Ready" status.

3.  **PDF Generation**:
    *   Use a tool or script to generate a 2-page PDF.
    *   **Page 1**: Executive Summary, Property Photo, Key Metrics (DSCR, LTV, ARV).
    *   **Page 2**: Detailed Financials (Income/Expense Statement), Renovations List.

4.  **Artifact**:
    Save to `artifacts/loan_pitch_[address].pdf`.
