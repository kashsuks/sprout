import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { colors } from '@/theme/colors';
import { fonts, textStyles } from '@/theme/typography';
import { Screen } from '@/components/Screen';
import { Pill } from '@/components/Pill';
import { useCreateGoal, useGoalsToday } from '@/api/hooks/goals';

export default function TasksScreen({ navigation }: any) {
  const [addOpen, setAddOpen] = useState(false);
  const [composeText, setComposeText] = useState('');
  const [archiveOpen, setArchiveOpen] = useState(false);

  const { data, isLoading, error } = useGoalsToday();
  const createGoal = useCreateGoal();

  const goals = data?.goals ?? [];
  const activeGoals = goals.filter((g) => !g.completed);
  const doneGoals = goals.filter((g) => g.completed);

  function submitTask() {
    const title = composeText.trim();
    if (!title) return;
    createGoal.mutate(
      { title, source: 'custom', recurrence: { type: 'daily' } },
      { onSuccess: () => setComposeText('') }
    );
    setAddOpen(false);
  }

  return (
    <Screen contentStyle={{ paddingTop: 4 }}>
      <View style={styles.header}>
        <Text style={[textStyles.appLogo, { color: colors.ink }]}>tasks</Text>
        <Text style={styles.doneCount}>{doneGoals.length} of {goals.length} done</Text>
      </View>

      <Pill label="+ add task" active={addOpen} onPress={() => setAddOpen((v) => !v)} style={{ alignItems: 'center' }} />

      {addOpen && (
        <View style={styles.addPanel}>
          <View style={styles.quickaddRow}>
            <TextInput
              style={styles.quickaddInput}
              placeholder="what are you doing?"
              placeholderTextColor={colors.inkSoft}
              value={composeText}
              onChangeText={setComposeText}
              returnKeyType="done"
              onSubmitEditing={submitTask}
            />
            <Pressable
              style={[styles.quickaddGo, !composeText.trim() && styles.quickaddGoDisabled]}
              disabled={!composeText.trim() || createGoal.isPending}
              onPress={submitTask}
            >
              <Text style={styles.quickaddGoText}>add</Text>
            </Pressable>
          </View>
        </View>
      )}

      {isLoading ? (
        <ActivityIndicator color={colors.stamp} style={{ marginTop: 24 }} />
      ) : error ? (
        <Text style={styles.emptyHint}>couldn't load your tasks — pull to try again</Text>
      ) : (
        <>
          {activeGoals.length ? (
            activeGoals.map((g) => (
              <Pressable
                key={g._id}
                style={styles.checkRow}
                onPress={() => navigation?.navigate('CompleteStamp', { goalId: g._id, title: g.title })}
              >
                <View style={styles.checkbox} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.checkName}>{g.title}</Text>
                  <Text style={styles.checkMeta}>{g.recurrence.type}</Text>
                </View>
              </Pressable>
            ))
          ) : (
            <Text style={styles.emptyHint}>all clear — nice. add something above</Text>
          )}
        </>
      )}

      <Pressable style={styles.archiveToggle} onPress={() => setArchiveOpen(!archiveOpen)}>
        <Text style={styles.archiveToggleText}>completed today ({doneGoals.length})</Text>
        <Text style={styles.archiveToggleText}>{archiveOpen ? '▾' : '▸'}</Text>
      </Pressable>
      {archiveOpen && (
        doneGoals.length ? (
          doneGoals.map((g) => (
            <View key={g._id} style={styles.archiveRow}>
              <View style={styles.archiveCheckbox}>
                <Text style={styles.archiveCheckmark}>✓</Text>
              </View>
              <Text style={styles.archiveName}>{g.title}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyHint}>nothing completed yet today</Text>
        )
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12 },
  doneCount: { fontFamily: fonts.mono, fontSize: 9, color: colors.inkSoft },

  addPanel: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 9,
    marginVertical: 8,
  },
  quickaddRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  quickaddInput: { flex: 1, fontFamily: fonts.mono, fontSize: 11, color: colors.ink, paddingVertical: 6 },
  quickaddGo: {
    backgroundColor: colors.stamp,
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  quickaddGoDisabled: { opacity: 0.35 },
  quickaddGoText: { fontFamily: fonts.monoBold, fontSize: 11, color: colors.white },

  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 11,
    marginTop: 14,
  },
  checkbox: { width: 19, height: 19, borderRadius: 9.5, borderWidth: 1.5, borderColor: colors.stamp },
  checkName: { fontFamily: fonts.monoBold, fontSize: 12, color: colors.ink },
  checkMeta: { fontFamily: fonts.mono, fontSize: 9, color: colors.inkSoft, marginTop: 2 },

  emptyHint: { fontFamily: fonts.mono, fontSize: 10, color: colors.inkSoft, textAlign: 'center', paddingVertical: 14 },

  archiveToggle: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
    borderStyle: 'dashed',
    paddingVertical: 10,
    paddingHorizontal: 2,
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  archiveToggleText: { fontFamily: fonts.mono, fontSize: 9.5, color: colors.inkSoft },

  archiveRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, opacity: 0.65 },
  archiveCheckbox: {
    width: 19,
    height: 19,
    borderRadius: 9.5,
    backgroundColor: colors.stamp,
    alignItems: 'center',
    justifyContent: 'center',
  },
  archiveCheckmark: { color: colors.white, fontSize: 11 },
  archiveName: { fontFamily: fonts.monoBold, fontSize: 12, color: colors.ink, textDecorationLine: 'line-through' },
});
