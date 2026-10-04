import { useState, useMemo } from 'react';
import { useTransactionsByDateRange } from '@/hooks/useTransactions';
import { 
  calculateTotalIncome, 
  calculateTotalExpenses, 
  calculateCategoryTotals 
} from '@/utils/calculations';
import { formatCurrency } from '@/utils/currency';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart3, TrendingUp, TrendingDown, Filter } from 'lucide-react';
import LoadingScreen from '@/components/common/LoadingScreen';
import ExpenseBreakdownChart from '@/components/dashboard/ExpenseBreakdownChart';
import CashFlowChart from '@/components/dashboard/CashFlowChart';
import { startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, format } from 'date-fns';
import { clsx } from 'clsx';

type TimeRange = 'thisMonth' | 'lastMonth' | 'last3Months' | 'thisYear';

export default function Analytics() {
  const { currency } = useAuth();
  const [timeRange, setTimeRange] = useState<TimeRange>('thisMonth');

  const dateRange = useMemo(() => {
    const today = new Date();
    switch (timeRange) {
      case 'thisMonth':
        return { start: startOfMonth(today), end: endOfMonth(today) };
      case 'lastMonth':
        const lastMonth = subMonths(today, 1);
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
      case 'last3Months':
        return { start: startOfMonth(subMonths(today, 2)), end: endOfMonth(today) };
      case 'thisYear':
        return { start: startOfYear(today), end: endOfYear(today) };
    }
  }, [timeRange]);

  const { data: transactions = [], isLoading } = useTransactionsByDateRange(dateRange.start, dateRange.end);

  const stats = useMemo(() => {
    const income = calculateTotalIncome(transactions);
    const expenses = calculateTotalExpenses(transactions);
    const netCashFlow = income - expenses;
    const categoryTotals = calculateCategoryTotals(transactions);

    return { income, expenses, netCashFlow, categoryTotals };
  }, [transactions]);

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Analytics</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Deep dive into your financial habits
          </p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          {[
            { id: 'thisMonth', label: 'This Month' },
            { id: 'lastMonth', label: 'Last Month' },
            { id: 'last3Months', label: 'Last 3 Months' },
            { id: 'thisYear', label: 'This Year' },
          ].map((range) => (
            <button
              key={range.id}
              onClick={() => setTimeRange(range.id as TimeRange)}
              className={clsx(
                "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors",
                timeRange === range.id 
                  ? "bg-brand-500 text-white" 
                  : "bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--bg-tertiary)]"
              )}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      <div className="text-sm font-medium text-[var(--text-secondary)]">
        Showing data from {format(dateRange.start, 'MMM d, yyyy')} to {format(dateRange.end, 'MMM d, yyyy')}
      </div>

      {/* High-level KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-3 text-green-500 mb-2">
            <div className="p-2 rounded-lg bg-green-500/10">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="font-semibold text-sm">Total Income</span>
          </div>
          <p className="text-2xl font-bold text-[var(--text-primary)]">
            {formatCurrency(stats.income, currency)}
          </p>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3 text-red-500 mb-2">
            <div className="p-2 rounded-lg bg-red-500/10">
              <TrendingDown className="w-5 h-5" />
            </div>
            <span className="font-semibold text-sm">Total Expenses</span>
          </div>
          <p className="text-2xl font-bold text-[var(--text-primary)]">
            {formatCurrency(stats.expenses, currency)}
          </p>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3 text-brand-500 mb-2">
            <div className="p-2 rounded-lg bg-brand-500/10">
              <BarChart3 className="w-5 h-5" />
            </div>
            <span className="font-semibold text-sm">Net Cash Flow</span>
          </div>
          <p className={clsx(
            "text-2xl font-bold",
            stats.netCashFlow > 0 ? "amount-positive" : 
            stats.netCashFlow < 0 ? "amount-negative" : "text-[var(--text-primary)]"
          )}>
            {formatCurrency(stats.netCashFlow, currency, { showSign: true })}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CashFlowChart 
          transactions={transactions} 
          startDate={dateRange.start} 
          endDate={dateRange.end} 
        />
        <ExpenseBreakdownChart data={stats.categoryTotals} />
      </div>

      {/* Category Breakdown Table */}
      <div className="card p-0 overflow-hidden">
        <div className="p-5 border-b border-[var(--border)] flex items-center justify-between">
          <h3 className="text-lg font-bold text-[var(--text-primary)]">Spending by Category</h3>
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] bg-[var(--bg-tertiary)] px-3 py-1.5 rounded-lg">
            <Filter className="w-4 h-4" />
            Expenses only
          </div>
        </div>
        
        {stats.categoryTotals.length === 0 ? (
          <div className="p-8 text-center text-[var(--text-secondary)]">
            No expense data for this period.
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {stats.categoryTotals.map((cat, i) => (
              <div key={cat.categoryId} className="p-4 flex items-center justify-between hover:bg-[var(--bg-tertiary)] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs" style={{ backgroundColor: `${cat.categoryColor}20`, color: cat.categoryColor }}>
                    {i + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">{cat.categoryName}</p>
                    <p className="text-xs text-[var(--text-muted)]">{cat.count} transactions</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[var(--text-primary)]">{formatCurrency(cat.total, currency)}</p>
                  <p className="text-xs text-[var(--text-muted)]">{cat.percentage.toFixed(1)}% of total</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
