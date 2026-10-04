import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRecurringPayments } from '@/hooks/useRecurringPayments';
import { useAccounts } from '@/hooks/useAccounts';
import { useTransactions } from '@/hooks/useTransactions';
import { recurringSchema, RecurringFormValues } from '@/utils/validation';
import { formatCurrency } from '@/utils/currency';
import { DEFAULT_EXPENSE_CATEGORIES, getCategoryById } from '@/utils/constants';
import { useAuth } from '@/contexts/AuthContext';
import { RefreshCw, Plus, Edit2, Trash2, Loader2, X, CheckCircle2, Calendar } from 'lucide-react';
import EmptyState from '@/components/common/EmptyState';
import LoadingScreen from '@/components/common/LoadingScreen';
import { toTimestamp, formatDate, todayInputValue, toInputDate } from '@/utils/dates';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

export default function RecurringPayments() {
  const { currency } = useAuth();
  const { data: recurring = [], isLoading, add, update, remove, markPaid } = useRecurringPayments();
  const { data: accounts = [] } = useAccounts();
  const { add: addTransaction } = useTransactions();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<RecurringFormValues>({
    resolver: zodResolver(recurringSchema),
    defaultValues: { frequency: 'monthly', nextDate: todayInputValue() }
  });

  const openModal = (rec?: any) => {
    if (rec) {
      setEditingId(rec.id);
      reset({
        name: rec.name,
        amount: rec.amount,
        categoryId: rec.categoryId,
        categoryName: rec.categoryName,
        accountId: rec.accountId,
        frequency: rec.frequency,
        nextDate: rec.nextDate ? toInputDate(rec.nextDate) : todayInputValue(),
        description: rec.description,
      });
    } else {
      setEditingId(null);
      reset({ 
        name: '', 
        amount: undefined as any,
        categoryId: '', 
        categoryName: '',
        accountId: accounts.length > 0 ? accounts[0].id : '',
        frequency: 'monthly',
        nextDate: todayInputValue(),
        description: ''
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => { setEditingId(null); reset(); }, 200);
  };

  const onSubmit = async (data: RecurringFormValues) => {
    try {
      const category = getCategoryById(data.categoryId);
      const account = accounts.find(a => a.id === data.accountId);
      const submissionData = { 
        ...data, 
        categoryName: category?.name || '',
        categoryIcon: category?.icon,
        accountName: account?.name 
      };
      
      if (editingId) {
        await update.mutateAsync({ id: editingId, data: submissionData });
      } else {
        await add.mutateAsync(submissionData);
      }
      closeModal();
    } catch (e) {
      // Error handled by mutation
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this recurring payment?')) {
      await remove.mutateAsync(id);
    }
  };

  const handleMarkAsPaid = async (rec: any, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Create the actual transaction
    try {
      await addTransaction.mutateAsync({
        type: 'expense',
        amount: rec.amount,
        categoryId: rec.categoryId,
        categoryName: rec.categoryName,
        categoryIcon: rec.categoryIcon,
        merchant: rec.name,
        description: rec.description || `Recurring payment (${rec.frequency})`,
        accountId: rec.accountId,
        accountName: rec.accountName,
        date: rec.nextDate, // the due date
        isRecurring: true,
        recurringId: rec.id
      });
      
      // Update next date
      await markPaid.mutateAsync(rec);
    } catch (err) {
      toast.error('Failed to process payment');
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Recurring Payments</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Track subscriptions and regular bills
          </p>
        </div>
        <button onClick={() => openModal()} className="btn-primary">
          <Plus className="w-4 h-4" />
          Add Payment
        </button>
      </div>

      {recurring.length === 0 ? (
        <EmptyState
          icon={RefreshCw}
          title="No recurring payments"
          description="Add subscriptions, rent, or other regular payments to track them here."
          action={<button onClick={() => openModal()} className="btn-primary"><Plus className="w-4 h-4" /> Add Payment</button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recurring.map((rec) => {
            const nextDate = new Date(rec.nextDate.seconds * 1000);
            nextDate.setHours(0, 0, 0, 0);
            
            let status = 'upcoming';
            if (nextDate.getTime() < today.getTime()) status = 'overdue';
            else if (nextDate.getTime() === today.getTime()) status = 'due';

            return (
              <div key={rec.id} onClick={() => openModal(rec)} className="card p-5 cursor-pointer card-hover group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center text-xl">
                      {rec.categoryIcon || '🔄'}
                    </div>
                    <div>
                      <h3 className="font-bold text-[var(--text-primary)] line-clamp-1">{rec.name}</h3>
                      <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mt-0.5">
                        {rec.frequency}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className={clsx(
                      "text-xs font-bold px-2 py-1 rounded-md",
                      status === 'overdue' ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" :
                      status === 'due' ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" :
                      "bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
                    )}>
                      {status === 'overdue' ? 'Overdue' : status === 'due' ? 'Due Today' : 'Upcoming'}
                    </div>
                    <button 
                      onClick={(e) => handleDelete(rec.id, e)}
                      className="p-1 opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs text-[var(--text-secondary)] mb-1 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" /> Next Date
                      </p>
                      <p className={clsx(
                        "font-semibold text-sm",
                        status === 'overdue' ? "text-red-500" : "text-[var(--text-primary)]"
                      )}>
                        {formatDate(rec.nextDate, 'dd MMM yyyy')}
                      </p>
                    </div>
                    <p className="text-xl font-bold amount-negative">
                      {formatCurrency(rec.amount, currency)}
                    </p>
                  </div>

                  <button
                    onClick={(e) => handleMarkAsPaid(rec, e)}
                    disabled={addTransaction.isPending || markPaid.isPending}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-[var(--border)] font-semibold text-sm hover:bg-[var(--bg-tertiary)] hover:border-brand-500 hover:text-brand-500 transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Mark as Paid
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={closeModal} />
          
          <div className="relative w-full max-w-md bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl shadow-xl p-6 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">
                {editingId ? 'Edit Recurring Payment' : 'New Recurring Payment'}
              </h3>
              <button onClick={closeModal} className="p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="label">Name (Merchant/Bill)</label>
                <input
                  type="text"
                  className={clsx("input", errors.name && "input-error")}
                  placeholder="e.g. Netflix, Rent"
                  {...register('name')}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Amount</label>
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
                <div>
                  <label className="label">Frequency</label>
                  <select className="input" {...register('frequency')}>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Category</label>
                <select 
                  className={clsx("input", errors.categoryId && "input-error")}
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
                <label className="label">Account to charge</label>
                <select 
                  className={clsx("input", errors.accountId && "input-error")}
                  {...register('accountId')}
                >
                  <option value="">Select account...</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.name} (₹{a.currentBalance})</option>
                  ))}
                </select>
                {errors.accountId && <p className="text-red-500 text-xs mt-1">{errors.accountId.message}</p>}
              </div>

              <div>
                <label className="label">Next Payment Date</label>
                <input
                  type="date"
                  className={clsx("input", errors.nextDate && "input-error")}
                  {...register('nextDate')}
                />
                {errors.nextDate && <p className="text-red-500 text-xs mt-1">{errors.nextDate.message}</p>}
              </div>

              <button
                type="submit"
                disabled={add.isPending || update.isPending}
                className="btn-primary w-full h-11 mt-2"
              >
                {add.isPending || update.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingId ? 'Save Changes' : 'Add Payment')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
