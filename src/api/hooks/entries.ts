import * as FileSystem from 'expo-file-system';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/api/client';

export type Entry = {
  _id: string;
  userId: string;
  goalId: string;
  taskTitle: string;
  caption: string;
  stickerEmoji: string | null;
  photoUrl: string;
  pointsAwarded: number;
  localDate: string;
};

type CompleteGoalInput = {
  goalId: string;
  photoUri: string;
  contentType: 'image/jpeg' | 'image/png';
  caption?: string;
  stickerEmoji?: string | null;
};

function todayLocalDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Photos are stored inline in Mongo (base64), so completing a goal is a
// single request: read the local photo file as base64 and post it straight
// to /entries alongside the rest of the completion payload.
export function useCompleteGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CompleteGoalInput) => {
      const photoData = await FileSystem.readAsStringAsync(input.photoUri, { encoding: FileSystem.EncodingType.Base64 });

      return apiFetch<{ entry: Entry; user: { points: number; currency: number; currentStreak: number }; newlyEarnedPins: string[] }>(
        '/entries',
        {
          method: 'POST',
          body: {
            goalId: input.goalId,
            photoData,
            photoContentType: input.contentType,
            caption: input.caption ?? '',
            stickerEmoji: input.stickerEmoji ?? null,
            localDate: todayLocalDate(),
          },
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['pins'] });
    },
  });
}
