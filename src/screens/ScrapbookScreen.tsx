import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Image, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/theme/colors';
import { fonts, textStyles } from '@/theme/typography';
import { Screen } from '@/components/Screen';
import { useScrapbook } from '@/api/hooks/users';
import type { Entry } from '@/api/hooks/entries';
import { bucketByWeek, splitColumns, weekLabel } from '@/utils/scrapbookWeeks';

type ScrapbookContentProps = {
  onClose: () => void;
  hiddenEntryIds?: Set<string>;
  registerTileRef?: (entryId: string, ref: View | null) => void;
};

export function ScrapbookContent({ onClose, hiddenEntryIds, registerTileRef }: ScrapbookContentProps) {
  const insets = useSafeAreaInsets();
  const { data, isLoading } = useScrapbook(50);
  const [weekCursor, setWeekCursor] = useState(0);

  const weeks = useMemo(() => bucketByWeek(data?.entries ?? []), [data]);
  const week = weeks.find((w) => w.index === weekCursor);
  const atNewest = weekCursor === 0;
  const atOldest = weeks.length === 0 || weekCursor >= weeks[weeks.length - 1].index;

  const [left, right] = week ? splitColumns(week.entries) : [[], []];

  return (
    <View style={styles.root}>
      <Pressable style={[styles.closeBtn, { top: insets.top + 10 }]} onPress={onClose} hitSlop={8}>
        <Text style={styles.closeBtnText}>✕</Text>
      </Pressable>
      <Screen contentStyle={{ paddingTop: 4 }}>
        <Text style={[textStyles.appLogo, { color: colors.ink, marginVertical: 8 }]}>scrapbook</Text>

        {isLoading ? (
          <ActivityIndicator color={colors.stamp} style={{ marginTop: 24 }} />
        ) : weeks.length === 0 ? (
          <Text style={styles.emptyHint}>nothing stamped yet</Text>
        ) : (
          <>
            <View style={styles.weekNav}>
              <Pressable
                style={[styles.arrow, atOldest && styles.arrowDisabled]}
                disabled={atOldest}
                onPress={() => setWeekCursor((c) => c + 1)}
              >
                <Text style={styles.arrowText}>←</Text>
              </Pressable>
              <View style={{ alignItems: 'center' }}>
                <Text style={styles.weekLabel}>{week?.label ?? weekLabel(weekCursor)}</Text>
                <Text style={styles.weekRange}>{week?.range}</Text>
              </View>
              <Pressable
                style={[styles.arrow, atNewest && styles.arrowDisabled]}
                disabled={atNewest}
                onPress={() => setWeekCursor((c) => Math.max(0, c - 1))}
              >
                <Text style={styles.arrowText}>→</Text>
              </Pressable>
            </View>

            {!week ? (
              <Text style={styles.emptyHint}>nothing this week</Text>
            ) : (
              <View style={styles.grid}>
                <View style={styles.column}>
                  {left.map((e) => (
                    <ScrapbookTile
                      key={e._id}
                      entry={e}
                      hidden={hiddenEntryIds?.has(e._id)}
                      tileRef={registerTileRef ? (r) => registerTileRef(e._id, r) : undefined}
                    />
                  ))}
                </View>
                <View style={styles.column}>
                  {right.map((e) => (
                    <ScrapbookTile
                      key={e._id}
                      entry={e}
                      hidden={hiddenEntryIds?.has(e._id)}
                      tileRef={registerTileRef ? (r) => registerTileRef(e._id, r) : undefined}
                    />
                  ))}
                </View>
              </View>
            )}
          </>
        )}
      </Screen>
    </View>
  );
}

function ScrapbookTile({ entry, hidden, tileRef }: { entry: Entry; hidden?: boolean; tileRef?: (r: View | null) => void }) {
  return (
    <View style={styles.tile} ref={tileRef}>
      {hidden ? null : (
        <>
          <Image source={{ uri: entry.photoUrl }} style={styles.tileImage} resizeMode="cover" />
          {entry.caption ? (
            <View style={styles.tileCapWrap}>
              <Text style={styles.tileCap} numberOfLines={2}>{entry.caption}</Text>
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  closeBtn: {
    position: 'absolute',
    right: 14,
    zIndex: 10,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { fontFamily: fonts.mono, fontSize: 11, color: colors.inkSoft },
  emptyHint: { fontFamily: fonts.mono, fontSize: 10, color: colors.inkSoft, textAlign: 'center', paddingVertical: 24 },

  weekNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 22, marginBottom: 18 },
  arrow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowDisabled: { opacity: 0.25 },
  arrowText: { color: colors.inkSoft, fontSize: 14 },
  weekLabel: { fontFamily: fonts.displayItalic, fontSize: 16, color: colors.ink },
  weekRange: { fontFamily: fonts.mono, fontSize: 9, color: colors.inkSoft, marginTop: 1 },

  grid: { flexDirection: 'row', gap: 4 },
  column: { flex: 1, gap: 4 },
  tile: { borderRadius: 3, overflow: 'hidden', backgroundColor: colors.forestBg, position: 'relative', aspectRatio: 1 },
  tileImage: { width: '100%', height: '100%' },
  tileCapWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 6, backgroundColor: 'rgba(0,0,0,0.4)' },
  tileCap: { fontFamily: fonts.mono, fontSize: 8.5, color: colors.white },
});
