import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  getRecurringPayments,
  addRecurringPayment,
  updateRecurringPayment,
  deleteRecurringPayment,
  markRecurringAsPaid,
} from '@/services/recurringPayments';
import { RecurringPayment, RecurringFormData } from '@/types';
import toast from 'react-hot-toast';

export function useRecurringPayments() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['recurring', user?.uid],
    queryFn: () => getRecurringPayments(user!.uid),
    enabled: !!user,
    staleTime: 60_000,
  });

  const add = useMutation({
    mutationFn: (
      data: RecurringFormData & { accountName?: string; categoryIcon?: string }
    ) => addRecurringPayment(user!.uid, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recurring', user?.uid] });
      toast.success('Recurring payment added');
    },
    onError: () => toast.error('Failed to add recurring payment'),
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<RecurringFormData> }) =>
      updateRecurringPayment(user!.uid, id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recurring', user?.uid] });
      toast.success('Recurring payment updated');
    },
    onError: () => toast.error('Failed to update recurring payment'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteRecurringPayment(user!.uid, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recurring', user?.uid] });
      toast.success('Recurring payment deleted');
    },
    onError: () => toast.error('Failed to delete recurring payment'),
  });

  const markPaid = useMutation({
    mutationFn: (recurring: RecurringPayment) =>
      markRecurringAsPaid(user!.uid, recurring),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recurring', user?.uid] });
      toast.success('Marked as paid — next date updated');
    },
    onError: () => toast.error('Failed to mark as paid'),
  });

  return { ...query, add, update, remove, markPaid };
}
