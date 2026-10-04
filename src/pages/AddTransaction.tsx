import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTransactions, useTransaction } from '@/hooks/useTransactions';
import { useAccounts } from '@/hooks/useAccounts';
import { useAuth } from '@/contexts/AuthContext';
import { transactionSchema, TransactionFormValues } from '@/utils/validation';
import { todayInputValue, toTimestamp, toInputDate } from '@/utils/dates';
import { getCurrencySymbol } from '@/utils/currency';
import { ALL_CATEGORIES, getCategoryById } from '@/utils/constants';
import { uploadReceipt } from '@/services/transactions';
import { ArrowLeft, Loader2, Image as ImageIcon, X, ExternalLink } from 'lucide-react';
import LoadingScreen from '@/components/common/LoadingScreen';
import EmptyState from '@/components/common/EmptyState';
import { Landmark } from 'lucide-react';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

type Tab = 'expense' | 'income' | 'transfer' | 'investment';

export default function AddTransaction() {
  const navigate = useNavigate();
  const { id: editId } = useParams<{ id: string }>();
  const isEdit = !!editId;
  const { user, currency } = useAuth();
  const symbol = getCurrencySymbol(currency);

  const { add, update } = useTransactions({}, false);
  const { data: accounts = [], isLoading: accountsLoading } = useAccounts();
  const { data: existing, isLoading: existingLoading } = useTransaction(editId);

  const [activeTab, setActiveTab] = useState<Tab>('expense');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    getValues,
    reset,
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'expense',
      amount: undefined,
      date: todayInputValue(),
      accountId: '',
      isRecurring: false,
    },
  });

  // Default the account once accounts have loaded (they arrive after first render).
  useEffect(() => {
    if (!isEdit && accounts.length > 0 && !getValues('accountId')) {
      setValue('accountId', accounts[0].id);
    }
  }, [accounts, isEdit, getValues, setValue]);

  // Populate the form when editing.
  useEffect(() => {
    if (!existing) return;
    setActiveTab(existing.type);
    reset({
      type: existing.type,
      amount: existing.amount,
      categoryId: existing.categoryId ?? '',
      merchant: existing.merchant ?? '',
      description: existing.description ?? '',
      accountId: existing.accountId,
      toAccountId: existing.toAccountId ?? '',
      paymentMethod: existing.paymentMethod ?? '',
      date: toInputDate(existing.date),
      isRecurring: existing.isRecurring ?? false,
    });
  }, [existing, reset]);

  const onSubmit = async (data: TransactionFormValues) => {
    try {
      setSaving(true);
      const category = data.categoryId ? getCategoryById(data.categoryId) : undefined;
      const account = accounts.find((a) => a.id === data.accountId);
      const toAccount =
        data.type === 'transfer' && data.toAccountId
          ? accounts.find((a) => a.id === data.toAccountId)
          : undefined;

      const payload = {
        type: data.type,
        amount: data.amount,
        categoryId: category?.id,
        categoryName: category?.name,
        categoryIcon: category?.icon,
        categoryColor: category?.color,
        merchant: data.merchant || undefined,
        description: data.description || undefined,
        accountId: data.accountId,
        accountName: account?.name,
        toAccountId: data.type === 'transfer' ? data.toAccountId : undefined,
        toAccountName: toAccount?.name,
        paymentMethod: data.paymentMethod || undefined,
        date: toTimestamp(data.date),
        isRecurring: data.isRecurring,
      };

      let txId = editId;
      if (isEdit && editId) {
        await update.mutateAsync({ id: editId, data: payload });
      } else {
        txId = await add.mutateAsync(payload);
      }

      if (receiptFile && txId && user) {
        try {
          await uploadReceipt(user.uid, txId, receiptFile);
          toast.success('Receipt attached');
        } catch (e) {
          toast.error((e as Error).message || 'Transaction saved, but receipt upload failed');
        }
      }

      if (isEdit) {
        navigate('/transactions');
      } else {
        // keep account/date/type for quick consecutive entry
        reset({ ...data, amount: undefined as unknown as number, merchant: '', description: '' });
        setReceiptFile(null);
      }
    } catch {
      // errors are surfaced by the mutations
    } finally {
      setSaving(false);
    }
  };

  const handleTabChange = (type: Tab) => {
    setActiveTab(type);
    setValue('type', type);
    setValue('categoryId', '');
    if (type !== 'transfer') setValue('toAccountId', '');
  };

  const pickReceipt = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }
    setReceiptFile(file);
    e.target.value = '';
  };

  if (accountsLoading || (isEdit && existingLoading)) return <LoadingScreen />;

  if (isEdit && !existing) {
    return (
      <EmptyState
        icon={Landmark}
        title="Transaction not found"
        description="It may have been deleted."
        action={<button className="btn-primary btn-md" onClick={() => navigate('/transactions')}>Back to transactions</button>}
      />
    );
  }

  if (!isEdit && accounts.length === 0) {
    return (
      <EmptyState
        icon={Landmark}
        title="Create an account first"
        description="Transactions belong to an account (cash, bank, UPI…). Add one to get started."
        action={<button className="btn-primary btn-md" onClick={() => navigate('/accounts')}>Add account</button>}
      />
    );
  }

  const tabs: Tab[] = isEdit
    ? [activeTab]
    : ['expense', 'income', 'transfer'];
  const categories = ALL_CATEGORIES.filter(
    (c) => c.type === (activeTab === 'expense' ? 'expense' : 'income')
  );
  const showCategory = activeTab === 'expense' || activeTab === 'income';
  const busy = saving || add.isPending || update.isPending;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-[var(--bg-secondary)] transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-6 h-6 text-[var(--text-primary)]" />
        </button>
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">
          {isEdit ? 'Edit Transaction' : 'Add Transaction'}
        </h2>
      </div>

      <div className="card p-6">
        <div className="flex p-1 bg-[var(--bg-primary)] rounded-xl mb-8">
          {tabs.map((type) => (
            <button
              key={type}
              type="button"
              disabled={isEdit}
              onClick={() => handleTabChange(type)}
              className={clsx(
                'flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all',
                activeTab === type
                  ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              )}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <input type="hidden" {...register('type')} />

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-[var(--text-primary)]">
                {symbol}
              </span>
              <input
                type="number"
                step="0.01"
                inputMode="decimal"
                autoFocus
                className={clsx(
                  'w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-2xl pl-12 pr-4 py-4 text-3xl font-bold text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all',
                  errors.amount && 'border-red-500'
                )}
                placeholder="0.00"
                {...register('amount', { valueAsNumber: true })}
              />
            </div>
            {errors.amount && (
              <p className="text-red-500 text-xs mt-1.5">
                {Number.isNaN(getValues('amount')) || getValues('amount') === undefined
                  ? 'Enter an amount'
                  : errors.amount.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {activeTab !== 'transfer' && (
              <div>
                <label className="label">
                  {activeTab === 'expense'
                    ? 'Where / Merchant'
                    : activeTab === 'income'
                    ? 'Source'
                    : 'Name'}
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder={activeTab === 'expense' ? 'e.g. Starbucks, Uber' : 'e.g. Google, Client X'}
                  {...register('merchant')}
                />
              </div>
            )}

            {showCategory && (
              <div>
                <label className="label">Category</label>
                <select
                  className={clsx('input', errors.categoryId && 'input-error')}
                  {...register('categoryId')}
                >
                  <option value="">Select category...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && (
                  <p className="text-red-500 text-xs mt-1.5">{errors.categoryId.message}</p>
                )}
              </div>
            )}

            <div>
              <label className="label">{activeTab === 'transfer' ? 'From Account' : 'Account'}</label>
              <select
                className={clsx('input', errors.accountId && 'input-error')}
                {...register('accountId')}
              >
                <option value="">Select account...</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({symbol}
                    {a.currentBalance.toLocaleString()})
                  </option>
                ))}
              </select>
              {errors.accountId && (
                <p className="text-red-500 text-xs mt-1.5">{errors.accountId.message}</p>
              )}
            </div>

            {activeTab === 'transfer' && (
              <div>
                <label className="label">To Account</label>
                <select
                  className={clsx('input', errors.toAccountId && 'input-error')}
                  {...register('toAccountId')}
                >
                  <option value="">Select destination...</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({symbol}
                      {a.currentBalance.toLocaleString()})
                    </option>
                  ))}
                </select>
                {errors.toAccountId && (
                  <p className="text-red-500 text-xs mt-1.5">{errors.toAccountId.message}</p>
                )}
              </div>
            )}

            <div>
              <label className="label">Date</label>
              <input
                type="date"
                className={clsx('input', errors.date && 'input-error')}
                {...register('date')}
              />
              {errors.date && <p className="text-red-500 text-xs mt-1.5">{errors.date.message}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="label">Note (Optional)</label>
              <input
                type="text"
                className="input"
                placeholder="What was this for?"
                {...register('description')}
              />
            </div>
          </div>

          {/* Receipt */}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            onChange={pickReceipt}
          />
          {(receiptFile || existing?.receiptUrl) && (
            <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-sm">
              <div className="flex items-center gap-2 min-w-0 text-[var(--text-primary)]">
                <ImageIcon className="w-4 h-4 shrink-0" />
                <span className="truncate">{receiptFile ? receiptFile.name : 'Receipt attached'}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!receiptFile && existing?.receiptUrl && (
                  <a
                    href={existing.receiptUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand-500 hover:underline inline-flex items-center gap-1"
                  >
                    View <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {receiptFile && (
                  <button
                    type="button"
                    onClick={() => setReceiptFile(null)}
                    aria-label="Remove receipt"
                    className="text-[var(--text-muted)] hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-[var(--border)] flex flex-col sm:flex-row gap-4">
            {activeTab !== 'transfer' && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="btn-secondary flex-1 py-3"
              >
                <ImageIcon className="w-5 h-5" />
                {receiptFile || existing?.receiptUrl ? 'Replace Receipt' : 'Add Receipt'}
              </button>
            )}
            <button type="submit" disabled={busy} className="btn-primary flex-[2] py-3 text-base">
              {busy ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isEdit ? (
                'Save Changes'
              ) : (
                `Save ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
