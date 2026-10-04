import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  getGoals,
  addGoal,
  updateGoal,
  deleteGoal,
  contributeToGoal,
} from '@/services/goals';
import { GoalFormData } from '@/types';
import toast from 'react-hot-toast';

export function useGoals() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['goals', user?.uid],
    queryFn: () => getGoals(user!.uid),
    enabled: !!user,
    staleTime: 30_000,
  });

  const add = useMutation({
    mutationFn: (data: GoalFormData) => addGoal(user!.uid, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals', user?.uid] });
      toast.success('Goal created');
    },
    onError: () => toast.error('Failed to create goal'),
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<GoalFormData> }) =>
      updateGoal(user!.uid, id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals', user?.uid] });
      toast.success('Goal updated');
    },
    onError: () => toast.error('Failed to update goal'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteGoal(user!.uid, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals', user?.uid] });
      toast.success('Goal deleted');
    },
    onError: () => toast.error('Failed to delete goal'),
  });

  const contribute = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) =>
      contributeToGoal(user!.uid, id, amount),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals', user?.uid] });
      toast.success('Goal updated');
    },
    onError: () => toast.error('Failed to update goal'),
  });

  return { ...query, add, update, remove, contribute };
}
