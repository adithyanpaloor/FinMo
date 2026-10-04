import { Timestamp } from 'firebase/firestore';

// ─── User ────────────────────────────────────────────────────────────────────
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  currency: string;
  theme: 'light' | 'dark' | 'system';
  notifications: {
    budgetWarnings: boolean;
    recurringReminders: boolean;
    goalReminders: boolean;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Account ─────────────────────────────────────────────────────────────────
export type AccountType =
  | 'cash'
  | 'bank'
  | 'upi'
  | 'credit_card'
  | 'wallet'
  | 'investment'
  | 'other';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  openingBalance: number;
  currentBalance: number;
  currency: string;
  color?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Category ────────────────────────────────────────────────────────────────
export type TransactionType = 'expense' | 'income' | 'transfer' | 'investment';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income' | 'both';
  isCustom?: boolean;
}

// ─── Transaction ─────────────────────────────────────────────────────────────
export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId?: string;
  categoryName?: string;
  categoryIcon?: string;
  categoryColor?: string;
  merchant?: string;
  description?: string;
  accountId: string;
  accountName?: string;
  toAccountId?: string;   // for transfers
  toAccountName?: string; // for transfers
  paymentMethod?: string;
  date: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  tags?: string[];
  receiptUrl?: string;
  isRecurring?: boolean;
  recurringId?: string;
  investmentId?: string;
}

// ─── Budget ──────────────────────────────────────────────────────────────────
export interface Budget {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryIcon?: string;
  categoryColor?: string;
  amount: number;
  month: number;  // 1-12
  year: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface BudgetWithSpent extends Budget {
  spent: number;
  remaining: number;
  percentageUsed: number;
  status: 'healthy' | 'warning' | 'critical' | 'exceeded';
}

// ─── Goal ────────────────────────────────────────────────────────────────────
export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: Timestamp;
  description?: string;
  icon?: string;
  color?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Investment ──────────────────────────────────────────────────────────────
export type InvestmentType = 'mutual_fund' | 'stocks' | 'fd' | 'gold' | 'other';

export interface Investment {
  id: string;
  name: string;
  type: InvestmentType;
  amountInvested: number;
  currentValue?: number;
  date: Timestamp;
  accountId: string;
  accountName?: string;
  notes?: string;
  transactionId?: string; // linked 'investment' transaction
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Recurring Payment ───────────────────────────────────────────────────────
export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurringPayment {
  id: string;
  name: string;
  amount: number;
  categoryId: string;
  categoryName: string;
  categoryIcon?: string;
  accountId: string;
  accountName?: string;
  frequency: RecurringFrequency;
  nextDate: Timestamp;
  description?: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
export interface DashboardStats {
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
  totalSavings: number;
  totalInvestments: number;
  savingsRate: number;
  avgDailySpending: number;
  dailyAllowance: number;
  transactionCount: number;
}

export interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  savings: number;
  investments: number;
}

export interface CategoryTotal {
  categoryId: string;
  categoryName: string;
  categoryIcon?: string;
  categoryColor: string;
  total: number;
  percentage: number;
  count: number;
}

// ─── Report ──────────────────────────────────────────────────────────────────
export interface ReportData {
  period: { start: Date; end: Date };
  totalIncome: number;
  totalExpenses: number;
  totalSavings: number;
  savingsRate: number;
  categoryBreakdown: CategoryTotal[];
  accountBalances: Account[];
  largestTransactions: Transaction[];
  transactionCount: number;
  investmentTotal: number;
}

// ─── Form Types ──────────────────────────────────────────────────────────────
export interface TransactionFormData {
  type: TransactionType;
  amount: number;
  categoryId: string;
  categoryName: string;
  merchant: string;
  description: string;
  accountId: string;
  toAccountId?: string;
  paymentMethod: string;
  date: string;
  tags: string;
  isRecurring: boolean;
}

export interface AccountFormData {
  name: string;
  type: AccountType;
  openingBalance: number;
  currency: string;
  color?: string;
}

export interface BudgetFormData {
  categoryId: string;
  categoryName: string;
  amount: number;
  month: number;
  year: number;
}

export interface GoalFormData {
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface InvestmentFormData {
  name: string;
  type: InvestmentType;
  amountInvested: number;
  currentValue?: number;
  date: string;
  accountId: string;
  notes?: string;
}

export interface RecurringFormData {
  name: string;
  amount: number;
  categoryId: string;
  categoryName: string;
  accountId: string;
  frequency: RecurringFrequency;
  nextDate: string;
  description?: string;
}
