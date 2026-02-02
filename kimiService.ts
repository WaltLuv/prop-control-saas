
import { fetchMarketIntel as fetchMarketIntelGemini, triggerAcquisitionSwarmGemini } from './geminiService';

/**
 * PropControl Intelligence Service (Consolidated on Gemini)
 */

export async function fetchMarketIntel(location: string) {
  // Use the Gemini search/neighborhood tool
  return fetchMarketIntelGemini(location);
}

export async function triggerMarketSwarm(address: string, rawResearchData: string) {
  // This originally synthesized research. We'll use a Gemini prompt for this.
  return triggerAcquisitionSwarmGemini(address, { synthesized: true, research: rawResearchData });
}

export async function triggerAcquisitionSwarm(location: string, settings: any) {
  return triggerAcquisitionSwarmGemini(location, settings);
}
