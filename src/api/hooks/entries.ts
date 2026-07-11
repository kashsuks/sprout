import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/api/client';

export type Entry = {
  _id: string;
  userId: string;
  goalId: string;
  taskTitle: string;
  caption: string;
  stickerEmoji: string | null;
  photoKey: string;
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

// Orchestrates the full stamp flow: get a presigned upload URL, PUT the
// photo bytes directly to storage, then create the entry. Any step failing
// (most likely the upload-url request, since DigitalOcean Spaces isn't
// configured in every environment) rejects with a message the UI can show.
export function useCompleteGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CompleteGoalInput) => {
      const { uploadUrl, photoKey } = await apiFetch<{ uploadUrl: string; photoKey: string }>('/entries/upload-url', {
        method: 'POST',
        body: { contentType: input.contentType },
      });

      const photoBlob = await (await fetch(input.photoUri)).blob();
      const putRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': input.contentType },
        body: photoBlob,
      });
      if (!putRes.ok) throw new Error('Photo upload failed');

      return apiFetch<{ entry: Entry; user: { points: number; currency: number; currentStreak: number }; newlyEarnedPins: string[] }>(
        '/entries',
        {
          method: 'POST',
          body: {
            goalId: input.goalId,
            photoKey,
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
