# Skill: Real Estate Acquisition Swarm
**Orchestrator:** Kimi 2.5 Agent Swarm (PARL-Enabled)

## Mission Statement
Automate the 'Treasure Hunt' for distressed properties by deploying up to 100 sub-agents to scan specific zip codes for Tax Liens, Pre-Foreclosures, and Probate leads.

## Execution Logic (PARL Swarm)
1. **Targeting:** Divide the user-provided Geo-Fence into 100 micro-grids.
2. **Deployment:** Spawn 100 parallel agents via Kimi 2.5.
3. **Tasking:** 
   - Each agent performs a 'Deep Research' on 5 unique properties.
   - Requirement: Cross-reference Tax Records with Equity calculations.
4. **Tool Access:**
   - `supabase_client`: To write data to the PropControl 'leads' table.
   - `Maps_static`: To pull Street View images for Vision analysis.
   - `openai_vision`: To score property condition (1-10).

## PARL Orchestration Rules
- **Latency-Awareness**: Prioritize agents on the fastest data sources.
- **Dynamic Re-allocation**: If a "Gold Mine" (High-Equity Probate) is found, divert 5 sub-agents to perform deeper title search.
- **No Redundancy**: Ensure no two agents research the same address.

## Termination Criteria
- Stop once the daily budget cap ($5.00) is reached.
- Stop once 50 'High Equity' leads are secured.

## Constraints
- Do not spend more than $0.15 per skip-trace.
- Ignore properties with a Condition Score > 8/10.
