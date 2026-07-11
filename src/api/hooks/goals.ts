import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/api/client';

export type Recurrence = { type: 'daily' | 'weekly' | 'once'; daysOfWeek?: number[] };

export type Goal = {
  _id: string;
  userId: string;
  title: string;
  icon: string | null;
  source: 'recommended' | 'custom';
  recurrence: Recurrence;
  dueTime: string | null;
  timezone: string;
  active: boolean;
  duoId: string | null;
};

export type GoalToday = Goal & { completed: boolean };

function todayLocalDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function useGoals() {
  return useQuery({
    queryKey: ['goals', 'all'],
    queryFn: () => apiFetch<{ goals: Goal[] }>('/goals'),
  });
}

export function useGoalsToday() {
  const localDate = todayLocalDate();
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return useQuery<{ goals: GoalToday[]; localDate: string }>({
    queryKey: ['goals', 'today', localDate],
    queryFn: () => apiFetch('/goals/today', { query: { localDate, tz } }),
  });
}

type CreateGoalInput = {
  title: string;
  icon?: string | null;
  source: 'recommended' | 'custom';
  recurrence: Recurrence;
  dueTime?: string | null;
};

export function useCreateGoal() {
  const queryClient = useQueryClient();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return useMutation({
    mutationFn: (input: CreateGoalInput) =>
      apiFetch<{ goal: Goal }>('/goals', { method: 'POST', body: { ...input, timezone } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/goals/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
  });
}
