import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/api/client';
import { useAuthStore, type MongoUser } from '@/store/useAuthStore';
import type { Entry } from '@/api/hooks/entries';

// GET /users/:id trims the response down to just these fields when the
// target has friendsOnlyProfile on and the caller isn't a friend; otherwise
// the full set (bio/points/currentStreak/friendsOnlyProfile) is present.
export type PublicUser = {
  _id: string;
  username: string;
  displayName: string;
  avatarKey: string | null;
  bio?: string;
  points?: number;
  currentStreak?: number;
  friendsOnlyProfile?: boolean;
};

export function useUserProfile(id: string | null) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => apiFetch<{ user: PublicUser; limited: boolean }>(`/users/${id}`),
    enabled: !!id,
  });
}

export function useScrapbook(limit = 12) {
  return useQuery({
    queryKey: ['users', 'me', 'scrapbook', limit],
    queryFn: () => apiFetch<{ entries: Entry[]; nextCursor: string | null }>('/users/me/scrapbook', { query: { limit } }),
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
