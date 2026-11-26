import type {
  CategoryRecord,
  DashboardData,
  DistributionRecord,
  DonationRecord,
  DonorRecord,
  InventoryRecord,
  ItemRecord,
  UserProfile,
} from '../types';

// Keep auth token strictly in memory (never localStorage/sessionStorage)
let memoryAuthToken: string | null = null;
let onUnauthorizedCallback: (() => void) | null = null;

export function setAuthToken(token: string | null): void {
  memoryAuthToken = token;
}

export function getAuthToken(): string | null {
  return memoryAuthToken;
}

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorizedCallback = handler;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (memoryAuthToken) {
    headers.Authorization = `Bearer ${memoryAuthToken}`;
  }

  const response = await fetch(`/api${path}`, {
    ...options,
    headers,
  });

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    if (response.status === 401 && memoryAuthToken && onUnauthorizedCallback) {
      onUnauthorizedCallback();
    }
    const message =
      (data as { error?: string } | null)?.error ||
      `Request failed with status ${response.status}.`;
    throw new ApiError(message, response.status);
  }

  return data as T;
}

function buildQuery(params: Record<string, string | number | undefined | null>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && String(v).trim() !== '') {
      qs.set(k, String(v).trim());
    }
  }
  const str = qs.toString();
  return str ? `?${str}` : '';
}

export const api = {
  // Authorized NGO Auth
  getAuthStatus: () =>
    request<{ hasRegisteredNgo: boolean; registeredNgoCount: number }>('/auth/status'),
  registerNgo: (payload: {
    ngoName: string;
    registrationNumber: string;
    cityState: string;
    focusArea: string;
    officialPhone: string;
    displayName: string;
    email: string;
    password: string;
  }) =>
    request<{ token: string; user: UserProfile }>('/auth/register-ngo', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  login: (payload: { registrationNumber: string; email: string; password: string }) =>
    request<{ token: string; user: UserProfile }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getMe: () => request<{ user: UserProfile }>('/auth/me'),
  updateProfile: (payload: { displayName: string; role: string; avatarUrl: string | null }) =>
    request<{ user: UserProfile }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  // Dashboard
  getDashboard: () => request<DashboardData>('/dashboard'),

  // Categories (append & update only — records are permanent)
  getCategories: () => request<{ categories: CategoryRecord[] }>('/categories'),
  createCategory: (payload: { name: string; description?: string }) =>
    request<{ category: CategoryRecord }>('/categories', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateCategory: (id: number, payload: { name: string; description?: string }) =>
    request<{ category: CategoryRecord }>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  // Items (append & update only — records are permanent)
  getItems: () => request<{ items: ItemRecord[] }>('/items'),
  createItem: (payload: {
    name: string;
    categoryId: number;
    unit: string;
    minThreshold: number;
  }) =>
    request<{ item: ItemRecord }>('/items', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateItem: (
    id: number,
    payload: { name: string; categoryId: number; unit: string; minThreshold: number }
  ) =>
    request<{ item: ItemRecord }>(`/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  // Donors
  getDonors: () => request<{ donors: DonorRecord[] }>('/donors'),

  // Inventory
  getInventory: (filters?: { search?: string; categoryId?: number | string; status?: string }) =>
    request<{ inventory: InventoryRecord[] }>(`/inventory${buildQuery(filters ?? {})}`),
  updateThreshold: (itemId: number, minThreshold: number) =>
    request<{ item: InventoryRecord }>(`/inventory/${itemId}/threshold`, {
      method: 'PATCH',
      body: JSON.stringify({ minThreshold }),
    }),

  // Donations (Goods-In)
  getDonations: (filters?: {
    item?: string;
    donor?: string;
    categoryId?: number | string;
    dateFrom?: string;
    dateTo?: string;
  }) => request<{ donations: DonationRecord[] }>(`/donations${buildQuery(filters ?? {})}`),
  createDonation: (payload: {
    donorName: string;
    donorContact?: string;
    itemId?: number | 'new';
    itemName?: string;
    categoryId?: number;
    quantity: number;
    unit: string;
    donationDate: string;
    notes?: string;
  }) =>
    request<{ donation: DonationRecord }>('/donations', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Distributions (Goods-Out)
  getDistributions: (filters?: {
    item?: string;
    beneficiary?: string;
    categoryId?: number | string;
    dateFrom?: string;
    dateTo?: string;
  }) => request<{ distributions: DistributionRecord[] }>(`/distributions${buildQuery(filters ?? {})}`),
  createDistribution: (payload: {
    itemId: number;
    quantity: number;
    beneficiaryLocation: string;
    distributionDate: string;
    notes?: string;
  }) =>
    request<{ distribution: DistributionRecord }>('/distributions', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
