import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Image, Alert, Switch } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '@/theme/colors';
import { fonts, textStyles } from '@/theme/typography';
import { Screen } from '@/components/Screen';
import { useAppStore } from '@/store/useAppStore';

export default function CompleteStampScreen({ route, navigation }: any) {
  const taskId = route?.params?.taskId as string | undefined;
  const task = useAppStore((s) => s.tasks.find((t) => t.id === taskId));
  const completeTask = useAppStore((s) => s.completeTask);

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [share, setShare] = useState(!!task?.friend);
  const [celebration, setCelebration] = useState<{ emoji: string; msg: string; streak: number } | null>(null);

  if (!task) return null;

  const requiresPhoto = !!task.friend;

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
    if (requiresPhoto && !photoUri) return;
    const pick = completeTask(task!.id, { photo: photoUri, caption, share: requiresPhoto ? true : share });
    setCelebration({ ...pick, streak: task!.streak + 1 });
    setTimeout(() => {
      navigation?.goBack();
    }, 1500);
  }

  if (celebration) {
    return (
      <Screen scroll={false}>
        <View style={styles.celebrate}>
          <Text style={styles.celebrateEmoji}>{celebration.emoji}</Text>
          <Text style={styles.celebrateMsg}>{celebration.msg}</Text>
          <Text style={styles.celebrateStreak}>{celebration.streak} day streak</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen contentStyle={{ paddingTop: 4 }}>
      <Pressable onPress={() => navigation?.goBack()}>
        <Text style={styles.back}>← back</Text>
      </Pressable>
      <Text style={[textStyles.appLogo, { color: colors.ink, fontSize: 15, marginVertical: 8 }]}>{task.name}</Text>
      <Text style={styles.subtitle}>
        {requiresPhoto ? `linked with ${task.friend} · a photo is required for this one to count` : 'proof is optional here — totally up to you'}
      </Text>

      <Pressable style={styles.viewfinder} onPress={pickPhoto}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFillObject as any} resizeMode="cover" />
        ) : (
          <>
            <Text style={{ fontSize: 38 }}>📷</Text>
            <Text style={styles.viewfinderHint}>tap to open camera</Text>
          </>
        )}
      </Pressable>

      <TextInput
        style={styles.captionInput}
        placeholder="say something about it... (optional)"
        placeholderTextColor={colors.inkSoft}
        value={caption}
        onChangeText={setCaption}
        returnKeyType="done"
      />

      <View style={styles.shareRow}>
        <Text style={styles.shareLabel}>share to feed</Text>
        <Switch
          value={requiresPhoto ? true : share}
          onValueChange={setShare}
          disabled={requiresPhoto}
          trackColor={{ false: colors.line, true: colors.forest }}
          thumbColor={colors.white}
        />
      </View>

      <Pressable
        style={[styles.stampBtn, requiresPhoto && !photoUri && styles.stampBtnDisabled]}
        disabled={requiresPhoto && !photoUri}
        onPress={stampIt}
      >
        <Text style={styles.stampBtnText}>SPROUT IT</Text>
      </Pressable>
      {!requiresPhoto && (
        <Pressable onPress={stampIt}>
          <Text style={styles.skipLink}>mark done without a photo</Text>
        </Pressable>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { fontFamily: fonts.mono, fontSize: 11, color: colors.inkSoft },
  subtitle: { fontFamily: fonts.mono, fontSize: 9.5, color: colors.inkSoft, marginBottom: 10 },

  viewfinder: {
    aspectRatio: 1,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.inkSoft,
    borderStyle: 'dashed',
    backgroundColor: colors.forestBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  viewfinderHint: { fontFamily: fonts.mono, fontSize: 9, color: colors.inkSoft, marginTop: 6 },

  captionInput: {
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    ...textStyles.caption,
    color: colors.ink,
    paddingVertical: 7,
    marginBottom: 9,
  },

  shareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.page,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  shareLabel: { fontFamily: fonts.mono, fontSize: 10, color: colors.ink },

  stampBtn: {
    borderWidth: 1.5,
    borderColor: colors.stamp,
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: 'center',
  },
  stampBtnDisabled: { opacity: 0.35 },
  stampBtnText: { fontFamily: fonts.monoBold, fontSize: 12, color: colors.stamp, letterSpacing: 1 },
  skipLink: { fontFamily: fonts.mono, fontSize: 10, color: colors.inkSoft, textAlign: 'center', marginTop: 9 },

  celebrate: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  celebrateEmoji: { fontSize: 48 },
  celebrateMsg: { ...textStyles.appLogo, fontSize: 18, color: colors.ink, marginTop: 13, marginBottom: 4, textAlign: 'center' },
  celebrateStreak: { fontFamily: fonts.monoBold, fontSize: 11, color: colors.stamp },
});
