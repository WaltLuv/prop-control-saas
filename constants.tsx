
import { Benchmark, Asset, KPIEntry, Tenant, Contractor, Job, JobStatus } from './types';

export const BENCHMARKS: Benchmark[] = [
  { id: '1', name: 'Rent Collected %', yellowThreshold: 0.90, greenThreshold: 0.95, higherIsBetter: true, unit: 'percentage' },
  { id: '2', name: 'Turn Days', yellowThreshold: 14, greenThreshold: 7, higherIsBetter: false, unit: 'days' },
  { id: '3', name: 'Turn Cost', yellowThreshold: 3500, greenThreshold: 2000, higherIsBetter: false, unit: 'currency' },
  { id: '4', name: 'Maintenance Backlog', yellowThreshold: 10, greenThreshold: 5, higherIsBetter: false, unit: 'count' },
  { id: '5', name: 'Expense Trend', yellowThreshold: 1.05, greenThreshold: 0.98, higherIsBetter: false, unit: 'percentage' },
  { id: '6', name: 'Occupancy Level', yellowThreshold: 0.90, greenThreshold: 0.95, higherIsBetter: true, unit: 'percentage' }
];

export const INITIAL_ASSETS: Asset[] = [
  { id: 'a1', name: 'Riverside Apartments', address: '123 River Rd', city: 'Austin', state: 'TX', zip: '78701', units: 150, manager: 'Sarah Johnson', lastUpdated: '2023-11-20', status: 'STABILIZED', propertyType: 'MULTIFAMILY' },
  { id: 'a2', name: 'Oakwood Heights', address: '456 Hill Ln', city: 'Dallas', state: 'TX', zip: '75201', units: 85, manager: 'Mike Peters', lastUpdated: '2023-11-19', status: 'Please Stabilize', propertyType: 'MULTIFAMILY' },
  { id: 'a3', name: 'Pine View Villas', address: '789 Forest Dr', city: 'Houston', state: 'TX', zip: '77001', units: 220, manager: 'Elena Rodriguez', lastUpdated: '2023-11-21', status: 'Value Add', propertyType: 'MULTIFAMILY' },
  { id: 'a4', name: 'Cedar Ridge Lofts', address: '321 Cedar Blvd', city: 'Atlanta', state: 'GA', zip: '30301', units: 45, manager: 'James Wilson', lastUpdated: '2023-11-18', status: 'STABILIZED', propertyType: 'MULTIFAMILY' },
  { id: 'a5', name: 'Sunset Valley Townhomes', address: '555 Valley View', city: 'Phoenix', state: 'AZ', zip: '85001', units: 110, manager: 'Patricia Moore', lastUpdated: '2023-11-17', status: 'STABILIZED', propertyType: 'MULTIFAMILY' }
];

export const INITIAL_TENANTS: Tenant[] = [
  { id: 't1', name: 'Alex Miller', email: 'alex@example.com', phone: '555-0101', propertyId: 'a1', leaseEnd: '2024-05-01' },
  { id: 't2', name: 'Jordan Smith', email: 'jordan@example.com', phone: '555-0102', propertyId: 'a2', leaseEnd: '2024-08-15' },
  { id: 't3', name: 'Casey Jones', email: 'casey@example.com', phone: '555-0103', propertyId: 'a3', leaseEnd: '2024-12-31' }
];

export const INITIAL_CONTRACTORS: Contractor[] = [
  { id: 'c1', name: 'Rapid Plumbing', specialty: ['Plumbing', 'Water Heaters'], email: 'fix@rapid.com', phone: '555-9000', rating: 4.8, status: 'AVAILABLE' },
  { id: 'c2', name: 'Bright Spark Electric', specialty: ['Electrical', 'Lighting'], email: 'info@brightspark.com', phone: '555-9001', rating: 4.5, status: 'AVAILABLE' },
  { id: 'c3', name: 'Climate Control Pros', specialty: ['HVAC', 'Cooling'], email: 'service@ccpros.com', phone: '555-9002', rating: 4.2, status: 'BUSY' }
];

export const INITIAL_JOBS: Job[] = [
  {
    id: 'j1',
    propertyId: 'a1',
    tenantId: 't1',
    issueType: 'Plumbing',
    description: 'Leaking kitchen faucet in Unit 402',
    status: JobStatus.REPORTED,
    createdAt: '2023-11-15',
    updatedAt: '2023-11-15',
    communicationLog: [{ id: '1', timestamp: '2023-11-15T10:00:00Z', sender: 'System', message: 'Initial report filed via portal.', type: 'status_change' }]
  },
  {
    id: 'j2',
    propertyId: 'a2',
    tenantId: 't2',
    issueType: 'Electrical',
    description: 'Half of the outlets in bedroom are dead',
    status: JobStatus.REPORTED,
    createdAt: '2023-11-20',
    updatedAt: '2023-11-20',
    communicationLog: [{ id: '1', timestamp: '2023-11-20T09:00:00Z', sender: 'System', message: 'Initial report filed via portal.', type: 'status_change' }]
  },
  {
    id: 'j3',
    propertyId: 'a3',
    tenantId: 't3',
    issueType: 'HVAC',
    description: 'Main furnace is making loud grinding noise',
    status: JobStatus.REPORTED,
    createdAt: '2023-11-21',
    updatedAt: '2023-11-21',
    communicationLog: [{ id: '1', timestamp: '2023-11-21T08:00:00Z', sender: 'System', message: 'Urgent HVAC report.', type: 'status_change' }]
  },
  {
    id: 'j4',
    propertyId: 'a3',
    tenantId: 't3',
    issueType: 'Electrical',
    description: 'Exterior lighting flickering',
    status: JobStatus.REPORTED,
    createdAt: '2023-11-21',
    updatedAt: '2023-11-21',
    communicationLog: [{ id: '1', timestamp: '2023-11-21T08:15:00Z', sender: 'System', message: 'Safety concern.', type: 'status_change' }]
  },
  {
    id: 'j5',
    propertyId: 'a3',
    tenantId: 't3',
    issueType: 'General',
    description: 'Broken window in lobby',
    status: JobStatus.REPORTED,
    createdAt: '2023-11-21',
    updatedAt: '2023-11-21',
    communicationLog: [{ id: '1', timestamp: '2023-11-21T08:30:00Z', sender: 'System', message: 'Vandalism report.', type: 'status_change' }]
  }
];

export const INITIAL_KPI_ENTRIES: KPIEntry[] = [
  // --- PREVIOUS WEEK (2023-11-13) ---
  // Riverside - High Performer (90 Score)
  { id: 'hk1', assetId: 'a1', kpiName: 'Rent Collected %', value: 0.95, date: '2023-11-13' },
  { id: 'hk2', assetId: 'a1', kpiName: 'Turn Days', value: 8, date: '2023-11-13' },
  { id: 'hk3', assetId: 'a1', kpiName: 'Turn Cost', value: 2100, date: '2023-11-13' },

  // Oakwood - Yellow (75 Score)
  { id: 'hk4', assetId: 'a2', kpiName: 'Rent Collected %', value: 0.91, date: '2023-11-13' },
  { id: 'hk5', assetId: 'a2', kpiName: 'Turn Days', value: 12, date: '2023-11-13' },
  { id: 'hk6', assetId: 'a2', kpiName: 'Turn Cost', value: 3200, date: '2023-11-13' },

  // Pine View - Was Yellow (85 Score) - DECLINING TREND
  { id: 'hk7', assetId: 'a3', kpiName: 'Rent Collected %', value: 0.92, date: '2023-11-13' },
  { id: 'hk8', assetId: 'a3', kpiName: 'Turn Days', value: 13, date: '2023-11-13' },
  { id: 'hk9', assetId: 'a3', kpiName: 'Turn Cost', value: 3000, date: '2023-11-13' },

  // --- CURRENT WEEK (2023-11-20) ---
  // Riverside - IMPROVING
  { id: 'k1', assetId: 'a1', kpiName: 'Rent Collected %', value: 0.98, date: '2023-11-20' },
  { id: 'k2', assetId: 'a1', kpiName: 'Turn Days', value: 4, date: '2023-11-20' },
  { id: 'k3', assetId: 'a1', kpiName: 'Turn Cost', value: 1800, date: '2023-11-20' },

  // Oakwood - STABLE
  { id: 'k4', assetId: 'a2', kpiName: 'Rent Collected %', value: 0.91, date: '2023-11-20' },
  { id: 'k5', assetId: 'a2', kpiName: 'Turn Days', value: 12, date: '2023-11-20' },
  { id: 'k6', assetId: 'a2', kpiName: 'Turn Cost', value: 3200, date: '2023-11-20' },

  // Pine View - WATCH (Crashed from 85 to 55)
  { id: 'k7', assetId: 'a3', kpiName: 'Rent Collected %', value: 0.82, date: '2023-11-20' },
  { id: 'k8', assetId: 'a3', kpiName: 'Turn Days', value: 25, date: '2023-11-20' },
  { id: 'k9', assetId: 'a3', kpiName: 'Turn Cost', value: 4800, date: '2023-11-20' }
];
