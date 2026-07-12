import { useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';

// Re-fetches whenever the screen regains focus (e.g. switching back to a
// tab) so data updates without needing a manual pull-to-refresh. Skips the
// very first focus since useQuery already fetches on mount.
export function useRefetchOnFocus(refetch: () => unknown) {
  const isFirst = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (isFirst.current) {
        isFirst.current = false;
        return;
      }
      refetch();
    }, [refetch])
  );
}
