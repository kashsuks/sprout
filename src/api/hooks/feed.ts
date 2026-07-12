import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/api/client';

export type FeedAuthor = { _id: string; username: string; displayName: string; avatarKey: string | null };

export type FeedEntry = {
  _id: string;
  userId: string;
  taskTitle: string;
  caption: string;
  stickerEmoji: string | null;
  photoUrl: string;
  pointsAwarded: number;
  localDate: string;
  author: FeedAuthor | null;
  likeCount: number;
  likedByMe: boolean;
};

type FeedResponse = { entries: FeedEntry[]; nextCursor: string | null };

export function useFeed(options?: { refetchInterval?: number | false }) {
  return useQuery({
    queryKey: ['feed'],
    queryFn: () => apiFetch<FeedResponse>('/feed', { query: { limit: 20 } }),
    refetchInterval: options?.refetchInterval,
  });
}

export type DuoCard = {
  _id: string;
  taskTitle: string;
  streak: number;
  names: [string | null, string | null];
  photos: [string | null, string | null];
  caption: string;
};

export function useFeedDuo() {
  return useQuery({
    queryKey: ['feed', 'duo'],
    queryFn: () => apiFetch<{ duo: DuoCard | null }>('/feed/duo'),
  });
}

// Toggling a like flips the heart immediately in the local ['feed'] cache
// (optimistic), fires the real request, and rolls just that one entry back
// if the request fails — the rest of the feed is untouched either way.
export function useToggleLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ entryId, like }: { entryId: string; like: boolean }) =>
      apiFetch<{ likeCount: number; likedByMe: boolean }>(`/feed/${entryId}/like`, {
        method: like ? 'POST' : 'DELETE',
      }),

    onMutate: async ({ entryId, like }) => {
      await queryClient.cancelQueries({ queryKey: ['feed'] });
      const previous = queryClient.getQueryData<FeedResponse>(['feed']);

      queryClient.setQueryData<FeedResponse | undefined>(['feed'], (old) => {
        if (!old) return old;
        return {
          ...old,
          entries: old.entries.map((e) =>
            e._id === entryId ? { ...e, likedByMe: like, likeCount: e.likeCount + (like ? 1 : -1) } : e
          ),
        };
      });

      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(['feed'], context.previous);
    },

    // No onSuccess invalidate on purpose — the server response and the
    // optimistic value should already match, and refetching here would
    // just cause a visible flicker for no benefit.
  });
}