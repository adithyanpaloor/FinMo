import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Transaction } from '@/types';
import { useTransactions } from '@/hooks/useTransactions';
import { useAccounts } from '@/hooks/useAccounts';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/utils/currency';
import { formatRelativeDate, formatDate } from '@/utils/dates';
import { 
  ArrowDownRight, 
  ArrowUpRight, 
  ArrowRightLeft, 
  TrendingUp, 
  Search, 
  Filter, 
  MoreVertical,
  Edit2,
  Trash2,
  Paperclip,
  Loader2
} from 'lucide-react';
import EmptyState from '@/components/common/EmptyState';
import LoadingScreen from '@/components/common/LoadingScreen';
import { clsx } from 'clsx';
import { ALL_CATEGORIES } from '@/utils/constants';

export default function Transactions() {
  const { currency } = useAuth();
  const navigate = useNavigate();
  const { transactions, isLoading, isFetching, hasMore, loadMore, remove } = useTransactions();
  const { data: accounts } = useAccounts();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, expense, income, transfer, investment
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Search filter
      const searchMatch = 
        (tx.merchant?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (tx.description?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (tx.categoryName?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      
      // Type filter
      const typeMatch = filterType === 'all' || tx.type === filterType;
      
      return searchMatch && typeMatch;
    });
  }, [transactions, searchQuery, filterType]);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this transaction? This will update your account balance.')) {
      setActiveMenu(null);
      await remove.mutateAsync(id);
    }
  };

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Transactions</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            View and manage all your financial activities
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            className="input pl-9 w-full"
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          {['all', 'expense', 'income', 'transfer', 'investment'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={clsx(
                "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors",
                filterType === type 
                  ? "bg-brand-500 text-white" 
                  : "bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--bg-tertiary)]"
              )}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions List */}
      <div className="card p-0 overflow-visible">
        {filteredTransactions.length === 0 ? (
          <EmptyState
            icon={Filter}
            title="No transactions found"
            description="Try adjusting your search or filters, or add a new transaction."
          />
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {filteredTransactions.map((tx: Transaction) => (
              <div key={tx.id} className="p-4 hover:bg-[var(--bg-tertiary)] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                {/* Info */}
                <div className="flex items-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                    style={{ 
                      backgroundColor: `${tx.categoryColor || '#64748b'}15`,
                      color: tx.categoryColor || '#64748b'
                    }}
                  >
                    {tx.type === 'transfer' ? <ArrowRightLeft className="w-5 h-5" /> :
                     tx.type === 'investment' ? <TrendingUp className="w-5 h-5" /> :
                     tx.categoryIcon ? <span className="text-lg">{tx.categoryIcon}</span> :
                     tx.type === 'income' ? <ArrowDownRight className="w-5 h-5" /> :
                     <ArrowUpRight className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-[var(--text-primary)]">
                      {tx.merchant || tx.categoryName || 'Transfer'}
                      {tx.receiptUrl && (
                        <a href={tx.receiptUrl} target="_blank" rel="noreferrer" title="View receipt" className="inline-block ml-2 align-middle text-[var(--text-muted)] hover:text-brand-500">
                          <Paperclip className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </h4>
                    {tx.description && (
                      <p className="text-sm text-[var(--text-secondary)] mt-0.5 line-clamp-1">{tx.description}</p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mt-1">
                      <span className="font-medium text-[var(--text-secondary)]">{formatDate(tx.date, 'dd MMM yyyy')}</span>
                      <span>•</span>
                      <span className="px-1.5 py-0.5 rounded-md bg-[var(--bg-primary)] border border-[var(--border)]">{tx.accountName}</span>
                      {tx.toAccountName && (
                        <>
                          <ArrowRightLeft className="w-3 h-3" />
                          <span className="px-1.5 py-0.5 rounded-md bg-[var(--bg-primary)] border border-[var(--border)]">{tx.toAccountName}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Actions & Amount */}
                <div className="flex items-center justify-between md:justify-end gap-6 ml-16 md:ml-0">
                  <div className={clsx(
                    "text-lg font-bold text-right",
                    tx.type === 'income' ? "amount-positive" : 
                    tx.type === 'expense' ? "amount-negative" :
                    "text-[var(--text-primary)]"
                  )}>
                    {formatCurrency(tx.amount, currency, { showSign: tx.type !== 'transfer' && tx.type !== 'investment' })}
                  </div>
                  
                  {/* Menu */}
                  <div className="relative">
                    <button 
                      onClick={() => setActiveMenu(activeMenu === tx.id ? null : tx.id)}
                      className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition-colors"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    
                    {activeMenu === tx.id && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setActiveMenu(null)}
                        />
                        <div className="absolute right-0 top-full mt-1 w-36 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl shadow-lg z-20 py-1 overflow-hidden animate-scale-in origin-top-right">
                          <button 
                            className="w-full text-left px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] flex items-center gap-2"
                            onClick={() => {
                              setActiveMenu(null);
                              navigate(`/transactions/${tx.id}/edit`);
                            }}
                          >
                            <Edit2 className="w-4 h-4" /> Edit
                          </button>
                          <button 
                            className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2"
                            onClick={() => handleDelete(tx.id)}
                          >
                            <Trash2 className="w-4 h-4" /> Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
              </div>
            ))}
          </div>
        )}
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <button onClick={loadMore} disabled={isFetching} className="btn-secondary btn-md">
            {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );
}
