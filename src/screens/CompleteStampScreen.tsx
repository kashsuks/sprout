import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert, LayoutChangeEvent, useWindowDimensions } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '@/theme/colors';
import { fonts, textStyles } from '@/theme/typography';
import { Screen } from '@/components/Screen';
import { DashedRect } from '@/components/DashedBorder';
import { currentUser } from '@/data/mockData';

const STICKERS = ['🔥', '❤️', '⭐', '🏆'];

export default function CompleteStampScreen({ route, navigation }: any) {
  const task = route?.params?.task ?? { title: 'stretch 10 min' };
  const { height: windowHeight } = useWindowDimensions();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [selectedSticker, setSelectedSticker] = useState<string | null>(null);
  const [viewfinderSize, setViewfinderSize] = useState({ width: 0, height: 0 });
  const [btnSize, setBtnSize] = useState({ width: 0, height: 0 });

  const onViewfinderLayout = useCallback((e: LayoutChangeEvent) => {
    setViewfinderSize(e.nativeEvent.layout);
  }, []);
  const onBtnLayout = useCallback((e: LayoutChangeEvent) => {
    setBtnSize(e.nativeEvent.layout);
  }, []);

  // Cap the photo viewfinder's height on shorter phones so the caption
  // input and STAMP IT button are never pushed below the fold.
  const viewfinderMaxHeight = Math.min(windowHeight * 0.34, 320);

  async function pickPhoto() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Camera access needed', 'Enable camera access to stamp this task with a photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: true });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  }

  function stampIt() {
    // TODO: upload photoUri to DO Spaces via presigned URL, then POST /entries
    navigation?.navigate('Feed');
  }

  return (
    <Screen contentStyle={{ paddingTop: 4 }}>
      <Text style={[textStyles.appLogo, { color: colors.ink, fontSize: 15, marginBottom: 8 }]}>
        {task.title}
      </Text>

      <View style={styles.strip}>
        <Text style={styles.stripText}>day {currentUser.streak} streak</Text>
        <Text style={styles.stripPoints}>+15 pts</Text>
      </View>

      <Pressable
        style={[styles.viewfinder, { maxHeight: viewfinderMaxHeight }]}
        onPress={pickPhoto}
        onLayout={onViewfinderLayout}
      >
        {viewfinderSize.width > 0 && (
          <DashedRect
            width={viewfinderSize.width}
            height={viewfinderSize.height}
            radius={6}
            color={colors.inkSoft}
            strokeWidth={1.5}
            dash={[5, 4]}
          />
        )}
        {photoUri ? <View style={styles.photoPreview} /> : <Text style={{ fontSize: 26 }}>📷</Text>}
      </Pressable>

      <View style={styles.stickerTray}>
        {STICKERS.map((s) => (
          <Pressable
            key={s}
            hitSlop={4}
            style={({ pressed }) => [
              styles.sticker,
              selectedSticker === s && styles.stickerOn,
              pressed && styles.stickerPressed,
            ]}
            onPress={() => setSelectedSticker(s)}
          >
            <Text style={{ fontSize: 12 }}>{s}</Text>
          </Pressable>
        ))}
        <Pressable style={({ pressed }) => [styles.sticker, pressed && styles.stickerPressed]}>
          <Text style={{ fontSize: 12, color: colors.inkSoft }}>+</Text>
        </Pressable>
      </View>

      <TextInput
        style={styles.captionInput}
        placeholder="say something about it..."
        placeholderTextColor={colors.inkSoft}
        value={caption}
        onChangeText={setCaption}
        returnKeyType="done"
        blurOnSubmit
      />

      <Pressable
        style={({ pressed }) => [styles.stampBtn, pressed && styles.stampBtnPressed]}
        onPress={stampIt}
        onLayout={onBtnLayout}
      >
        {btnSize.width > 0 && (
          <DashedRect width={btnSize.width} height={btnSize.height} radius={8} color={colors.stamp} strokeWidth={1.5} />
        )}
        <Text style={styles.stampBtnText}>STAMP IT</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 6,
    paddingVertical: 9,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  stripText: { fontFamily: fonts.mono, fontSize: 10, color: colors.ink },
  stripPoints: { fontFamily: fonts.monoBold, fontSize: 10, color: colors.forest },

  viewfinder: {
    position: 'relative',
    aspectRatio: 1,
    borderRadius: 6,
    backgroundColor: colors.forestBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  photoPreview: { ...StyleSheet.absoluteFillObject, borderRadius: 6, backgroundColor: colors.line },

  stickerTray: { flexDirection: 'row', gap: 7, marginBottom: 9 },
  sticker: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickerOn: { borderColor: colors.stamp, backgroundColor: colors.stampBg },
  stickerPressed: { opacity: 0.6 },

  captionInput: {
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    fontFamily: fonts.handwritingRegular,
    fontSize: 15,
    color: colors.ink,
    paddingVertical: 7,
    marginBottom: 12,
  },

  stampBtn: {
    position: 'relative',
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: 'center',
    overflow: 'hidden',
  },
  stampBtnPressed: { opacity: 0.75 },
  stampBtnText: {
    fontFamily: fonts.typewriter,
    fontSize: 12,
    color: colors.stamp,
    letterSpacing: 1,
  },
});
