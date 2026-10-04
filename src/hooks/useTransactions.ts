import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getTransactions,
  getTransactionById,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  getRecentTransactions,
  getTransactionsByDateRange,
} from '@/services/transactions';
import { Transaction } from '@/types';
import toast from 'react-hot-toast';

const PAGE_SIZE = 50;

/** Invalidate everything that depends on transactions or account balances. */
export function useInvalidateFinance() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return () => {
    const uid = user?.uid;
    ['transactions', 'recent-transactions', 'transactions-range', 'accounts', 'investments'].forEach(
      (k) => qc.invalidateQueries({ queryKey: [k, uid] })
    );
  };
}

export function useTransactions(
  options: { startDate?: Date; endDate?: Date } = {},
  enabled = true
) {
  const { user } = useAuth();
  const invalidate = useInvalidateFinance();
  const [limitCount, setLimitCount] = useState(PAGE_SIZE);

  const query = useQuery({
    queryKey: ['transactions', user?.uid, options, limitCount],
    queryFn: () => getTransactions(user!.uid, { ...options, limitCount }),
    enabled: !!user && enabled,
    staleTime: 15_000,
    placeholderData: keepPreviousData,
  });

  const add = useMutation({
    mutationFn: (data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) =>
      addTransaction(user!.uid, data),
    onSuccess: () => {
      invalidate();
      toast.success('Transaction saved');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to save transaction'),
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Transaction> }) =>
      updateTransaction(user!.uid, id, data),
    onSuccess: () => {
      invalidate();
      toast.success('Transaction updated');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to update transaction'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteTransaction(user!.uid, id),
    onSuccess: () => {
      invalidate();
      toast.success('Transaction deleted');
    },
    onError: () => toast.error('Failed to delete transaction'),
  });

  return {
    transactions: query.data?.transactions ?? [],
    hasMore: query.data?.hasMore ?? false,
    loadMore: () => setLimitCount((n) => n + PAGE_SIZE),
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    add,
    update,
    remove,
  };
}

export function useTransaction(id?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['transaction', user?.uid, id],
    queryFn: () => getTransactionById(user!.uid, id!),
    enabled: !!user && !!id,
  });
}

export function useRecentTransactions(count = 10) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['recent-transactions', user?.uid, count],
    queryFn: () => getRecentTransactions(user!.uid, count),
    enabled: !!user,
    staleTime: 15_000,
  });
}

export function useTransactionsByDateRange(start: Date, end: Date) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['transactions-range', user?.uid, start.getTime(), end.getTime()],
    queryFn: () => getTransactionsByDateRange(user!.uid, start, end),
    enabled: !!user,
    staleTime: 30_000,
  });
}
