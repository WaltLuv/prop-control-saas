
/**
 * PropControl Kimi AI Service
 * Specialized for high-fidelity market intelligence and demographic analysis.
 */

const KIMI_API_KEY = "sk-VM4hNg3BVNXonfazsfw6HqCgeY2bNKxeYMC8LggUkepCRn7Y";
const KIMI_BASE_URL = "https://api.moonshot.ai/v1";

/**
 * Robust JSON extractor for Kimi responses which may include Markdown wrapping.
 */
const extractKimiJson = (str: string) => {
  try {
    // Remove Markdown code block markers
    const clean = str.replace(/```json/g, "").replace(/```/g, "").trim();
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      const jsonStr = clean.substring(start, end + 1);
      return JSON.parse(jsonStr);
    }
    return JSON.parse(clean);
  } catch (e) {
    console.error("Kimi JSON Extraction Error. Raw content:", str);
    throw new Error("Market Intelligence synthesis failed due to malformed neural output. Please retry the swarm.");
  }
};

/**
 * Triggers an Agent Swarm analysis to synthesize market research into an underwriting fact box.
 */
export async function triggerMarketSwarm(address: string, rawResearchData: string) {
  try {
    const response = await fetch(`${KIMI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KIMI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'kimi-k2.5',
        messages: [
          {
            role: 'system',
            content: `You are the PropControl Swarm Orchestrator. 
            
            COMMAND STRATEGY: Decompose this market analysis into parallel sub-tasks. 
            GEOGRAPHIC INTEGRITY: Ensure City/State/Zip in the Fact Box exactly matches the input research.
            
            OBJECTIVE: Synthesize data into a professional PROPERTY UNDERWRITING ANALYSIS.
            
            DATA INTEGRITY RULE: NEVER return "N/A" for any field. If exact data is missing, orchestrate a sub-agent to perform a high-conviction expert estimation based on nearby sub-market listings.
            
            REQUIRED JSON STRUCTURE:
            {
              "property": {
                "Address": string,
                "Location": string,
                "Type": string,
                "Square Feet": string,
                "Year Built": string,
                "Last Sold": string,
                "Price/SqFt": string
              },
              "neighborhood": {
                "Avg Rent": string,
                "12m growth": string (Numerical percentage, e.g. "5.4%"),
                "occupancy": string,
                "rentHistory": [{"month": "Jan", "rent": number}, {"month": "Feb", "rent": number}, ...]
              },
              "comps": {
                "sales": Array of 5 actual matched objects with (Address, Price, Beds, Baths, SqFt, Distance),
                "rentals": Array of 5 actual matched objects with (Address, Rent, Beds, Baths, SqFt, Distance)
              },
              "riskAlerts": Array of objects (category, label, status [GREEN/YELLOW/RED], description)
            }
            
            OUTPUT FORMAT: JSON ONLY.`
          },
          {
            role: 'user',
            content: `Synthesize this localized research data for ${address} into the Fact Box: ${rawResearchData}`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 1
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Kimi API connection failed');
    
    const content = data.choices[0].message.content;
    return typeof content === 'string' ? extractKimiJson(content) : content;
  } catch (error: any) {
    console.error("Kimi Swarm Error:", error);
    throw new Error(`Kimi Neural Swarm Error: ${error.message}`);
  }
}

/**
 * Legacy support for standard market intel calls.
 */
export async function fetchMarketIntel(location: string) {
  try {
    const response = await fetch(`${KIMI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KIMI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'moonshot-v1-8k',
        messages: [
          {
            role: 'system',
            content: 'You are the PropControl Investment Analyst, powered by Kimi AI. Provide a deep-dive market intelligence report.'
          },
          {
            role: 'user',
            content: `Perform a neural market scan for: ${location}`
          }
        ],
        temperature: 0.3
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Kimi API connection failed');
    return data.choices[0].message.content;
  } catch (error: any) {
    console.error("Kimi Service Error:", error);
    throw new Error(`Kimi Neural Link Error: ${error.message}`);
  }
}
