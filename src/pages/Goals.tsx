import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useGoals } from '@/hooks/useGoals';
import { goalSchema, GoalFormValues } from '@/utils/validation';
import { formatCurrency, formatPercentage } from '@/utils/currency';
import { toInputDate } from '@/utils/dates';
import { useAuth } from '@/contexts/AuthContext';
import { Target, Plus, Edit2, Trash2, Loader2, X, TrendingUp } from 'lucide-react';
import EmptyState from '@/components/common/EmptyState';
import LoadingScreen from '@/components/common/LoadingScreen';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

export default function Goals() {
  const { currency } = useAuth();
  const { data: goals = [], isLoading, add, update, remove, contribute } = useGoals();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [contributionAmount, setContributionAmount] = useState<string>('');

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: { currentAmount: 0, icon: '🎯', color: '#6366f1' }
  });

  const openModal = (g?: any) => {
    if (g) {
      setEditingId(g.id);
      reset({
        name: g.name,
        targetAmount: g.targetAmount,
        currentAmount: g.currentAmount,
        deadline: toInputDate(g.deadline),
        description: g.description,
        icon: g.icon || '🎯',
        color: g.color || '#6366f1',
      });
    } else {
      setEditingId(null);
      reset({ name: '', targetAmount: undefined as any, currentAmount: 0, description: '', icon: '🎯', color: '#6366f1' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => { setEditingId(null); reset(); }, 200);
  };

  const onSubmit = async (data: GoalFormValues) => {
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
    if (confirm('Are you sure you want to delete this goal?')) {
      await remove.mutateAsync(id);
    }
  };

  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal || !contributionAmount) return;
    
    try {
      await contribute.mutateAsync({ id: selectedGoal.id, amount: parseFloat(contributionAmount) });
      setIsContributeModalOpen(false);
      setContributionAmount('');
      setSelectedGoal(null);
    } catch (e) {
      // Error handled by mutation
    }
  };

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Financial Goals</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Track your savings progress towards big purchases
          </p>
        </div>
        
        <button onClick={() => openModal()} className="btn-primary">
          <Plus className="w-4 h-4" />
          Create Goal
        </button>
      </div>

      {goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No goals yet"
          description="Create a financial goal to start tracking your savings."
          action={<button onClick={() => openModal()} className="btn-primary"><Plus className="w-4 h-4" /> Create Goal</button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((g) => {
            const progress = Math.min((g.currentAmount / g.targetAmount) * 100, 100);
            
            return (
              <div 
                key={g.id}
                onClick={() => openModal(g)}
                className="card p-5 cursor-pointer card-hover group relative overflow-hidden"
              >
                <div 
                  className="absolute top-0 left-0 w-1.5 h-full opacity-80"
                  style={{ backgroundColor: g.color || '#6366f1' }}
                />
                
                <div className="flex items-start justify-between mb-6 pl-2">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                      style={{ backgroundColor: `${g.color || '#6366f1'}15` }}
                    >
                      {g.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-[var(--text-primary)]">{g.name}</h3>
                      {g.description && <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-1">{g.description}</p>}
                    </div>
                  </div>
                  
                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedGoal(g);
                        setIsContributeModalOpen(true);
                      }}
                      className="p-1.5 mr-1 text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/30 rounded-lg transition-colors"
                      title="Add funds"
                    >
                      <TrendingUp className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => handleDelete(g.id, e)}
                      className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="pl-2">
                  <div className="flex items-end justify-between mb-2">
                    <div>
                      <p className="text-2xl font-bold text-[var(--text-primary)]">
                        {formatCurrency(g.currentAmount, currency)}
                      </p>
                      <p className="text-xs font-medium text-[var(--text-muted)] mt-1">
                        of {formatCurrency(g.targetAmount, currency)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold" style={{ color: g.color || '#6366f1' }}>
                        {formatPercentage(progress)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="progress-bar mt-3 h-2">
                    <div 
                      className="progress-fill"
                      style={{ width: `${progress}%`, backgroundColor: g.color || '#6366f1' }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Goal Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={closeModal} />
          
          <div className="relative w-full max-w-md bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl shadow-xl p-6 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">
                {editingId ? 'Edit Goal' : 'New Goal'}
              </h3>
              <button onClick={closeModal} className="p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="label">Goal Name</label>
                <input
                  type="text"
                  className={clsx("input", errors.name && "input-error")}
                  placeholder="e.g. Emergency Fund, New Car"
                  {...register('name')}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="label">Target Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-[var(--text-secondary)]">
                    {currency === 'INR' ? '₹' : currency}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    className={clsx("input pl-10", errors.targetAmount && "input-error")}
                    placeholder="0.00"
                    {...register('targetAmount', { valueAsNumber: true })}
                  />
                </div>
                {errors.targetAmount && <p className="text-red-500 text-xs mt-1">{errors.targetAmount.message}</p>}
              </div>

              {!editingId && (
                <div>
                  <label className="label">Starting Amount (Optional)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-[var(--text-secondary)]">
                      {currency === 'INR' ? '₹' : currency}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      className={clsx("input pl-10", errors.currentAmount && "input-error")}
                      placeholder="0.00"
                      {...register('currentAmount', { valueAsNumber: true })}
                    />
                  </div>
                  {errors.currentAmount && <p className="text-red-500 text-xs mt-1">{errors.currentAmount.message}</p>}
                </div>
              )}

              <div>
                <label className="label">Icon (Emoji)</label>
                <input
                  type="text"
                  className={clsx("input", errors.icon && "input-error")}
                  placeholder="🎯"
                  {...register('icon')}
                />
              </div>

              <div>
                <label className="label">Description (Optional)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Why are you saving for this?"
                  {...register('description')}
                />
              </div>

              <button
                type="submit"
                disabled={add.isPending || update.isPending}
                className="btn-primary w-full h-11 mt-2"
              >
                {add.isPending || update.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingId ? 'Save Changes' : 'Create Goal')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Contribute Modal */}
      {isContributeModalOpen && selectedGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setIsContributeModalOpen(false)} />
          
          <div className="relative w-full max-w-sm bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl shadow-xl p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Update Progress</h3>
              <button onClick={() => setIsContributeModalOpen(false)} className="p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Add or withdraw funds from <span className="font-bold text-[var(--text-primary)]">{selectedGoal.name}</span>.
              <br />
              <span className="text-xs text-[var(--text-muted)]">Use a negative number to withdraw.</span>
            </p>

            <form onSubmit={handleContribute} className="space-y-4">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-[var(--text-secondary)]">
                  {currency === 'INR' ? '₹' : currency}
                </span>
                <input
                  type="number"
                  step="0.01"
                  required
                  className="input pl-10"
                  placeholder="Amount"
                  value={contributionAmount}
                  onChange={(e) => setContributionAmount(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={contribute.isPending || !contributionAmount}
                className="btn-primary w-full h-11"
              >
                {contribute.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Goal'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
