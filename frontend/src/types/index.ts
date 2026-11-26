export type PageId =
  | 'dashboard'
  | 'add-donation'
  | 'inventory'
  | 'distribute-goods'
  | 'donation-history'
  | 'distribution-history'
  | 'catalog'
  | 'profile';

export interface NgoDetails {
  id: number;
  name: string;
  registrationNumber: string;
  cityState: string;
  focusArea: string;
  officialPhone: string;
}

export interface UserProfile {
  id: number;
  ngoId: number;
  displayName: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  createdAt: string;
  ngo: NgoDetails;
}

export interface CategoryRecord {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  itemCount: number;
}

export interface ItemRecord {
  id: number;
  name: string;
  categoryId: number;
  categoryName: string;
  unit: string;
  minThreshold: number;
  createdAt: string;
  totalReceived: number;
  totalDistributed: number;
  currentStock: number;
}

export interface DonorRecord {
  id: number;
  name: string;
  contactInfo: string | null;
  createdAt: string;
  donationCount: number;
}

export interface InventoryRecord {
  itemId: number;
  itemName: string;
  categoryId: number;
  categoryName: string;
  unit: string;
  minThreshold: number;
  totalReceived: number;
  totalDistributed: number;
  currentStock: number;
  updatedAt: string;
  stockStatus: 'out' | 'low' | 'healthy';
}

export interface DonationRecord {
  id: number;
  donorId: number;
  donorName: string;
  donorContact: string | null;
  itemId: number;
  itemName: string;
  categoryId: number;
  categoryName: string;
  quantity: number;
  unit: string;
  donationDate: string;
  notes: string | null;
  createdAt: string;
  recordedBy: string;
  updatedStock?: number;
}

export interface DistributionRecord {
  id: number;
  itemId: number;
  itemName: string;
  categoryId: number;
  categoryName: string;
  quantity: number;
  unit: string;
  beneficiaryLocation: string;
  distributionDate: string;
  notes: string | null;
  createdAt: string;
  recordedBy: string;
  remainingStock?: number;
}

export interface DashboardSummary {
  totalReceivedUnits: number;
  totalDistributedUnits: number;
  currentAvailableStock: number;
  totalItems: number;
  outOfStockCount: number;
  lowStockCount: number;
  alertsCount: number;
  donationCount: number;
  distributionCount: number;
  totalCategories: number;
  totalDonors: number;
}

export interface CategoryOverviewRow {
  categoryId: number;
  categoryName: string;
  itemCount: number;
  totalReceived: number;
  totalDistributed: number;
  currentStock: number;
  belowThresholdCount: number;
}

export interface LowStockAlertItem {
  itemId: number;
  itemName: string;
  categoryName: string;
  unit: string;
  minThreshold: number;
  currentStock: number;
  stockStatus: 'out' | 'low';
}

export interface DashboardData {
  summary: DashboardSummary;
  recentDonations: Array<{
    id: number;
    donorName: string;
    itemName: string;
    categoryName: string;
    quantity: number;
    unit: string;
    donationDate: string;
    notes: string | null;
  }>;
  recentDistributions: Array<{
    id: number;
    itemName: string;
    categoryName: string;
    quantity: number;
    unit: string;
    beneficiaryLocation: string;
    distributionDate: string;
    notes: string | null;
  }>;
  categoryOverview: CategoryOverviewRow[];
  lowStockItems: LowStockAlertItem[];
}

export const PRESET_AVATARS = [
  {
    label: 'Operations Coordinator',
    url: '/src/assets/images/avatar_ngo_coordinator_1795634517377.jpg',
  },
  {
    label: 'Field Logistics Director',
    url: '/src/assets/images/avatar_field_director_1795634524598.jpg',
  },
  {
    label: 'Community Aid Lead',
    url: '/src/assets/images/avatar_logistics_lead_1795634508955.jpg',
  },
] as const;

export const LOGIN_HERO_IMAGE = '/src/assets/images/login_community_warehouse_1795634507097.jpg';
export const DASHBOARD_BANNER_IMAGE = '/src/assets/images/dashboard_relief_banner_1795637273618.jpg';

