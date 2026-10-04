import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useTransactionsByDateRange, useRecentTransactions } from '@/hooks/useTransactions';
import { useAccounts } from '@/hooks/useAccounts';
import { useBudgets } from '@/hooks/useBudgets';
import { getCurrentMonthRange, formatMonth } from '@/utils/dates';
import { 
  calculateTotalIncome, 
  calculateTotalExpenses, 
  calculateTotalSavings,
  calculateTotalInvestments,
  calculateSavingsRate,
  calculateCategoryTotals,
  calculateDailyAllowance
} from '@/utils/calculations';
import { formatCurrency } from '@/utils/currency';
import LoadingScreen from '@/components/common/LoadingScreen';
import SummaryCards from '@/components/dashboard/SummaryCards';
import CashFlowChart from '@/components/dashboard/CashFlowChart';
import ExpenseBreakdownChart from '@/components/dashboard/ExpenseBreakdownChart';
import RecentTransactions from '@/components/dashboard/RecentTransactions';
import InsightsPanel from '@/components/dashboard/InsightsPanel';
import DailyAllowance from '@/components/dashboard/DailyAllowance';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { profile, currency } = useAuth();
  const navigate = useNavigate();
  const [dateRange] = useState(getCurrentMonthRange());
  
  const { data: transactions = [], isLoading: txLoading } = useTransactionsByDateRange(dateRange.start, dateRange.end);
  const { data: recentTxs = [], isLoading: recentLoading } = useRecentTransactions(5);
  const { totalBalance, isLoading: accLoading } = useAccounts();
  const { totalBudget, totalSpent, isLoading: budgetLoading } = useBudgets(dateRange.start.getMonth() + 1, dateRange.start.getFullYear());

  const stats = useMemo(() => {
    const income = calculateTotalIncome(transactions);
    const expenses = calculateTotalExpenses(transactions);
    const savings = calculateTotalSavings(transactions);
    const investments = calculateTotalInvestments(transactions);
    const savingsRate = calculateSavingsRate(transactions);
    const categoryTotals = calculateCategoryTotals(transactions);
    
    // Calculate daily allowance if budgets exist
    const remainingBudget = totalBudget > 0 ? totalBudget - totalSpent : 0;
    const dailyAllowance = totalBudget > 0 ? calculateDailyAllowance(remainingBudget) : 0;

    return {
      income,
      expenses,
      savings,
      investments,
      savingsRate,
      categoryTotals,
      dailyAllowance
    };
  }, [transactions, totalBudget, totalSpent]);

  if (txLoading || accLoading || budgetLoading || recentLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[var(--text-secondary)] mb-1">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {profile?.name?.split(' ')[0]}
          </p>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">
            {formatMonth(dateRange.start)}
          </h2>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-[var(--text-secondary)]">Total Balance</p>
            <p className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
              {formatCurrency(totalBalance, currency)}
            </p>
          </div>
          <button 
            onClick={() => navigate('/add')}
            className="hidden md:flex btn-primary btn-md"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <SummaryCards 
        income={stats.income}
        expenses={stats.expenses}
        savings={stats.savings}
        investments={stats.investments}
      />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Charts) */}
        <div className="lg:col-span-2 space-y-6">
          <CashFlowChart 
            transactions={transactions}
            startDate={dateRange.start}
            endDate={dateRange.end}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ExpenseBreakdownChart data={stats.categoryTotals} />
            <div className="space-y-6">
              <DailyAllowance dailyAllowance={stats.dailyAllowance} />
              <InsightsPanel 
                expenses={stats.expenses}
                income={stats.income}
                categories={stats.categoryTotals}
                savingsRate={stats.savingsRate}
              />
            </div>
          </div>
        </div>

        {/* Right Column (Transactions) */}
        <div className="lg:col-span-1">
          <RecentTransactions transactions={recentTxs} />
        </div>
      </div>
    </div>
  );
}
