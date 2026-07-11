import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/api/client';

export type Friend = { _id: string; username: string; displayName: string; avatarKey: string | null; points: number };

export function useFriends() {
  return useQuery({
    queryKey: ['friends'],
    queryFn: () => apiFetch<{ friends: Friend[] }>('/friends'),
  });
}

export type FriendSearchResult = {
  _id: string;
  username: string;
  displayName: string;
  avatarKey: string | null;
  status: 'none' | 'friends' | 'pending_outgoing' | 'pending_incoming';
};

export function useFriendSearch(query: string) {
  return useQuery({
    queryKey: ['friends', 'search', query],
    queryFn: () => apiFetch<{ users: FriendSearchResult[] }>('/friends/search', { query: { q: query } }),
    enabled: query.trim().length > 0,
  });
}

export function useSendFriendRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (toUserId: string) => apiFetch('/friends/requests', { method: 'POST', body: { toUserId } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['friends'] }),
  });
}
