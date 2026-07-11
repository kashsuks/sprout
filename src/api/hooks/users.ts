import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/api/client';
import { useAuthStore, type MongoUser } from '@/store/useAuthStore';
import type { Entry } from '@/api/hooks/entries';

export type PublicUser = { _id: string; username: string; displayName: string; avatarKey: string | null };

export function useUserProfile(id: string | null) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => apiFetch<{ user: PublicUser }>(`/users/${id}`),
    enabled: !!id,
  });
}

export function useScrapbook() {
  return useQuery({
    queryKey: ['users', 'me', 'scrapbook'],
    queryFn: () => apiFetch<{ entries: Entry[]; nextCursor: string | null }>('/users/me/scrapbook', { query: { limit: 12 } }),
  });
}

export function useUpdatePrivacy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (friendsOnlyProfile: boolean) =>
      apiFetch<{ user: MongoUser }>('/users/me', { method: 'PATCH', body: { friendsOnlyProfile } }),
    onSuccess: (data) => {
      useAuthStore.setState({ mongoUser: data.user });
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}
