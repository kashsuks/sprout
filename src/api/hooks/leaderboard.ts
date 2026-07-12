import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/api/client';

export type LeaderboardRow = {
  _id: string;
  username: string;
  displayName: string;
  avatarKey: string | null;
  points: number;
  currentStreak: number;
  todayPoints: number;
  me: boolean;
};

function todayLocalDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function useLeaderboard() {
  const localDate = todayLocalDate();
  return useQuery({
    queryKey: ['leaderboard', 'friends', localDate],
    queryFn: () => apiFetch<{ leaderboard: LeaderboardRow[] }>('/leaderboard/friends', { query: { localDate } }),
  });
}
