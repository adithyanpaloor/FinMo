import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  getBudgetsForMonth,
  addBudget,
  updateBudget,
  deleteBudget,
} from '@/services/budgets';
import { Budget, BudgetFormData, BudgetWithSpent } from '@/types';
import { calculateBudgetUsage } from '@/utils/calculations';
import { useTransactionsByDateRange } from './useTransactions';
import { getMonthRange } from '@/utils/dates';
import toast from 'react-hot-toast';

export function useBudgets(month: number, year: number) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { start, end } = getMonthRange(month, year);

  const budgetQuery = useQuery({
    queryKey: ['budgets', user?.uid, month, year],
    queryFn: () => getBudgetsForMonth(user!.uid, month, year),
    enabled: !!user,
    staleTime: 30_000,
  });

  const txQuery = useTransactionsByDateRange(start, end);

  const budgetsWithSpent: BudgetWithSpent[] =
    (budgetQuery.data ?? []).map((b: Budget) => {
      const spent = (txQuery.data ?? [])
        .filter(
          (t) =>
            t.type === 'expense' &&
            (t.categoryId === b.categoryId || t.categoryName === b.categoryName)
        )
        .reduce((sum, t) => sum + t.amount, 0);

      const { remaining, percentageUsed, status } = calculateBudgetUsage(b.amount, spent);

      return { ...b, spent, remaining, percentageUsed, status };
    });

  const totalBudget = budgetsWithSpent.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgetsWithSpent.reduce((s, b) => s + b.spent, 0);

  const add = useMutation({
    mutationFn: (data: BudgetFormData) => addBudget(user!.uid, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budgets', user?.uid] });
      toast.success('Budget created');
    },
    onError: () => toast.error('Failed to create budget'),
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BudgetFormData> }) =>
      updateBudget(user!.uid, id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budgets', user?.uid] });
      toast.success('Budget updated');
    },
    onError: () => toast.error('Failed to update budget'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteBudget(user!.uid, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budgets', user?.uid] });
      toast.success('Budget deleted');
    },
    onError: () => toast.error('Failed to delete budget'),
  });

  return {
    budgets: budgetsWithSpent,
    isLoading: budgetQuery.isLoading || txQuery.isLoading,
    totalBudget,
    totalSpent,
    add,
    update,
    remove,
  };
}
