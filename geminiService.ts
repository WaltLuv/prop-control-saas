import { GoogleGenAI, Type, FunctionDeclaration, Modality } from "@google/genai";

/**
 * Strict JSON extractor to handle conversational output from LLMs.
 */
const strictExtractJson = (str: string) => {
  try {
    const clean = str.replace(/```json/g, "").replace(/```/g, "").trim();
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      const jsonStr = clean.substring(start, end + 1);
      return JSON.parse(jsonStr);
    }
    return JSON.parse(clean);
  } catch (e) {
    console.error("Strict JSON parse error. Raw string:", str);
    throw new Error("Neural output fragmentation. Please retry.");
  }
};

/**
 * LOCAL COST DATABASE (Regional Averages 2026)
 * Mimics the skill resources for consistent "Blackstone-level" precision.
 */
const LOCAL_COST_DB = {
  "countertops": { "mid_range": 2500, "unit": "standard kitchen" },
  "backsplash": { "mid_range": 800, "unit": "standard kitchen" },
  "cabinet painting": { "mid_range": 1200, "unit": "set" },
  "lighting": { "mid_range": 450, "unit": "room" },
  "flooring-lvp": { "mid_range": 3500, "unit": "avg main floor" },
  "vanity-update": { "mid_range": 950, "unit": "per bath" },
  "full-repaint": { "mid_range": 4200, "unit": "2000sqft home" },
  "exterior-siding-patch": { "mid_range": 1500, "unit": "repair" },
  "landscaping-refresh": { "mid_range": 1200, "unit": "front yard" }
};

/**
 * Generates a Bank-Ready Loan Memo by synthesizing all portfolio data nodes.
 */
export const generateBankReadyMemo = async (property: string, data: { market?: any, financials?: any, rehab?: any, jv?: any }) => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `
    ACT AS: Senior Commercial Loan Officer & Institutional Underwriter.
    TASK: Generate a professional 2-page "Bank-Ready Loan Pitch" for property: ${property}.
    
    DATA CONTEXT NODES:
    - MARKET INTELLIGENCE: ${JSON.stringify(data.market || "Awaiting data")}
    - FINANCIAL STRESS TESTS: ${JSON.stringify(data.financials || "Awaiting data")}
    - REHAB SCOPE OF WORK: ${JSON.stringify(data.rehab || "Awaiting data")}
    - JV CAPITAL STACK: ${JSON.stringify(data.jv || "Awaiting data")}

    REQUIREMENTS:
    1. CALCULATE DSCR: Expressly show the Debt Service Coverage Ratio formula and result ($NOI / Annual Debt Service$).
    2. INVESTMENT THESIS: Professional narrative on why this asset in this sub-market represents a low-risk, high-upside opportunity.
    3. REHAB ROI: Explain how the $${data.rehab?.grandTotal || 0} renovation budget creates a 15% ARV lift.
    4. RISK MITIGATION: Reference the "Shock Tests" (Recession & Repair Shock) to prove the asset's durability to the lender.
    5. COMMUNITY IMPACT: Mention neighborhood stabilization and quality housing provision.

    TONE: Objective, institutional, data-heavy, and high-integrity.
    FORMAT: Professional headers, bulleted financial metrics, and executive summary.
    `,
    config: {
      thinkingConfig: { thinkingBudget: 4096 }
    }
  });

  return response.text;
};

/**
 * Generates a tactical execution strategy for post-loan approval.
 */
export const generateExecutiveLoanStrategy = async (memo: string) => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `
    ACT AS: Private Equity Operations Director.
    TASK: Generate a "Post-Funding Executive Strategy" based on the following Loan Memo: ${memo}.
    
    REQUIRED SECTIONS:
    I. 100-DAY TRANSITION PLAN: Specific operational steps from Day 1 of funding.
    II. CAPEX PRIORITIZATION: Sequencing the rehab items for maximum immediate impact.
    III. LEASING & REVENUE TARGETS: Milestones to hit the projected ROI.
    IV. OPERATIONAL RISK MITIGATION: Monitoring plan for the identified shock risks.

    TONE: High-conviction, tactical, and authoritative.
    FORMAT: Use bold headers and clear, numbered tactical directives.
    `,
    config: {
      thinkingConfig: { thinkingBudget: 2048 }
    }
  });
  return response.text;
};

/**
 * Performs a multimodal visual rehab audit on property photos.
 */
export const runRehabAudit = async (mediaFiles: { data: string; mimeType: string }[], city: string) => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
  const parts = mediaFiles.map(file => ({ inlineData: { data: file.data, mimeType: file.mimeType } }));

  const systemPrompt = `
    ACT AS: Senior Construction Estimator & Rehab Analyst.
    CITY CONTEXT: ${city}
    COST DATABASE (Reference Only): ${JSON.stringify(LOCAL_COST_DB)}
    
    TRIGGER PHRASE PROTOCOL: "Analyze these photos and provide a mid-range renovation estimate based on local labor rates."
    
    INSTRUCTIONS:
    1. VISUAL REASONING: Identify outdated fixtures (e.g., fluorescent lighting, laminate counters) and structural wear (e.g., floor damage, ceiling stains).
    2. ROI CALCULATION: Assume current ARV increases by 15% after these specific upgrades.
    3. MATH AUDIT: Cross-reference findings with the provided Cost DB and apply a 1.1x multiplier if the city is high-cost (SF, NYC, Austin).
    
    OUTPUT: JSON ONLY with schema for 'items', 'roiAnalysis', and 'grandTotal'.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts: [...parts, { text: systemPrompt }] },
    config: {
      thinkingConfig: { thinkingBudget: 1024 },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING },
                finding: { type: Type.STRING },
                remedy: { type: Type.STRING },
                estimatedCost: { type: Type.NUMBER },
                roiImpact: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH'] }
              },
              required: ["category", "finding", "remedy", "estimatedCost", "roiImpact"]
            }
          },
          roiAnalysis: {
            type: Type.OBJECT,
            properties: {
              estimatedArvLift: { type: Type.NUMBER },
              netProfitLift: { type: Type.NUMBER },
              highestRoiAction: { type: Type.STRING }
            },
            required: ["estimatedArvLift", "netProfitLift", "highestRoiAction"]
          },
          grandTotal: { type: Type.NUMBER },
          executiveSummary: { type: Type.STRING }
        },
        required: ["items", "roiAnalysis", "grandTotal", "executiveSummary"]
      }
    }
  });

  return strictExtractJson(response.text);
};

/**
 * Calculates JV Waterfall 70/30 split and IRR using high-precision math simulation.
 */
export const calculateJVWaterfall = async (inputs: any) => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `
    ACT AS: Private Equity Quantitative Analyst.
    INPUTS: ${JSON.stringify(inputs)}

    TASK: Perform a year-by-year cash flow analysis for a Joint Venture (JV) deal.
    WATERFALL LOGIC:
    1. LP (Limited Partner) receives 100% of all cash flow until their initial capital is fully returned.
    2. Thereafter, all remaining cash flow and exit proceeds are split 70% to LP and 30% to GP (General Partner/Manager).
    
    CALCULATIONS:
    - Solve for IRR (Internal Rate of Return) for both LP and the Project overall using NPV equations.
    - Year 0: Negative outflow of initial capital.
    - Years 1-N: Annual cash flow inputs.
    - Year N (Exit): Annual Cash Flow + Exit Sale Proceeds.
    - Equity Multiple (EM): Total Cash Out / Total Cash In.

    OUTPUT: JSON only with annual breakdown and summary metrics.
    `,
    config: {
      thinkingConfig: { thinkingBudget: 2048 },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          projectIRR: { type: Type.NUMBER },
          lpIRR: { type: Type.NUMBER },
          lpEquityMultiple: { type: Type.NUMBER },
          gpProfitShare: { type: Type.NUMBER },
          annualBreakdown: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                year: { type: Type.NUMBER },
                cashFlow: { type: Type.NUMBER },
                lpShare: { type: Type.NUMBER },
                gpShare: { type: Type.NUMBER },
                unreturnedCapital: { type: Type.NUMBER }
              },
              required: ["year", "cashFlow", "lpShare", "gpShare", "unreturnedCapital"]
            }
          }
        },
        required: ["projectIRR", "lpIRR", "lpEquityMultiple", "gpProfitShare", "annualBreakdown"]
      }
    }
  });

  return strictExtractJson(response.text);
};

/**
 * Performs high-precision sensitivity analysis for the Shock Test Lab.
 */
export const runShockTestMath = async (baseData: any, multipliers: any) => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `
    ACT AS: Senior RE Underwriter & Data Scientist.
    INPUT DATA: ${JSON.stringify(baseData)}
    STRESS MULTIPLIERS: ${JSON.stringify(multipliers)}

    TASK: Run a code-execution style math audit to calculate 3 Scenarios: 'Base Case', 'Recession', and 'Maintenance Disaster'.

    EQUATIONS TO USE:
    - Net Operating Income (NOI) = (Monthly Rent * 12 * (1 - VacancyRate)) - (Annual Expenses)
    - Debt Service Coverage Ratio (DSCR) = NOI / (Monthly Mortgage * 12)
    - Last Dollar of Risk = The specific dollar amount of annual expense increase required to drop DSCR to 1.0.

    SCENARIO RULES:
    1. Base Case: Use user inputs directly.
    2. Recession: Apply the user's "Vacancy Spike" (added to base vacancy) and "Rent Drop" multiplier.
    3. Maintenance Disaster: Apply the user's "Repair Shock" $ value added to annual expenses.

    OUTPUT: JSON only with scenario details and the 'lastDollarOfRisk' value.
    `,
    config: {
      thinkingConfig: { thinkingBudget: 1024 },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          lastDollarOfRisk: { type: Type.NUMBER },
          scenarios: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                noi: { type: Type.NUMBER },
                dscr: { type: Type.NUMBER },
                description: { type: Type.STRING }
              },
              required: ["name", "noi", "dscr", "description"]
            }
          }
        },
        required: ["lastDollarOfRisk", "scenarios"]
      }
    }
  });

  return strictExtractJson(response.text);
};

/**
 * Synthesizes shock test results into a professional Investment Committee (IC) Memo.
 */
export const generateICMemo = async (property: string, results: any) => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `
    ACT AS: Investment Committee Chairman and Senior Hedge Fund Underwriter.
    TASK: Generate a professional, highly institutional Investment Committee (IC) Memo for property: ${property}.
    DATA CONTEXT (Shock Test Results): ${JSON.stringify(results)}

    STRUCTURE:
    I. EXECUTIVE SUMMARY: High-level Pass/Fail/Mitigate sentiment based on DSCR strength and asset durability.
    II. SENSITIVITY AUDIT: Analytical breakdown comparing Base Case against high-stress scenarios (Recession and Repair Shock).
    III. RISK TOLERANCE ANALYSIS: Explicitly discuss the "Last Dollar of Risk" metric ($${results.lastDollarOfRisk}). Explain exactly how much room the cash flow has before defaulting on debt service.
    IV. MITIGATION TACTICS: Provide 3 specific, actionable operational steps to protect the NOI during the stress scenarios identified.
    V. FINAL DIRECTIVE: Final IC vote recommendation with supporting logic.

    TONE: Institutional, precise, objective, and high-conviction.
    `,
    config: {
      thinkingConfig: { thinkingBudget: 4096 }
    }
  });

  return response.text;
};

export const researchNeighborhood = async (address: string) => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `CRITICAL RESEARCH TASK: Perform a deep dive market scan for: ${address}. 
    
    STEP 1: Identify the exact City, State, and Zip Code.
    STEP 2: Find EXACT property metadata for ${address}: Property Type, Square Footage, Year Built, Last Sale Price, and Date.
    STEP 3: Research at least 5 Sales Comps and 5 Rental Comps within a 1-2 mile radius. If inventory is low, expand to 2 miles max.
    STEP 4: Retrieve specific localized trends for that specific Zip Code:
       - 12-month average rent growth trajectory.
       - Current neighborhood occupancy rates.
       - Price per Square Foot trends for the neighborhood.
    
    For all comps, you MUST extract: Address, Distance, Price/Rent, Beds, Baths, and SqFt. List all findings clearly.`,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const urls = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => chunk.web?.uri).filter(Boolean) || [];

  return {
    rawResearch: response.text,
    sources: urls
  };
};

export const navigationTool: FunctionDeclaration = {
  name: 'navigateTo',
  parameters: {
    type: Type.OBJECT,
    properties: { tab: { type: Type.STRING } },
    required: ['tab']
  }
};

export const manageAssetTool: FunctionDeclaration = {
  name: 'manageAsset',
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: { type: Type.STRING, enum: ['CREATE', 'UPDATE', 'DELETE'] },
      id: { type: Type.STRING },
      data: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          address: { type: Type.STRING },
          units: { type: Type.NUMBER },
          manager: { type: Type.STRING }
        }
      }
    },
    required: ['action']
  }
};

export const manageResidentTool: FunctionDeclaration = {
  name: 'manageResident',
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: { type: Type.STRING, enum: ['CREATE', 'UPDATE', 'DELETE'] },
      id: { type: Type.STRING },
      data: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          email: { type: Type.STRING },
          phone: { type: Type.STRING },
          propertyId: { type: Type.STRING }
        }
      }
    },
    required: ['action']
  }
};

export const manageWorkOrderTool: FunctionDeclaration = {
  name: 'manageWorkOrder',
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: { type: Type.STRING, enum: ['CREATE', 'UPDATE', 'DELETE'] },
      id: { type: Type.STRING },
      data: {
        type: Type.OBJECT,
        properties: {
          propertyId: { type: Type.STRING },
          tenantId: { type: Type.STRING },
          issueType: { type: Type.STRING },
          description: { type: Type.STRING },
          status: { type: Type.STRING }
        }
      }
    },
    required: ['action']
  }
};

export const logPerformanceTool: FunctionDeclaration = {
  name: 'logPerformance',
  parameters: {
    type: Type.OBJECT,
    properties: {
      assetId: { type: Type.STRING },
      kpiName: { type: Type.STRING },
      value: { type: Type.NUMBER },
      date: { type: Type.STRING },
      commentary: { type: Type.STRING }
    },
    required: ['assetId', 'kpiName', 'value', 'date']
  }
};

export const initiateCallTool: FunctionDeclaration = {
  name: 'initiateCall',
  parameters: {
    type: Type.OBJECT,
    properties: {
      jobId: { type: Type.STRING },
      type: { type: Type.STRING, enum: ['DISPATCH', 'NOTIFY'] }
    },
    required: ['jobId', 'type']
  }
};

const verifyTenantIdentityTool: FunctionDeclaration = {
  name: 'verifyTenantIdentity',
  parameters: {
    type: Type.OBJECT,
    properties: { name: { type: Type.STRING } },
    required: ['name']
  }
};

const getAvailablePropertiesTool: FunctionDeclaration = {
  name: 'getAvailableProperties',
  parameters: { type: Type.OBJECT, properties: {} }
};

const registerNewTenantTool: FunctionDeclaration = {
  name: 'registerNewTenant',
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING },
      email: { type: Type.STRING },
      phone: { type: Type.STRING },
      propertyId: { type: Type.STRING }
    },
    required: ['name', 'email', 'phone', 'propertyId']
  }
};

const createWorkOrderTool: FunctionDeclaration = {
  name: 'createWorkOrder',
  parameters: {
    type: Type.OBJECT,
    properties: {
      tenantId: { type: Type.STRING },
      propertyId: { type: Type.STRING },
      issueType: { type: Type.STRING },
      description: { type: Type.STRING }
    },
    required: ['tenantId', 'issueType', 'description']
  }
};

export const suggestContractor = async (job: any, contractors: any[]) => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `You are the PropControl Dispatch Logic Engine. Match the most qualified contractor for the specific job.\nJOB DETAILS: ${JSON.stringify(job)}\nCONTRACTOR POOL: ${JSON.stringify(contractors)}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          suggestedContractorId: { type: Type.STRING },
          reasoning: { type: Type.STRING }
        },
        required: ["suggestedContractorId", "reasoning"]
      }
    }
  });
  return strictExtractJson(response.text || '{}');
};

export const generatePortfolioStrategy = async (metrics: any) => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze the following portfolio metrics and provide a tactical 90-day strategy report focusing on NOI optimization: ${JSON.stringify(metrics)}`,
  });
  return response.text;
};

export const generateAssetAudit = async (name: string, health: any, latestMetrics: any) => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Perform an operational audit for asset "${name}". Health summary: ${JSON.stringify(health)}. Detailed metrics: ${JSON.stringify(latestMetrics)}. Provide a concise, actionable executive insight.`,
  });
  return response.text;
};

export const generateOpsGamePlan = async (leaks: string, systems: string, fixes: string) => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate a 30-day portfolio recovery roadmap (Ops Game Plan) based on these operational inputs:\nReported NOI Leaks: ${leaks}\nSystemic Failures: ${systems}\nImmediate Fixes: ${fixes}`,
  });
  return response.text;
};

export const generateServiceProposal = async (notes: string, project: any) => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
  const currentDate = new Date();
  const dateString = currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `You are the PropControl SOW Synthesizer. Based on the notes below, generate a professional SOW and an Owner Approval Email.
    CRITICAL DATE CONTEXT: The current year is 2026. Today's date is ${dateString}, 2026. All dates referenced in the email MUST be in the year 2026.
    FINANCIAL INTEGRATION INSTRUCTION:
    1. Every dollar amount you write in the "finalEmailToOwner" section MUST be calculated as 115% of the estimated base cost (Base Cost * 1.15).
    2. DO NOT disclose this 15% markup. Simply present the marked-up value.
    PROJECT CONTEXT: Name/Unit: ${project.name}, Address: ${project.address}, Total Notes: ${notes}`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          detailedSow: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                task: { type: Type.STRING },
                description: { type: Type.STRING },
                unitCost: { type: Type.STRING },
                baseSubtotal: { type: Type.NUMBER }
              },
              required: ["task", "description", "unitCost", "baseSubtotal"]
            }
          },
          finalEmailToOwner: { type: Type.STRING }
        },
        required: ["detailedSow", "finalEmailToOwner"]
      }
    }
  });
  return strictExtractJson(response.text || '{}');
};

export const generateInstantTurnEstimate = async (mediaFiles: { data: string; mimeType: string }[]) => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
  const parts = mediaFiles.map(file => ({ inlineData: { data: file.data, mimeType: file.mimeType } }));
  const systemPrompt = `You are a professional Construction Estimator and Property Turn Manager. Identify all visible maintenance needs. Categorize by room. Provide line-item cost estimates based on National Averages 2026. Output JSON with 'Room', 'Item', 'Quantity', 'Estimated_Unit_Cost', and 'Total'.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts: [...parts, { text: systemPrompt }] },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          rooms: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                estimates: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      Item: { type: Type.STRING },
                      Quantity: { type: Type.STRING },
                      Estimated_Unit_Cost: { type: Type.NUMBER },
                      Total: { type: Type.NUMBER }
                    },
                    required: ["Item", "Quantity", "Estimated_Unit_Cost", "Total"]
                  }
                }
              },
              required: ["name", "estimates"]
            }
          },
          executiveSummary: { type: Type.STRING },
          grandTotal: { type: Type.NUMBER }
        },
        required: ["rooms", "grandTotal"]
      }
    }
  });
  return strictExtractJson(response.text || '{}');
};

export const classifyTenantMessage = async (text: string) => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Classify this resident message: "${text}". Extract category, priority, and summary.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING },
          priority: { type: Type.STRING },
          summary: { type: Type.STRING }
        },
        required: ["category", "priority", "summary"]
      }
    }
  });
  return strictExtractJson(response.text || '{}');
};

export const startAgentChat = () => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: "You are the PropControl Concierge.",
      tools: [{ functionDeclarations: [verifyTenantIdentityTool, getAvailablePropertiesTool, registerNewTenantTool, createWorkOrderTool] }]
    }
  });
};

export const connectToLiveDispatcher = (callbacks: any, job: any, vendor: any, asset: any) => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
  return ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-12-2025',
    callbacks,
    config: {
      responseModalities: [Modality.AUDIO],
      systemInstruction: `You are the PropControl Dispatcher. Call ${vendor.name} to assign a ${job.issueType} work order at ${asset.name}.`,
      inputAudioTranscription: {},
      outputAudioTranscription: {}
    }
  });
};

export const connectToResidentNotifier = (callbacks: any, job: any, tenant: any, asset: any, vendor?: any) => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
  return ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-12-2025',
    callbacks,
    config: {
      responseModalities: [Modality.AUDIO],
      systemInstruction: `You are Alex AI, the resident concierge. Inform ${tenant.name} about work order #${job.id} at ${asset.name}.`,
      inputAudioTranscription: {},
      outputAudioTranscription: {}
    }
  });
};

export const predictMaintenance = async (name: string, jobs: any[], kpis: any[]) => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `
    ACT AS: Senior Asset Performance & Predictive Analytics Engine.
    ASSET: "${name}"
    HISTORICAL WORK ORDERS: ${JSON.stringify(jobs)}
    RECENT KPI DATA: ${JSON.stringify(kpis)}

    TASK: Perform a high-fidelity correlation analysis between financial KPI drift (rising turn costs, occupancy soft spots) and historical repair trends.
    PREDICT: Based on asset age and repair frequency, identify major capital items (Roof, HVAC, Water Mains) at risk of failure in the next 12-18 months.
    OUTPUT: JSON only conforming to the response schema.
    `,
    config: {
      thinkingConfig: { thinkingBudget: 2048 },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          riskLevel: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
          riskScore: { type: Type.NUMBER },
          predictedIssues: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                system: { type: Type.STRING },
                probability: { type: Type.NUMBER },
                timeframe: { type: Type.STRING },
                description: { type: Type.STRING },
                estimatedCost: { type: Type.NUMBER }
              },
              required: ["system", "probability", "timeframe", "description", "estimatedCost"]
            }
          },
          executiveSummary: { type: Type.STRING },
          suggestedPMPlan: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["riskLevel", "riskScore", "predictedIssues", "executiveSummary", "suggestedPMPlan"]
      }
    }
  });
  return strictExtractJson(response.text || '{}');
};

export async function generateInteriorDesign(images: { data: string; mimeType: string }[], prompt: string) {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
  try {
    const imageParts = images.map((img) => ({ inlineData: { data: img.data, mimeType: img.mimeType } }));
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: { parts: [...imageParts, { text: prompt }] },
      config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });
    const parts = response?.candidates?.[0]?.content?.parts || [];
    let newImage = null;
    let responseText = undefined;
    for (const part of parts) {
      if (part?.inlineData) newImage = { data: part.inlineData.data, mimeType: part.inlineData.mimeType || "image/png" };
      else if (part?.text) responseText = part.text;
    }
    if (!newImage) throw new Error("Edit failed.");
    return { newImage, responseText };
  } catch (err) {
    throw new Error("We couldn’t edit the image.");
  }
}