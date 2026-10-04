import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  getInvestments,
  addInvestment,
  updateInvestment,
  deleteInvestment,
} from '@/services/investments';
import { InvestmentFormData } from '@/types';
import { useInvalidateFinance } from './useTransactions';
import toast from 'react-hot-toast';

export function useInvestments() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const invalidateFinance = useInvalidateFinance();

  const query = useQuery({
    queryKey: ['investments', user?.uid],
    queryFn: () => getInvestments(user!.uid),
    enabled: !!user,
    staleTime: 30_000,
  });

  const add = useMutation({
    mutationFn: (data: InvestmentFormData & { accountName?: string }) =>
      addInvestment(user!.uid, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['investments', user?.uid] });
      invalidateFinance();
      toast.success('Investment added');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to add investment'),
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InvestmentFormData> & { accountName?: string } }) =>
      updateInvestment(user!.uid, id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['investments', user?.uid] });
      invalidateFinance();
      toast.success('Investment updated');
    },
    onError: () => toast.error('Failed to update investment'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteInvestment(user!.uid, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['investments', user?.uid] });
      invalidateFinance();
      toast.success('Investment deleted');
    },
    onError: () => toast.error('Failed to delete investment'),
  });

  const totalInvested = query.data?.reduce((s, i) => s + i.amountInvested, 0) ?? 0;
  const totalCurrentValue = query.data?.reduce((s, i) => s + (i.currentValue ?? i.amountInvested), 0) ?? 0;

  return { ...query, add, update, remove, totalInvested, totalCurrentValue };
}
