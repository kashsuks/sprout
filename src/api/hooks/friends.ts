import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/api/client';

export type Friend = {
  _id: string;
  username: string;
  displayName: string;
  avatarKey: string | null;
  points: number;
  friendshipId: string;
};

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
  });
}

export type FriendRequest = { _id: string; userA: string; userB: string; requestedBy: string; status: string };

export function useIncomingRequests(options?: { refetchInterval?: number | false }) {
  return useQuery({
    queryKey: ['friends', 'requests', 'incoming'],
    queryFn: () => apiFetch<{ requests: FriendRequest[] }>('/friends/requests/incoming'),
    refetchInterval: options?.refetchInterval,
  });
}

export function useOutgoingRequests() {
  return useQuery({
    queryKey: ['friends', 'requests', 'outgoing'],
    queryFn: () => apiFetch<{ requests: FriendRequest[] }>('/friends/requests/outgoing'),
  });
}

function invalidateFriendState(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['friends'] });
}

export function useAcceptFriendRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (friendshipId: string) => apiFetch(`/friends/requests/${friendshipId}/accept`, { method: 'POST' }),
    onSuccess: () => invalidateFriendState(queryClient),
  });
}

export function useDeclineFriendRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (friendshipId: string) => apiFetch<void>(`/friends/requests/${friendshipId}/decline`, { method: 'POST' }),
    onSuccess: () => invalidateFriendState(queryClient),
  });
}

// Also doubles as "unblock" — the block endpoint reuses the same edge, and
// the server only lets whoever placed the block delete it.
export function useUnfriend() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (friendshipId: string) => apiFetch<void>(`/friends/${friendshipId}`, { method: 'DELETE' }),
    onSuccess: () => invalidateFriendState(queryClient),
  });
}

export function useBlockUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => apiFetch('/friends/block', { method: 'POST', body: { userId } }),
    onSuccess: () => invalidateFriendState(queryClient),
  });
}

export type BlockedUser = { _id: string; username: string; displayName: string; avatarKey: string | null; friendshipId: string };

export function useBlockedUsers() {
  return useQuery({
    queryKey: ['friends', 'blocked'],
    queryFn: () => apiFetch<{ blocked: BlockedUser[] }>('/friends/blocked'),
  });
}
