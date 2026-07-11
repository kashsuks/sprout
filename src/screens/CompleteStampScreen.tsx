import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '@/theme/colors';
import { fonts, textStyles } from '@/theme/typography';
import { Screen } from '@/components/Screen';
import { useCompleteGoal } from '@/api/hooks/entries';
import { ApiError } from '@/api/client';

export default function CompleteStampScreen({ route, navigation }: any) {
  const goalId = route?.params?.goalId as string | undefined;
  const title = (route?.params?.title as string | undefined) ?? 'task';

  const completeGoal = useCompleteGoal();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [contentType, setContentType] = useState<'image/jpeg' | 'image/png'>('image/jpeg');
  const [caption, setCaption] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [celebration, setCelebration] = useState<string | null>(null);

  if (!goalId) return null;

  async function pickPhoto() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Camera access needed', 'Enable camera access to stamp this task with a photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: true });
    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
      setContentType(result.assets[0].mimeType === 'image/png' ? 'image/png' : 'image/jpeg');
    }
  }

  function stampIt() {
    if (!photoUri) return;
    setErrorMessage(null);
    completeGoal.mutate(
      { goalId: goalId!, photoUri, contentType, caption },
      {
        onSuccess: () => {
          setCelebration('sprouted.');
          setTimeout(() => navigation?.goBack(), 1500);
        },
        onError: (err) => {
          setErrorMessage(
            err instanceof ApiError
              ? err.message
              : 'Photo upload is not available yet — the server storage isn\'t configured.'
          );
        },
      }
    );
  }

  if (celebration) {
    return (
      <Screen scroll={false}>
        <View style={styles.celebrate}>
          <Text style={styles.celebrateEmoji}>🌱</Text>
          <Text style={styles.celebrateMsg}>{celebration}</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen contentStyle={{ paddingTop: 4 }}>
      <Pressable onPress={() => navigation?.goBack()}>
        <Text style={styles.back}>← back</Text>
      </Pressable>
      <Text style={[textStyles.appLogo, { color: colors.ink, fontSize: 15, marginVertical: 8 }]}>{title}</Text>
      <Text style={styles.subtitle}>a photo is required to stamp this one done</Text>

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

      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

      <Pressable
        style={[styles.stampBtn, (!photoUri || completeGoal.isPending) && styles.stampBtnDisabled]}
        disabled={!photoUri || completeGoal.isPending}
        onPress={stampIt}
      >
        <Text style={styles.stampBtnText}>{completeGoal.isPending ? 'stamping...' : 'SPROUT IT'}</Text>
      </Pressable>
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

  error: { ...textStyles.body, color: colors.navy, marginBottom: 12 },

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

  celebrate: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  celebrateEmoji: { fontSize: 48 },
  celebrateMsg: { ...textStyles.appLogo, fontSize: 18, color: colors.ink, marginTop: 13, marginBottom: 4, textAlign: 'center' },
});
