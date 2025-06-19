export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  date: string;
  timestamp: string;
}

export interface Gift {
  id: string;
  type: 'sent' | 'received';
  amount: number;
  description: string;
  recipient?: string;
  sender?: string;
  date: string;
  timestamp: string;
}

export type TransactionFilter = 'all' | 'deposits' | 'withdrawals';
export type GiftFilter = 'all' | 'received' | 'sent';