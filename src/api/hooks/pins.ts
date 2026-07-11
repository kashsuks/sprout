import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/api/client';

export type Pin = { key: string; label: string; description: string; emoji: string; earned: boolean };

export function usePins() {
  return useQuery({
    queryKey: ['pins'],
    queryFn: () => apiFetch<{ pins: Pin[] }>('/pins'),
  });
}
