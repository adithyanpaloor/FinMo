import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  getAccounts,
  addAccount,
  updateAccount,
  deleteAccount,
} from '@/services/accounts';
import { AccountFormData } from '@/types';
import toast from 'react-hot-toast';

export function useAccounts() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['accounts', user?.uid],
    queryFn: () => getAccounts(user!.uid),
    enabled: !!user,
    staleTime: 30_000,
  });

  const add = useMutation({
    mutationFn: (data: AccountFormData) => addAccount(user!.uid, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts', user?.uid] });
      toast.success('Account created');
    },
    onError: () => toast.error('Failed to create account'),
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AccountFormData> }) =>
      updateAccount(user!.uid, id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts', user?.uid] });
      toast.success('Account updated');
    },
    onError: () => toast.error('Failed to update account'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteAccount(user!.uid, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts', user?.uid] });
      toast.success('Account deleted');
    },
    onError: () => toast.error('Failed to delete account'),
  });

  const totalBalance =
    query.data?.reduce((sum, acc) => sum + acc.currentBalance, 0) ?? 0;

  return { ...query, add, update, remove, totalBalance };
}
