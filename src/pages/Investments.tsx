import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useInvestments } from '@/hooks/useInvestments';
import { useAccounts } from '@/hooks/useAccounts';
import { investmentSchema, InvestmentFormValues } from '@/utils/validation';
import { formatCurrency, formatPercentage } from '@/utils/currency';
import { INVESTMENT_TYPES } from '@/utils/constants';
import { useAuth } from '@/contexts/AuthContext';
import { TrendingUp, Plus, Edit2, Trash2, Loader2, X, PieChart } from 'lucide-react';
import EmptyState from '@/components/common/EmptyState';
import LoadingScreen from '@/components/common/LoadingScreen';
import { toTimestamp, todayInputValue, toInputDate } from '@/utils/dates';
import { clsx } from 'clsx';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function Investments() {
  const { currency } = useAuth();
  const { data: investments = [], isLoading, add, update, remove, totalInvested, totalCurrentValue } = useInvestments();
  const { data: accounts = [] } = useAccounts();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<InvestmentFormValues>({
    resolver: zodResolver(investmentSchema),
    defaultValues: { type: 'mutual_fund', date: todayInputValue() }
  });

  const openModal = (inv?: any) => {
    if (inv) {
      setEditingId(inv.id);
      reset({
        name: inv.name,
        type: inv.type,
        amountInvested: inv.amountInvested,
        currentValue: inv.currentValue,
        date: inv.date ? toInputDate(inv.date) : todayInputValue(),
        accountId: inv.accountId,
        notes: inv.notes,
      });
    } else {
      setEditingId(null);
      reset({ 
        name: '', 
        type: 'mutual_fund', 
        amountInvested: undefined as any, 
        currentValue: undefined as any,
        date: todayInputValue(),
        accountId: accounts.length > 0 ? accounts[0].id : '',
        notes: ''
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => { setEditingId(null); reset(); }, 200);
  };

  const onSubmit = async (data: InvestmentFormValues) => {
    try {
      const account = accounts.find(a => a.id === data.accountId);
      const submissionData = { ...data, accountName: account?.name };
      
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
    if (confirm('Delete this investment? Its linked transaction is removed too and the amount is refunded to the account.')) {
      await remove.mutateAsync(id);
    }
  };

  // Prepare allocation data
  const allocationMap = new Map<string, { name: string; value: number; color: string }>();
  const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
  
  investments.forEach((inv) => {
    const type = INVESTMENT_TYPES.find(t => t.value === inv.type);
    if (!type) return;
    
    const existing = allocationMap.get(inv.type);
    const value = inv.currentValue || inv.amountInvested;
    
    if (existing) {
      existing.value += value;
    } else {
      allocationMap.set(inv.type, {
        name: type.label,
        value,
        color: colors[allocationMap.size % colors.length]
      });
    }
  });
  
  const allocationData = Array.from(allocationMap.values()).sort((a, b) => b.value - a.value);

  const totalReturn = totalCurrentValue - totalInvested;
  const returnPercentage = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Investments</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Track your portfolio and manual investments
          </p>
        </div>
        <button onClick={() => openModal()} className="btn-primary">
          <Plus className="w-4 h-4" />
          Add Investment
        </button>
      </div>

      {investments.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="No investments tracked"
          description="Add your mutual funds, stocks, or other investments to see your portfolio overview."
          action={<button onClick={() => openModal()} className="btn-primary"><Plus className="w-4 h-4" /> Add Investment</button>}
        />
      ) : (
        <>
          {/* Portfolio Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="card p-6 flex flex-col justify-center">
                <p className="text-sm font-medium text-[var(--text-secondary)] mb-1">Total Portfolio Value</p>
                <p className="text-3xl font-bold text-[var(--text-primary)]">
                  {formatCurrency(totalCurrentValue, currency)}
                </p>
                <div className="mt-4 pt-4 border-t border-[var(--border)] flex justify-between items-center">
                  <span className="text-sm text-[var(--text-secondary)]">Total Invested</span>
                  <span className="font-semibold text-[var(--text-primary)]">{formatCurrency(totalInvested, currency)}</span>
                </div>
              </div>
              
              <div className="card p-6 flex flex-col justify-center">
                <p className="text-sm font-medium text-[var(--text-secondary)] mb-1">Overall Return</p>
                <div className="flex items-baseline gap-3">
                  <p className={clsx("text-3xl font-bold", totalReturn >= 0 ? "text-green-500" : "text-red-500")}>
                    {formatCurrency(totalReturn, currency, { showSign: true })}
                  </p>
                  <p className={clsx("font-semibold text-lg", totalReturn >= 0 ? "text-green-500" : "text-red-500")}>
                    {totalReturn >= 0 ? '↑' : '↓'} {Math.abs(returnPercentage).toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-5">
              <h3 className="text-sm font-bold mb-4 text-[var(--text-primary)]">Asset Allocation</h3>
              <div className="h-[150px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={allocationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {allocationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => formatCurrency(Number(value), currency)}
                      contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)', borderRadius: '8px' }}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 space-y-1.5">
                {allocationData.map((data) => (
                  <div key={data.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
                      <span className="text-[var(--text-secondary)]">{data.name}</span>
                    </div>
                    <span className="font-medium text-[var(--text-primary)]">
                      {formatPercentage((data.value / totalCurrentValue) * 100)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Investment List */}
          <h3 className="text-lg font-bold text-[var(--text-primary)] mt-8 mb-4">Holdings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {investments.map((inv) => {
              const typeConfig = INVESTMENT_TYPES.find(t => t.value === inv.type);
              const currentValue = inv.currentValue ?? inv.amountInvested;
              const returnAmt = currentValue - inv.amountInvested;
              const returnPct = (returnAmt / inv.amountInvested) * 100;

              return (
                <div key={inv.id} onClick={() => openModal(inv)} className="card p-5 cursor-pointer card-hover group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center text-xl">
                        {typeConfig?.icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-[var(--text-primary)]">{inv.name}</h3>
                        <p className="text-xs text-[var(--text-secondary)]">{typeConfig?.label} • {inv.accountName}</p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={(e) => handleDelete(inv.id, e)}
                      className="p-1.5 opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm text-[var(--text-secondary)]">Current Value</span>
                      <span className="text-lg font-bold text-[var(--text-primary)]">
                        {formatCurrency(currentValue, currency)}
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline border-t border-[var(--border)] pt-2">
                      <span className="text-xs text-[var(--text-secondary)]">Invested</span>
                      <span className="text-sm font-semibold text-[var(--text-primary)]">
                        {formatCurrency(inv.amountInvested, currency)}
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-[var(--text-secondary)]">Return</span>
                      <span className={clsx("text-sm font-bold", returnAmt >= 0 ? "text-green-500" : "text-red-500")}>
                        {returnAmt >= 0 ? '+' : ''}{formatCurrency(returnAmt, currency)} ({returnPct.toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={closeModal} />
          
          <div className="relative w-full max-w-md bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl shadow-xl p-6 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">
                {editingId ? 'Edit Investment' : 'New Investment'}
              </h3>
              <button onClick={closeModal} className="p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="label">Investment Name</label>
                <input
                  type="text"
                  className={clsx("input", errors.name && "input-error")}
                  placeholder="e.g. S&P 500 ETF, Gold Coin"
                  {...register('name')}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Type</label>
                  <select className="input" {...register('type')}>
                    {INVESTMENT_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Date</label>
                  <input
                    type="date"
                    className="input"
                    {...register('date')}
                  />
                </div>
              </div>

              <div>
                <label className="label">Amount Invested</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-[var(--text-secondary)]">
                    {currency === 'INR' ? '₹' : currency}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    className={clsx("input pl-10", errors.amountInvested && "input-error")}
                    placeholder="0.00"
                    {...register('amountInvested', { valueAsNumber: true })}
                  />
                </div>
                {errors.amountInvested && <p className="text-red-500 text-xs mt-1">{errors.amountInvested.message}</p>}
              </div>

              <div>
                <label className="label">Current Value (Optional)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-[var(--text-secondary)]">
                    {currency === 'INR' ? '₹' : currency}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    className="input pl-10"
                    placeholder="Same as invested if empty"
                    {...register('currentValue', { setValueAs: (v) => (v === '' || v == null || isNaN(Number(v)) ? undefined : Number(v)) })}
                  />
                </div>
              </div>

              <div>
                <label className="label">Source Account</label>
                <select 
                  className={clsx("input", errors.accountId && "input-error")}
                  {...register('accountId')}
                >
                  <option value="">Select account...</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
                {errors.accountId && <p className="text-red-500 text-xs mt-1">{errors.accountId.message}</p>}
              </div>

              <div>
                <label className="label">Notes (Optional)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Additional details..."
                  {...register('notes')}
                />
              </div>

              <button
                type="submit"
                disabled={add.isPending || update.isPending}
                className="btn-primary w-full h-11 mt-2"
              >
                {add.isPending || update.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingId ? 'Save Changes' : 'Add Investment')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
