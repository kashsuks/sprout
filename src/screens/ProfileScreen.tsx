import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Switch, Pressable, Image, ActivityIndicator, Animated, Modal, Easing, Dimensions } from 'react-native';
import { colors } from '@/theme/colors';
import { fonts, textStyles } from '@/theme/typography';
import { Screen } from '@/components/Screen';
import { FlameIcon } from '@/components/FlameIcon';
import { useAuthStore } from '@/store/useAuthStore';
import { useScrapbook, useUpdatePrivacy } from '@/api/hooks/users';
import { usePins } from '@/api/hooks/pins';
import { ScrapbookContent } from '@/screens/ScrapbookScreen';
import { useRefetchOnFocus } from '@/hooks/useRefetchOnFocus';

type Rect = { left: number; top: number; width: number; height: number };

type FlyClone = {
  id: string;
  uri: string;
  left: Animated.Value;
  top: Animated.Value;
  width: Animated.Value;
  height: Animated.Value;
  rotate: Animated.Value;
};

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export default function ProfileScreen({ navigation }: any) {
  const mongoUser = useAuthStore((s) => s.mongoUser);
  const signOutUser = useAuthStore((s) => s.signOutUser);
  const updatePrivacy = useUpdatePrivacy();
  const { data: pinsData, refetch: refetchPins } = usePins();
  const { data: scrapbookData, isLoading: scrapbookLoading, refetch: refetchScrapbook } = useScrapbook(3);

  const earnedPins = (pinsData?.pins ?? []).filter((p) => p.earned);
  const scrapbook = scrapbookData?.entries ?? [];

  useRefetchOnFocus(refetchPins);
  useRefetchOnFocus(refetchScrapbook);
  const [refreshing, setRefreshing] = useState(false);
  async function onRefresh() {
    setRefreshing(true);
    await Promise.all([refetchPins(), refetchScrapbook()]);
    setRefreshing(false);
  }

  const filmstripRef = useRef<View>(null);
  const slotRefs = useRef<(View | null)[]>([null, null, null]);
  const tileRefMap = useRef(new Map<string, View | null>());

  const [modalVisible, setModalVisible] = useState(false);
  const [barVisible, setBarVisible] = useState(false);
  const [gridVisible, setGridVisible] = useState(false);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [flyClones, setFlyClones] = useState<FlyClone[]>([]);
  const [barPhotos, setBarPhotos] = useState<{ id: string; uri: string }[]>([]);

  const barLeft = useRef(new Animated.Value(0)).current;
  const barTop = useRef(new Animated.Value(0)).current;
  const barWidth = useRef(new Animated.Value(0)).current;
  const barHeight = useRef(new Animated.Value(0)).current;
  const barRotate = useRef(new Animated.Value(0)).current; // degrees
  const barOpacity = useRef(new Animated.Value(1)).current;

  function closeOverlay() {
    setModalVisible(false);
    setGridVisible(false);
    setBarVisible(false);
    setFlyClones([]);
    setPendingIds(new Set());
  }

  function openScrapbook() {
    if (scrapbook.length === 0 || !filmstripRef.current) {
      setModalVisible(true);
      setGridVisible(true);
      return;
    }

    filmstripRef.current.measureInWindow((fx, fy, fw, fh) => {
      barLeft.setValue(fx);
      barTop.setValue(fy);
      barWidth.setValue(fw);
      barHeight.setValue(fh);
      barRotate.setValue(0);
      barOpacity.setValue(1);
      setBarPhotos(scrapbook.map((e) => ({ id: e._id, uri: e.photoUrl })));
      setModalVisible(true);
      setBarVisible(true);

      requestAnimationFrame(() => {
        // stage 1: expand into a wide horizontal bar
        Animated.parallel([
          Animated.timing(barLeft, { toValue: SCREEN_W * 0.05, duration: 600, useNativeDriver: false }),
          Animated.timing(barTop, { toValue: fy - 18, duration: 600, useNativeDriver: false }),
          Animated.timing(barWidth, { toValue: SCREEN_W * 0.9, duration: 600, useNativeDriver: false }),
          Animated.timing(barHeight, { toValue: fh * 1.4, duration: 600, useNativeDriver: false }),
        ]).start();
      });

      setTimeout(() => {
        // stage 2: rotate 90deg to fully cover the screen
        const rW = SCREEN_H;
        const rH = SCREEN_W;
        Animated.parallel([
          Animated.timing(barLeft, { toValue: (SCREEN_W - rW) / 2, duration: 600, useNativeDriver: false }),
          Animated.timing(barTop, { toValue: (SCREEN_H - rH) / 2, duration: 600, useNativeDriver: false }),
          Animated.timing(barWidth, { toValue: rW, duration: 600, useNativeDriver: false }),
          Animated.timing(barHeight, { toValue: rH, duration: 600, useNativeDriver: false }),
          Animated.timing(barRotate, { toValue: 90, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        ]).start();
      }, 620);

      setTimeout(() => {
        // stage 3: swap what's underneath to the real grid (destination
        // tiles start blank), then fade the black bar away
        const ids = new Set(scrapbook.map((e) => e._id));
        setPendingIds(ids);
        setGridVisible(true);

        Animated.timing(barOpacity, { toValue: 0, duration: 350, useNativeDriver: false }).start(() => {
          setBarVisible(false);
        });

        setTimeout(() => {
          launchFlyingPhotos();
        }, 60);
      }, 1250);
    });
  }

  function launchFlyingPhotos() {
    const clones: FlyClone[] = [];
    const targets: { id: string; toRect: Rect }[] = [];

    let remaining = slotRefs.current.length;
    slotRefs.current.forEach((slotRef, i) => {
      const photo = barPhotosRef.current[i];
      if (!slotRef || !photo) {
        remaining -= 1;
        return;
      }
      slotRef.measureInWindow((x, y, w, h) => {
        const tileRef = tileRefMap.current.get(photo.id);
        const finish = (toRect: Rect) => {
          const clone: FlyClone = {
            id: photo.id,
            uri: photo.uri,
            left: new Animated.Value(x),
            top: new Animated.Value(y),
            width: new Animated.Value(w),
            height: new Animated.Value(h),
            rotate: new Animated.Value(90),
          };
          clones.push(clone);
          remaining -= 1;
          if (remaining === 0) {
            setFlyClones(clones);
            requestAnimationFrame(() => {
              clones.forEach((c, idx) => {
                setTimeout(() => {
                  Animated.parallel([
                    Animated.timing(c.left, { toValue: toRect.left, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
                    Animated.timing(c.top, { toValue: toRect.top, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
                    Animated.timing(c.width, { toValue: toRect.width, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
                    Animated.timing(c.height, { toValue: toRect.height, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
                    Animated.timing(c.rotate, { toValue: 0, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
                  ]).start(() => {
                    setPendingIds((prev) => {
                      const next = new Set(prev);
                      next.delete(c.id);
                      return next;
                    });
                    setFlyClones((prev) => prev.filter((f) => f.id !== c.id));
                  });
                }, idx * 80);
              });
            });
          }
        };

        if (tileRef) {
          tileRef.measureInWindow((tx, ty, tw, th) => finish({ left: tx, top: ty, width: tw, height: th }));
        } else {
          finish({ left: x, top: y, width: w, height: h });
        }
      });
    });
  }

  const barPhotosRef = useRef(barPhotos);
  barPhotosRef.current = barPhotos;

  return (
    <Screen contentStyle={{ paddingTop: 4 }} refreshing={refreshing} onRefresh={onRefresh}>
      <Text style={[textStyles.appLogo, { color: colors.ink, marginBottom: 12 }]}>profile</Text>

      <View style={styles.idCard}>
        <View style={styles.idPhoto}>
          <Text style={styles.idInitial}>{mongoUser?.displayName[0]?.toUpperCase() ?? '?'}</Text>
        </View>
        <View>
          <Text style={styles.idName}>{mongoUser?.displayName ?? ''}</Text>
          <View style={styles.idMetaRow}>
            <FlameIcon size={11} color={colors.stamp} />
            <Text style={styles.idMeta}> day {mongoUser?.currentStreak ?? 0} streak · {mongoUser?.points ?? 0} pts</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionLabel}>collected pins</Text>
      {earnedPins.length === 0 ? (
        <Text style={styles.emptyHint}>no pins earned yet</Text>
      ) : (
        <View style={styles.pins}>
          {earnedPins.map((pin) => (
            <View key={pin.key} style={styles.pin}>
              <Text style={{ fontSize: 13 }}>{pin.emoji}</Text>
            </View>
          ))}
        </View>
      )}

      <Pressable
        style={styles.privacyRow}
        onPress={() => updatePrivacy.mutate(!mongoUser?.friendsOnlyProfile)}
      >
        <Text style={styles.privacyLabel}>friends-only visibility</Text>
        <Switch
          value={mongoUser?.friendsOnlyProfile ?? true}
          onValueChange={(v) => updatePrivacy.mutate(v)}
          trackColor={{ false: colors.line, true: colors.forest }}
          thumbColor={colors.white}
        />
      </Pressable>

      <Pressable style={styles.privacyRow} onPress={() => navigation?.navigate('EditPreferences')}>
        <Text style={styles.privacyLabel}>interests · for you feed</Text>
        <Text style={styles.viewAllLink}>edit →</Text>
      </Pressable>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionLabel}>scrapbook · this week</Text>
        <Pressable onPress={openScrapbook}>
          <Text style={styles.viewAllLink}>view all →</Text>
        </Pressable>
      </View>
      {scrapbookLoading ? (
        <ActivityIndicator color={colors.stamp} style={{ marginBottom: 18 }} />
      ) : scrapbook.length === 0 ? (
        <Text style={styles.emptyHint}>nothing stamped yet</Text>
      ) : (
        <Pressable ref={filmstripRef} style={styles.filmstrip} onPress={openScrapbook}>
          {scrapbook.map((entry) => (
            <View key={entry._id} style={styles.frame}>
              {!barVisible && <Image source={{ uri: entry.photoUrl }} style={StyleSheet.absoluteFillObject as any} resizeMode="cover" />}
            </View>
          ))}
        </Pressable>
      )}

      <Pressable style={styles.recapBtn} onPress={() => navigation?.navigate('Wrapped')}>
        <Text style={styles.recapBtnText}>view recap →</Text>
      </Pressable>

      <Pressable style={styles.signOutBtn} onPress={() => signOutUser()}>
        <Text style={styles.signOutBtnText}>sign out</Text>
      </Pressable>

      <Modal visible={modalVisible} transparent animationType="none" onRequestClose={closeOverlay}>
        <View style={StyleSheet.absoluteFill}>
          {gridVisible && (
            <ScrapbookContent
              onClose={closeOverlay}
              hiddenEntryIds={pendingIds}
              registerTileRef={(id, r) => tileRefMap.current.set(id, r)}
            />
          )}

          {barVisible && (
            <Animated.View
              style={[
                styles.transitionFilm,
                {
                  left: barLeft,
                  top: barTop,
                  width: barWidth,
                  height: barHeight,
                  opacity: barOpacity,
                  transform: [{ rotate: barRotate.interpolate({ inputRange: [0, 90], outputRange: ['0deg', '90deg'] }) }],
                },
              ]}
            >
              <View style={styles.stripInner}>
                {barPhotos.map((p, i) => (
                  <View key={p.id} style={styles.filmPhoto} ref={(r) => { slotRefs.current[i] = r; }}>
                    <Image source={{ uri: p.uri }} style={StyleSheet.absoluteFillObject as any} resizeMode="cover" />
                  </View>
                ))}
              </View>
            </Animated.View>
          )}

          {flyClones.map((c) => (
            <Animated.View
              key={c.id}
              style={[
                styles.flyingPhoto,
                {
                  left: c.left,
                  top: c.top,
                  width: c.width,
                  height: c.height,
                  transform: [{ rotate: c.rotate.interpolate({ inputRange: [0, 90], outputRange: ['0deg', '90deg'] }) }],
                },
              ]}
            >
              <Image source={{ uri: c.uri }} style={StyleSheet.absoluteFillObject as any} resizeMode="cover" />
            </Animated.View>
          ))}
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  idCard: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 },
  idPhoto: {
    width: 52,
    height: 52,
    borderRadius: 6,
    backgroundColor: colors.brassBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  idInitial: { fontFamily: fonts.display, fontSize: 20, color: colors.brass },
  idName: { fontFamily: fonts.display, fontSize: 16, color: colors.ink },
  idMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  idMeta: { fontFamily: fonts.mono, fontSize: 9.5, color: colors.inkSoft },

  sectionLabel: { ...textStyles.eyebrow, color: colors.inkSoft, marginBottom: 8 },
  emptyHint: { fontFamily: fonts.mono, fontSize: 10, color: colors.inkSoft, marginBottom: 18 },

  pins: { flexDirection: 'row', gap: 6, marginBottom: 18, flexWrap: 'wrap' },
  pin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },

  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 11,
    marginBottom: 18,
  },
  privacyLabel: { fontFamily: fonts.mono, fontSize: 10, color: colors.ink },

  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  viewAllLink: { fontFamily: fonts.mono, fontSize: 9.5, color: colors.stamp },

  filmstrip: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 18,
    backgroundColor: colors.ink,
    borderRadius: 4,
    padding: 8,
  },
  frame: { flex: 1, aspectRatio: 1, borderRadius: 2, overflow: 'hidden', backgroundColor: colors.forestBg },

  recapBtn: {
    borderWidth: 1.5,
    borderColor: colors.navy,
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 10,
    backgroundColor: colors.navyBg,
    alignItems: 'center',
  },
  recapBtnText: { fontFamily: fonts.mono, fontSize: 11, color: colors.navy, letterSpacing: 0.5 },

  signOutBtn: {
    marginTop: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  signOutBtnText: { fontFamily: fonts.mono, fontSize: 10.5, color: colors.inkSoft },

  transitionFilm: { position: 'absolute', backgroundColor: colors.ink, borderRadius: 4, overflow: 'hidden' },
  stripInner: { flex: 1, flexDirection: 'row', gap: 3, padding: 7 },
  filmPhoto: { flex: 1, borderRadius: 2, overflow: 'hidden', backgroundColor: colors.forestBg },
  flyingPhoto: { position: 'absolute', borderRadius: 3, overflow: 'hidden' },
});
