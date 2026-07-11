import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/api/client';

export type LinkableFriend = {
  _id: string;
  username: string;
  displayName: string;
  avatarKey: string | null;
  linked: boolean;
};

export function useLinkableFriends(taskTitle: string) {
  return useQuery({
    queryKey: ['duo', 'linkable-friends', taskTitle],
    queryFn: () => apiFetch<{ friends: LinkableFriend[] }>('/duo/linkable-friends', { query: { taskTitle } }),
    enabled: taskTitle.trim().length > 0,
  });
}

export type Duo = {
  _id: string;
  userAId: string;
  userBId: string;
  taskTitle: string;
  streak: number;
  active: boolean;
};

export function useActiveDuo() {
  return useQuery({
    queryKey: ['duo', 'active'],
    queryFn: () => apiFetch<{ duo: Duo | null }>('/duo/active'),
  });
}

export function useLinkDuo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { friendUserId: string; taskTitle: string; myGoalId: string }) =>
      apiFetch<{ duo: Duo }>('/duo', { method: 'POST', body: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['duo'] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}

export function useUnlinkDuo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/duo/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['duo'] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}
