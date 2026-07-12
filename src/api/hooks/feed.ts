import { useQuery } from '@tanstack/react-query';
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
};

export function useFeed(options?: { refetchInterval?: number | false }) {
  return useQuery({
    queryKey: ['feed'],
    queryFn: () => apiFetch<{ entries: FeedEntry[]; nextCursor: string | null }>('/feed', { query: { limit: 20 } }),
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
