export interface Ad {
  id: string;
  title: string;
  price: string;
  image: string;
  status: 'pending' | 'running' | 'closed';
  type: 'social' | 'marketplace';
  timestamp: string;
  reach?: number;
  impressions?: number;
  costPerClick?: string;
  amountSpent?: string;
  dateCreated?: string;
  endDate?: string;
}

export type AdStatus = 'all' | 'pending' | 'running' | 'closed';
export type AdType = 'all' | 'social' | 'marketplace';