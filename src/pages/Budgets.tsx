import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useBudgets } from '@/hooks/useBudgets';
import { budgetSchema, BudgetFormValues } from '@/utils/validation';
import { DEFAULT_EXPENSE_CATEGORIES, getCategoryById } from '@/utils/constants';
import { formatCurrency, formatPercentage } from '@/utils/currency';
import { useAuth } from '@/contexts/AuthContext';
import { PiggyBank, Plus, Edit2, Trash2, Loader2, X, AlertTriangle } from 'lucide-react';
import EmptyState from '@/components/common/EmptyState';
import LoadingScreen from '@/components/common/LoadingScreen';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

export default function Budgets() {
  const { currency } = useAuth();
  
  // Date selection state
  const [currentDate, setCurrentDate] = useState(new Date());
  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();
  
  const { budgets, isLoading, add, update, remove, totalBudget, totalSpent } = useBudgets(month, year);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: { month, year }
  });

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentDate(newDate);
  };

  const openModal = (b?: any) => {
    if (b) {
      setEditingId(b.id);
      reset({
        categoryId: b.categoryId,
        categoryName: b.categoryName,
        amount: b.amount,
        month,
        year,
      });
    } else {
      setEditingId(null);
      reset({ amount: undefined, categoryId: '', categoryName: '', month, year });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => { setEditingId(null); reset(); }, 200);
  };

  const onSubmit = async (values: BudgetFormValues) => {
    try {
      const category = getCategoryById(values.categoryId);
      if (budgets.some((b) => b.categoryId === values.categoryId && b.id !== editingId)) {
        toast.error(`A budget for ${category?.name ?? 'this category'} already exists this month`);
        return;
      }
      const data = { ...values, categoryName: category?.name ?? values.categoryName ?? '' };
      if (editingId) {
        await update.mutateAsync({ id: editingId, data });
      } else {
        await add.mutateAsync(data);
      }
      closeModal();
    } catch (e) {
      // Error handled by mutation
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this budget limit? Past transactions are not affected.')) {
      await remove.mutateAsync(id);
    }
  };

  if (isLoading) return <LoadingScreen />;

  const statusColors = {
    healthy: 'bg-green-500',
    warning: 'bg-yellow-500',
    critical: 'bg-orange-500',
    exceeded: 'bg-red-500',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Budgets</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Set limits and track your monthly spending
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)] p-1">
            <button onClick={() => changeMonth(-1)} className="px-3 py-1 hover:bg-[var(--bg-tertiary)] rounded-lg text-[var(--text-secondary)] font-medium text-sm transition-colors">Prev</button>
            <span className="px-4 text-sm font-bold text-[var(--text-primary)] min-w-[120px] text-center">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={() => changeMonth(1)} className="px-3 py-1 hover:bg-[var(--bg-tertiary)] rounded-lg text-[var(--text-secondary)] font-medium text-sm transition-colors">Next</button>
          </div>
          
          <button onClick={() => openModal()} className="btn-primary">
            <Plus className="w-4 h-4" />
            New Budget
          </button>
        </div>
      </div>

      {/* Overview Card */}
      <div className="card p-6 bg-brand-50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-800">
        <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-4 uppercase tracking-wider">Overall Budget Usage</h3>
        <div className="flex items-end justify-between mb-2">
          <div>
            <p className="text-3xl font-bold text-brand-600 dark:text-brand-400">
              {formatCurrency(totalSpent, currency)}
            </p>
            <p className="text-sm font-medium text-[var(--text-muted)] mt-1">
              of {formatCurrency(totalBudget, currency)} limit
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-[var(--text-primary)]">
              {totalBudget > 0 ? formatPercentage((totalSpent / totalBudget) * 100) : '0%'}
            </p>
          </div>
        </div>
        <div className="progress-bar mt-4 h-3">
          <div 
            className={clsx("progress-fill", totalSpent > totalBudget ? 'bg-red-500' : 'bg-brand-500')}
            style={{ width: `${Math.min(totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0, 100)}%` }}
          />
        </div>
      </div>

      {/* Warnings */}
      {budgets.filter(b => b.status === 'exceeded' || b.status === 'critical').map(b => (
        <div key={`warn-${b.id}`} className={clsx(
          "flex items-start gap-3 p-4 rounded-xl border",
          b.status === 'exceeded' ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300" :
          "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-300"
        )}>
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold">{b.categoryName} budget {b.status === 'exceeded' ? 'exceeded' : 'is nearly full'}</h4>
            <p className="text-sm opacity-90 mt-1">
              You have {b.status === 'exceeded' ? 'overspent by' : 'only'} {formatCurrency(Math.abs(b.remaining), currency)} this month.
            </p>
          </div>
        </div>
      ))}

      {/* Budget List */}
      {budgets.length === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title="No budgets set"
          description={`You haven't set any budgets for ${currentDate.toLocaleString('default', { month: 'long' })}.`}
          action={<button onClick={() => openModal()} className="btn-primary"><Plus className="w-4 h-4" /> Create Budget</button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map((b) => (
            <div 
              key={b.id}
              onClick={() => openModal(b)}
              className="card p-5 cursor-pointer card-hover group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center text-xl">
                    {getCategoryById(b.categoryId)?.icon || '📦'}
                  </div>
                  <div>
                    <h3 className="font-bold text-[var(--text-primary)]">{b.categoryName}</h3>
                    <p className="text-xs font-medium text-[var(--text-muted)]">
                      Limit: {formatCurrency(b.amount, currency)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[var(--text-primary)]">
                    {formatPercentage(b.percentageUsed)}
                  </span>
                  <button 
                    onClick={(e) => handleDelete(b.id, e)}
                    className="p-1.5 opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="progress-bar mb-2">
                <div 
                  className={clsx("progress-fill", statusColors[b.status])}
                  style={{ width: `${Math.min(b.percentageUsed, 100)}%` }}
                />
              </div>
              
              <div className="flex justify-between text-xs font-medium">
                <span className="text-[var(--text-secondary)]">Spent: {formatCurrency(b.spent, currency)}</span>
                <span className={clsx(b.status === 'exceeded' ? "text-red-500" : "text-[var(--text-secondary)]")}>
                  {b.status === 'exceeded' ? 'Over by' : 'Left'}: {formatCurrency(Math.abs(b.remaining), currency)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={closeModal} />
          
          <div className="relative w-full max-w-md bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl shadow-xl p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">
                {editingId ? 'Edit Budget' : 'New Budget'}
              </h3>
              <button onClick={closeModal} className="p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="label">Category</label>
                <select 
                  className={clsx("input", errors.categoryId && "input-error")}
                  disabled={!!editingId} // Don't allow changing category once created
                  {...register('categoryId')}
                >
                  <option value="">Select category...</option>
                  {DEFAULT_EXPENSE_CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                  ))}
                </select>
                {errors.categoryId && <p className="text-red-500 text-xs mt-1">{errors.categoryId.message}</p>}
              </div>

              <div>
                <label className="label">Monthly Limit</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-[var(--text-secondary)]">
                    {currency === 'INR' ? '₹' : currency}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    className={clsx("input pl-10", errors.amount && "input-error")}
                    placeholder="0.00"
                    {...register('amount', { valueAsNumber: true })}
                  />
                </div>
                {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
              </div>

              <input type="hidden" {...register('month', { valueAsNumber: true })} />
              <input type="hidden" {...register('year', { valueAsNumber: true })} />

              <button
                type="submit"
                disabled={add.isPending || update.isPending}
                className="btn-primary w-full h-11 mt-2"
              >
                {add.isPending || update.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingId ? 'Save Changes' : 'Create Budget')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
