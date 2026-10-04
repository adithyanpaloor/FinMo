import { Category } from '@/types';

// ─── Default Expense Categories ──────────────────────────────────────────────

export const DEFAULT_EXPENSE_CATEGORIES: Category[] = [
  { id: 'food', name: 'Food', icon: '🍛', color: '#f97316', type: 'expense' },
  { id: 'groceries', name: 'Groceries', icon: '🛒', color: '#84cc16', type: 'expense' },
  { id: 'rent', name: 'Rent', icon: '🏠', color: '#8b5cf6', type: 'expense' },
  { id: 'transport', name: 'Transport', icon: '🚕', color: '#0ea5e9', type: 'expense' },
  { id: 'shopping', name: 'Shopping', icon: '🛍️', color: '#ec4899', type: 'expense' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎬', color: '#f59e0b', type: 'expense' },
  { id: 'bills', name: 'Bills', icon: '⚡', color: '#ef4444', type: 'expense' },
  { id: 'healthcare', name: 'Healthcare', icon: '🏥', color: '#06b6d4', type: 'expense' },
  { id: 'education', name: 'Education', icon: '📚', color: '#6366f1', type: 'expense' },
  { id: 'travel', name: 'Travel', icon: '✈️', color: '#14b8a6', type: 'expense' },
  { id: 'personal', name: 'Personal', icon: '💆', color: '#a78bfa', type: 'expense' },
  { id: 'subscriptions', name: 'Subscriptions', icon: '📺', color: '#f43f5e', type: 'expense' },
  { id: 'work', name: 'Work', icon: '💼', color: '#64748b', type: 'expense' },
  { id: 'petrol', name: 'Petrol', icon: '⛽', color: '#fb923c', type: 'expense' },
  { id: 'other_expense', name: 'Other', icon: '📦', color: '#94a3b8', type: 'expense' },
];

export const DEFAULT_INCOME_CATEGORIES: Category[] = [
  { id: 'salary', name: 'Salary', icon: '💰', color: '#22c55e', type: 'income' },
  { id: 'freelancing', name: 'Freelancing', icon: '💻', color: '#10b981', type: 'income' },
  { id: 'business', name: 'Business', icon: '🏢', color: '#059669', type: 'income' },
  { id: 'interest', name: 'Interest', icon: '📈', color: '#16a34a', type: 'income' },
  { id: 'refund', name: 'Refund', icon: '↩️', color: '#4ade80', type: 'income' },
  { id: 'gift', name: 'Gift', icon: '🎁', color: '#86efac', type: 'income' },
  { id: 'other_income', name: 'Other', icon: '💫', color: '#6ee7b7', type: 'income' },
];

export const ALL_CATEGORIES: Category[] = [
  ...DEFAULT_EXPENSE_CATEGORIES,
  ...DEFAULT_INCOME_CATEGORIES,
];

export function getCategoryById(id: string): Category | undefined {
  return ALL_CATEGORIES.find((c) => c.id === id);
}

export function getCategoriesByType(type: 'expense' | 'income'): Category[] {
  return type === 'expense' ? DEFAULT_EXPENSE_CATEGORIES : DEFAULT_INCOME_CATEGORIES;
}

// ─── Account Type Config ──────────────────────────────────────────────────────

export const ACCOUNT_TYPES = [
  { value: 'cash', label: 'Cash', icon: '💵' },
  { value: 'bank', label: 'Bank Account', icon: '🏦' },
  { value: 'upi', label: 'UPI', icon: '📱' },
  { value: 'credit_card', label: 'Credit Card', icon: '💳' },
  { value: 'wallet', label: 'Wallet', icon: '👛' },
  { value: 'investment', label: 'Investment Account', icon: '📈' },
  { value: 'other', label: 'Other', icon: '🏧' },
] as const;

export const ACCOUNT_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#f59e0b', '#84cc16', '#22c55e',
  '#10b981', '#06b6d4', '#0ea5e9', '#3b82f6',
];

// ─── Investment Types ─────────────────────────────────────────────────────────

export const INVESTMENT_TYPES = [
  { value: 'mutual_fund', label: 'Mutual Fund', icon: '📊' },
  { value: 'stocks', label: 'Stocks', icon: '📈' },
  { value: 'fd', label: 'Fixed Deposit', icon: '🏦' },
  { value: 'gold', label: 'Gold', icon: '🥇' },
  { value: 'other', label: 'Other', icon: '💎' },
] as const;

// ─── Currencies ───────────────────────────────────────────────────────────────

export const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
];
