import { ArrowDownRight, ArrowUpRight, PiggyBank, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import { useAuth } from '@/contexts/AuthContext';

interface SummaryCardsProps {
  income: number;
  expenses: number;
  savings: number;
  investments: number;
}

export default function SummaryCards({ income, expenses, savings, investments }: SummaryCardsProps) {
  const { currency } = useAuth();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Income */}
      <div className="card p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-[var(--text-secondary)]">
          <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
            <ArrowDownRight className="w-4 h-4 text-green-500" />
          </div>
          <span className="text-sm font-medium">Income</span>
        </div>
        <div>
          <div className="text-xl md:text-2xl font-bold text-[var(--text-primary)]">
            {formatCurrency(income, currency)}
          </div>
        </div>
      </div>

      {/* Expenses */}
      <div className="card p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-[var(--text-secondary)]">
          <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
            <ArrowUpRight className="w-4 h-4 text-red-500" />
          </div>
          <span className="text-sm font-medium">Expenses</span>
        </div>
        <div>
          <div className="text-xl md:text-2xl font-bold text-[var(--text-primary)]">
            {formatCurrency(expenses, currency)}
          </div>
        </div>
      </div>

      {/* Savings */}
      <div className="card p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-[var(--text-secondary)]">
          <div className="w-8 h-8 rounded-full bg-brand-500/10 flex items-center justify-center">
            <PiggyBank className="w-4 h-4 text-brand-500" />
          </div>
          <span className="text-sm font-medium">Savings</span>
        </div>
        <div>
          <div className="text-xl md:text-2xl font-bold text-[var(--text-primary)]">
            {formatCurrency(savings, currency)}
          </div>
        </div>
      </div>

      {/* Investments */}
      <div className="card p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-[var(--text-secondary)]">
          <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-purple-500" />
          </div>
          <span className="text-sm font-medium">Investments</span>
        </div>
        <div>
          <div className="text-xl md:text-2xl font-bold text-[var(--text-primary)]">
            {formatCurrency(investments, currency)}
          </div>
        </div>
      </div>
    </div>
  );
}
