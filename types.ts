
export enum KPIStatus {
  GREEN = 'GREEN',
  YELLOW = 'YELLOW',
  RED = 'RED'
}

export enum Direction {
  IMPROVING = 'IMPROVING',
  STABLE = 'STABLE',
  WATCH = 'WATCH'
}

export enum JobStatus {
  REPORTED = 'REPORTED',
  AI_CLASSIFIED = 'AI_CLASSIFIED',
  CONTRACTOR_ASSIGNED = 'CONTRACTOR_ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export type KPIName = 'Rent Collected %' | 'Turn Days' | 'Turn Cost' | 'Maintenance Backlog' | 'Expense Trend' | 'Occupancy Level';

export type AppTab =
  | 'dashboard'
  | 'assets'
  | 'tenants'
  | 'inbox'
  | 'work-orders'
  | 'contractors'
  | 'kpis'
  | 'calculator'
  | 'checklist'
  | 'vendors'
  | 'audit'
  | 'estimator'
  | 'instant-calculator'
  | 'tenant-agent'
  | 'predictor'
  | 'interior-design'
  | 'market-intel'
  | 'jv-payout'
  | 'underwriting'
  | 'rehab-studio'
  | 'loan-pitch'
  | 'inst-dashboard'
  | 'settings';

export interface CommunicationEntry {
  id: string;
  timestamp: string;
  sender: 'System' | 'AI Agent' | 'Tenant' | 'Contractor' | 'Manager';
  message: string;
  type: 'status_change' | 'chat' | 'notification' | 'note';
}

export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  propertyId: string;
  leaseEnd: string;
}

export interface Contractor {
  id: string;
  name: string;
  specialty: string[];
  email: string;
  phone: string;
  rating: number;
  status: 'AVAILABLE' | 'BUSY' | 'OFFBOARDED';
}

export interface Job {
  id: string;
  propertyId: string;
  tenantId: string;
  issueType: string;
  description: string;
  status: JobStatus;
  contractorId?: string;
  costEstimate?: number;
  finalCost?: number;
  createdAt: string;
  updatedAt: string;
  communicationLog: CommunicationEntry[];
}

export interface Message {
  id: string;
  sender: 'tenant' | 'agent';
  content: string;
  timestamp: string;
}

export interface Benchmark {
  id: string;
  name: KPIName;
  yellowThreshold: number;
  greenThreshold: number;
  higherIsBetter: boolean;
  unit: 'percentage' | 'days' | 'currency' | 'count';
}

export interface Asset {
  id: string;
  name: string;
  address: string;
  units: number;
  manager: string;
  lastUpdated: string;
}

export interface KPIEntry {
  id: string;
  assetId: string;
  kpiName: KPIName;
  value: number;
  date: string;
  commentary?: string;
}

export interface AssetHealth {
  assetId: string;
  healthScore: number;
  redCount: number;
  yellowCount: number;
  statusBand: KPIStatus;
  direction: Direction;
}

export interface PredictedIssue {
  system: string;
  probability: number;
  timeframe: string;
  description: string;
  estimatedCost: number;
}

export interface MaintenancePrediction {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskScore: number;
  predictedIssues: PredictedIssue[];
  executiveSummary: string;
  suggestedPMPlan: string[];
}

export type PlanTier = 'FREE' | 'PRO' | 'GROWTH' | 'PRO_MAX';

export interface UserProfile {
  id: string; // matches auth.users.id
  email: string;
  plan: PlanTier;
  stripeCustomerId?: string;
  subscriptionStatus?: 'active' | 'past_due' | 'canceled' | 'trialing';
}

// --- Investment Ideas Types ---

export enum DistressType {
  TAX_LIEN = 'Tax Lien',
  PRE_FORECLOSURE = 'Pre-Foreclosure',
  PROBATE = 'Probate',
  VACANT = 'Vacant',
  NONE = 'None'
}

export enum KimiSwarmStatus {
  QUEUED = 'Queued',
  DEPLOYING = 'Deploying',
  RESEARCHING = 'Researching',
  ANALYZING = 'Analyzing',
  SYNTHESIZING = 'Synthesizing',
  COMPLETED = 'Completed',
  CONTACTED = 'Contacted'
}

export interface InvestmentLead {
  id: string; // Internal lead_id
  assetId: string;
  propertyAddress: string;
  propertyName?: string;
  distressIndicator: DistressType;
  recordedDate: string;
  marketValue: number;
  totalLiabilities: number;
  equityPct: number;
  equityLevel: 'Low' | 'Medium' | 'High';
  swarmStatus: KimiSwarmStatus;
  ownerPhone?: string;
  ownerEmail?: string;
  relativesContact?: string;
  visionAnalysis?: {
    roof: number;
    windows: number;
    lawn: number;
    summary?: string;
  };
  conditionScore?: number;
  investorAlpha?: string;
  image?: string;
  lat?: number;
  lng?: number;
  // SWARM RESEARCH RESULTS
  arv?: number;  // After Repair Value
  renovationIdeas?: string[];
  swarmResearchNotes?: string;
  estimatedRehabCost?: number;
}


export interface DistressDetail {
  id: string;
  leadId: string;
  lienAmount: number;
  legalDescription: string;
  auctionDate?: string;
}

