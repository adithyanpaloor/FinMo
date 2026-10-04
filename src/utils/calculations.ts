import { Transaction, CategoryTotal } from '@/types';
import { Timestamp } from 'firebase/firestore';
import {
  startOfMonth,
  endOfMonth,
  differenceInDays,
  getDaysInMonth,
} from 'date-fns';

// ─── Income / Expense / Savings ──────────────────────────────────────────────

export function calculateTotalIncome(transactions: Transaction[]): number {
  return transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
}

export function calculateTotalExpenses(transactions: Transaction[]): number {
  return transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
}

export function calculateTotalInvestments(transactions: Transaction[]): number {
  return transactions
    .filter((t) => t.type === 'investment')
    .reduce((sum, t) => sum + t.amount, 0);
}

export function calculateTotalSavings(transactions: Transaction[]): number {
  const income = calculateTotalIncome(transactions);
  const expenses = calculateTotalExpenses(transactions);
  const investments = calculateTotalInvestments(transactions);
  return income - expenses - investments;
}

export function calculateSavingsRate(transactions: Transaction[]): number {
  const income = calculateTotalIncome(transactions);
  if (income === 0) return 0;
  const savings = calculateTotalSavings(transactions);
  return Math.round((savings / income) * 100 * 10) / 10;
}

export function calculateNetCashFlow(transactions: Transaction[]): number {
  const income = calculateTotalIncome(transactions);
  const expenses = calculateTotalExpenses(transactions);
  return income - expenses;
}

// ─── Daily / Average ─────────────────────────────────────────────────────────

export function calculateAvgDailySpending(
  transactions: Transaction[],
  daysElapsed: number
): number {
  if (daysElapsed <= 0) return 0;
  const expenses = calculateTotalExpenses(transactions);
  return Math.round((expenses / daysElapsed) * 100) / 100;
}

export function calculateDailyAllowance(
  remainingBudget: number,
  today: Date = new Date()
): number {
  const end = endOfMonth(today);
  const remaining = differenceInDays(end, today) + 1;
  if (remaining <= 0) return 0;
  return Math.round((remainingBudget / remaining) * 100) / 100;
}

export function getDaysElapsedInMonth(today: Date = new Date()): number {
  return today.getDate();
}

export function getRemainingDaysInMonth(today: Date = new Date()): number {
  return getDaysInMonth(today) - today.getDate();
}

// ─── Category Totals ─────────────────────────────────────────────────────────

export function calculateCategoryTotals(
  transactions: Transaction[]
): CategoryTotal[] {
  const expenses = transactions.filter((t) => t.type === 'expense');
  const total = expenses.reduce((sum, t) => sum + t.amount, 0);

  const map = new Map<string, CategoryTotal>();

  for (const t of expenses) {
    const key = t.categoryId ?? 'other';
    const existing = map.get(key);
    if (existing) {
      existing.total += t.amount;
      existing.count += 1;
    } else {
      map.set(key, {
        categoryId: key,
        categoryName: t.categoryName ?? 'Other',
        categoryIcon: t.categoryIcon,
        categoryColor: t.categoryColor ?? '#6366f1',
        total: t.amount,
        percentage: 0,
        count: 1,
      });
    }
  }

  const categories = Array.from(map.values());
  if (total > 0) {
    for (const c of categories) {
      c.percentage = Math.round((c.total / total) * 1000) / 10;
    }
  }

  return categories.sort((a, b) => b.total - a.total);
}

// ─── Budget ──────────────────────────────────────────────────────────────────

export function calculateBudgetUsage(
  budgetAmount: number,
  spent: number
): { remaining: number; percentageUsed: number; status: 'healthy' | 'warning' | 'critical' | 'exceeded' } {
  const remaining = budgetAmount - spent;
  const percentageUsed = budgetAmount > 0 ? Math.round((spent / budgetAmount) * 1000) / 10 : 0;

  let status: 'healthy' | 'warning' | 'critical' | 'exceeded' = 'healthy';
  if (percentageUsed >= 100) status = 'exceeded';
  else if (percentageUsed >= 90) status = 'critical';
  else if (percentageUsed >= 75) status = 'warning';

  return { remaining, percentageUsed, status };
}

// ─── Account Balance ─────────────────────────────────────────────────────────

export function calculateAccountBalance(
  openingBalance: number,
  transactions: Transaction[],
  accountId: string
): number {
  let balance = openingBalance;

  for (const t of transactions) {
    if (t.accountId === accountId) {
      if (t.type === 'income') balance += t.amount;
      else if (t.type === 'expense') balance -= t.amount;
      else if (t.type === 'investment') balance -= t.amount;
      else if (t.type === 'transfer') balance -= t.amount; // outgoing
    }
    if (t.toAccountId === accountId && t.type === 'transfer') {
      balance += t.amount; // incoming
    }
  }

  return Math.round(balance * 100) / 100;
}

// ─── Monthly Totals ──────────────────────────────────────────────────────────

export function calculateMonthlyTotals(
  transactions: Transaction[],
  month: number, // 1-12
  year: number
): { income: number; expenses: number; investments: number; savings: number } {
  const filtered = transactions.filter((t) => {
    const d = t.date instanceof Timestamp ? t.date.toDate() : new Date(t.date as unknown as string);
    return d.getMonth() + 1 === month && d.getFullYear() === year;
  });

  const income = calculateTotalIncome(filtered);
  const expenses = calculateTotalExpenses(filtered);
  const investments = calculateTotalInvestments(filtered);
  const savings = income - expenses - investments;

  return { income, expenses, investments, savings };
}

// ─── Date Helpers ────────────────────────────────────────────────────────────

export function getMonthDateRange(
  month: number,
  year: number
): { start: Date; end: Date } {
  const start = startOfMonth(new Date(year, month - 1, 1));
  const end = endOfMonth(start);
  return { start, end };
}

export function getCurrentMonthDateRange(): { start: Date; end: Date } {
  const now = new Date();
  return getMonthDateRange(now.getMonth() + 1, now.getFullYear());
}
