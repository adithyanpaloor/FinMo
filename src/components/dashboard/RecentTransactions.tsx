import { Link } from 'react-router-dom';
import { Transaction } from '@/types';
import { formatRelativeDate } from '@/utils/dates';
import { formatCurrency } from '@/utils/currency';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowDownRight, ArrowUpRight, ArrowRightLeft, TrendingUp } from 'lucide-react';
import { clsx } from 'clsx';

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export default function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const { currency } = useAuth();

  if (transactions.length === 0) return null;

  return (
    <div className="card p-0 overflow-hidden">
      <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
        <h3 className="text-lg font-bold text-[var(--text-primary)]">Recent Transactions</h3>
        <Link 
          to="/transactions" 
          className="text-sm font-medium text-brand-500 hover:text-brand-600 transition-colors"
        >
          View all
        </Link>
      </div>

      <div className="divide-y divide-[var(--border)]">
        {transactions.map((tx) => (
          <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-[var(--bg-tertiary)] transition-colors">
            <div className="flex items-center gap-4">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ 
                  backgroundColor: `${tx.categoryColor || '#64748b'}15`,
                  color: tx.categoryColor || '#64748b'
                }}
              >
                {tx.type === 'transfer' ? <ArrowRightLeft className="w-5 h-5" /> :
                 tx.type === 'investment' ? <TrendingUp className="w-5 h-5" /> :
                 tx.categoryIcon ? <span>{tx.categoryIcon}</span> :
                 tx.type === 'income' ? <ArrowDownRight className="w-5 h-5" /> :
                 <ArrowUpRight className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)] line-clamp-1">
                  {tx.merchant || tx.description || tx.categoryName}
                </p>
                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mt-0.5">
                  <span>{formatRelativeDate(tx.date)}</span>
                  <span>•</span>
                  <span>{tx.accountName}</span>
                </div>
              </div>
            </div>
            <div className={clsx(
              "text-sm font-bold whitespace-nowrap",
              tx.type === 'income' ? "amount-positive" : 
              tx.type === 'expense' ? "amount-negative" :
              "text-[var(--text-primary)]"
            )}>
              {formatCurrency(tx.amount, currency, { showSign: tx.type !== 'transfer' && tx.type !== 'investment' })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
