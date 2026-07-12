import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/api/client';

export type Pin = { key: string; label: string; description: string; emoji: string; earned: boolean };

export function usePins() {
  return useQuery({
    queryKey: ['pins'],
    queryFn: () => apiFetch<{ pins: Pin[] }>('/pins'),
  });
}

export type EarnedPin = { key: string; label: string; description: string; emoji: string };

export function useUserPins(userId: string | null) {
  return useQuery({
    queryKey: ['users', userId, 'pins'],
    queryFn: () => apiFetch<{ pins: EarnedPin[] }>(`/users/${userId}/pins`),
    enabled: !!userId,
  });
}
