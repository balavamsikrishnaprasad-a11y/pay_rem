export interface Transaction {
  id?: string;
  uid: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  category: string;
  subcategory?: string;
  date: string;
  source: 'manual' | 'gmail' | 'receipt-scan' | 'upi';
  merchant?: string;
  paymentMethod?: string;
  note?: string;
  receiptUrl?: string;
  tags?: string[];
  referenceNumber?: string;
  upiAppUsed?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Bill {
  id?: string;
  uid: string;
  name: string;
  amount: number;
  dueDate: string;
  recurrence: 'none' | 'monthly' | 'yearly' | 'weekly';
  status: 'pending' | 'paid';
  category?: string;
  calendarEventId?: string;
  payeeVpa?: string;
  payeeName?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Budget {
  id?: string;
  uid: string;
  period: string;
  category: string;
  limit: number;
  spent: number;
  createdAt: string;
  updatedAt?: string;
}

export interface UserProfile {
  id?: string;
  uid: string;
  currency: string;
  timezone: string;
  dateFormat: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Account {
  id?: string;
  uid: string;
  type: 'bank' | 'cash' | 'property' | 'vehicle' | 'loan' | 'credit_card' | 'mortgage' | 'personal_debt';
  name: string;
  balance: number;
  lastUpdated?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Document {
  id?: string;
  uid: string;
  title: string;
  category: 'receipt' | 'invoice' | 'tax' | 'insurance' | 'bank_statement' | 'warranty';
  fileUrl: string;
  uploadedDate: string;
  linkedTransactionId?: string;
  createdAt: string;
  updatedAt?: string;
}
