import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/api/client';

export type LeaderboardRow = {
  rank: number;
  _id: string;
  username: string;
  displayName: string;
  avatarKey: string | null;
  points: number;
  me: boolean;
};

export function useLeaderboard() {
  return useQuery({
    queryKey: ['leaderboard', 'friends'],
    queryFn: () => apiFetch<{ leaderboard: LeaderboardRow[] }>('/leaderboard/friends'),
  });
}
