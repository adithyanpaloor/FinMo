import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAccounts } from '@/hooks/useAccounts';
import { accountSchema, AccountFormValues } from '@/utils/validation';
import { ACCOUNT_TYPES, ACCOUNT_COLORS } from '@/utils/constants';
import { formatCurrency } from '@/utils/currency';
import { useAuth } from '@/contexts/AuthContext';
import { Landmark, Plus, Edit2, Trash2, Loader2, X } from 'lucide-react';
import EmptyState from '@/components/common/EmptyState';
import LoadingScreen from '@/components/common/LoadingScreen';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

export default function Accounts() {
  const { currency } = useAuth();
  const { data: accounts = [], isLoading, add, update, remove, totalBalance } = useAccounts();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: { type: 'bank', color: ACCOUNT_COLORS[0] }
  });

  const selectedColor = watch('color');

  const openModal = (acc?: any) => {
    if (acc) {
      setEditingId(acc.id);
      reset({
        name: acc.name,
        type: acc.type,
        openingBalance: acc.openingBalance,
        currency: acc.currency,
        color: acc.color || ACCOUNT_COLORS[0],
      });
    } else {
      setEditingId(null);
      reset({ type: 'bank', currency, color: ACCOUNT_COLORS[0], openingBalance: 0, name: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => { setEditingId(null); reset(); }, 200);
  };

  const onSubmit = async (data: AccountFormValues) => {
    try {
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
    if (confirm('Are you sure you want to delete this account? This will not delete its transactions, but they will be orphaned.')) {
      await remove.mutateAsync(id);
    }
  };

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Accounts</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Manage your bank accounts, wallets, and cash
          </p>
        </div>
        <button onClick={() => openModal()} className="btn-primary">
          <Plus className="w-4 h-4" />
          Add Account
        </button>
      </div>

      <div className="card p-5 bg-brand-50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-800">
        <p className="text-sm font-medium text-[var(--text-secondary)] mb-1">Net Worth</p>
        <p className="text-3xl font-bold text-brand-600 dark:text-brand-400">
          {formatCurrency(totalBalance, currency)}
        </p>
      </div>

      {accounts.length === 0 ? (
        <EmptyState
          icon={Landmark}
          title="No accounts yet"
          description="Add your first account to start tracking your finances."
          action={<button onClick={() => openModal()} className="btn-primary"><Plus className="w-4 h-4" /> Add Account</button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc) => {
            const typeConfig = ACCOUNT_TYPES.find(t => t.value === acc.type);
            return (
              <div 
                key={acc.id} 
                onClick={() => openModal(acc)}
                className="card p-5 cursor-pointer card-hover group relative overflow-hidden"
              >
                <div 
                  className="absolute top-0 left-0 w-1.5 h-full opacity-80"
                  style={{ backgroundColor: acc.color || '#6366f1' }}
                />
                
                <div className="flex items-start justify-between mb-8 pl-2">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                      style={{ backgroundColor: `${acc.color || '#6366f1'}15` }}
                    >
                      {typeConfig?.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-[var(--text-primary)]">{acc.name}</h3>
                      <p className="text-xs text-[var(--text-secondary)]">{typeConfig?.label}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => handleDelete(acc.id, e)}
                      className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="pl-2">
                  <p className="text-sm font-medium text-[var(--text-secondary)] mb-1">Current Balance</p>
                  <p className={clsx(
                    "text-2xl font-bold",
                    acc.currentBalance < 0 ? "amount-negative" : "text-[var(--text-primary)]"
                  )}>
                    {formatCurrency(acc.currentBalance, acc.currency)}
                  </p>
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
          
          <div className="relative w-full max-w-md bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl shadow-xl p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">
                {editingId ? 'Edit Account' : 'New Account'}
              </h3>
              <button onClick={closeModal} className="p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="label">Account Name</label>
                <input
                  type="text"
                  className={clsx("input", errors.name && "input-error")}
                  placeholder="e.g. Main Bank, Cash Wallet"
                  {...register('name')}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Account Type</label>
                  <select className="input" {...register('type')}>
                    {ACCOUNT_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Currency</label>
                  <select className="input" {...register('currency')}>
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              {!editingId && (
                <div>
                  <label className="label">Opening Balance</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-[var(--text-secondary)]">
                      {currency === 'INR' ? '₹' : currency}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      className={clsx("input pl-10", errors.openingBalance && "input-error")}
                      placeholder="0.00"
                      {...register('openingBalance', { valueAsNumber: true })}
                    />
                  </div>
                  {errors.openingBalance && <p className="text-red-500 text-xs mt-1">{errors.openingBalance.message}</p>}
                  <p className="text-xs text-[var(--text-muted)] mt-1.5">You can enter a negative number for credit cards.</p>
                </div>
              )}

              <div>
                <label className="label">Color</label>
                <div className="flex flex-wrap gap-2">
                  {ACCOUNT_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setValue('color', color)}
                      className={clsx(
                        "w-8 h-8 rounded-full flex items-center justify-center transition-transform",
                        selectedColor === color && "ring-2 ring-offset-2 ring-[var(--bg-secondary)] scale-110"
                      )}
                      style={{ backgroundColor: color, boxShadow: selectedColor === color ? `0 0 0 4px ${color}` : 'none' }}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={add.isPending || update.isPending}
                className="btn-primary w-full h-11 mt-2"
              >
                {add.isPending || update.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingId ? 'Save Changes' : 'Create Account')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
