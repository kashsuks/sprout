import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Image } from 'react-native';
import { colors } from '@/theme/colors';
import { fonts, textStyles } from '@/theme/typography';
import { Screen } from '@/components/Screen';
import { Pill } from '@/components/Pill';
import { useAppStore, colorToken } from '@/store/useAppStore';

export default function TasksScreen({ navigation }: any) {
  const [addOpen, setAddOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const categories = useAppStore((s) => s.categories);
  const tasks = useAppStore((s) => s.tasks);
  const composeText = useAppStore((s) => s.composeText);
  const composeCategory = useAppStore((s) => s.composeCategory);
  const composeFriend = useAppStore((s) => s.composeFriend);
  const taskFilter = useAppStore((s) => s.taskFilter);
  const archiveOpen = useAppStore((s) => s.archiveOpen);

  const setComposeText = useAppStore((s) => s.setComposeText);
  const setComposeCategory = useAppStore((s) => s.setComposeCategory);
  const setTaskFilter = useAppStore((s) => s.setTaskFilter);
  const setArchiveOpen = useAppStore((s) => s.setArchiveOpen);
  const addTask = useAppStore((s) => s.addTask);

  const doneCount = tasks.filter((t) => t.done).length;
  const doneTasks = tasks.filter((t) => t.done);
  const visibleCategories = taskFilter === 'all' ? categories : categories.filter((c) => c.id === taskFilter);

  function submitTask() {
    if (!composeText.trim()) return;
    addTask();
    setAddOpen(false);
  }

  function openAdd() {
    setAddOpen((v) => !v);
    if (!addOpen) setFilterOpen(false);
  }
  function openFilter() {
    setFilterOpen((v) => !v);
    if (!filterOpen) setAddOpen(false);
  }

  return (
    <Screen contentStyle={{ paddingTop: 4 }}>
      <View style={styles.header}>
        <Text style={[textStyles.appLogo, { color: colors.ink }]}>tasks</Text>
        <Text style={styles.doneCount}>{doneCount} of {tasks.length} done</Text>
      </View>

      <View style={styles.controlRow}>
        <Pill
          label="+ add task"
          active={addOpen}
          onPress={openAdd}
          style={{ flex: 1, alignItems: 'center' }}
        />
        <Pill
          label={`tags${taskFilter !== 'all' ? ' · ' + taskFilter : ''}`}
          active={filterOpen}
          onPress={openFilter}
        />
      </View>

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
              disabled={!composeText.trim()}
              onPress={submitTask}
            >
              <Text style={styles.quickaddGoText}>add</Text>
            </Pressable>
          </View>
          <View style={styles.quickaddMeta}>
            {categories.map((c) => (
              <Pill
                key={c.id}
                label={c.label}
                active={composeCategory === c.id}
                activeBg={colorToken(c.color)}
                onPress={() => setComposeCategory(c.id)}
              />
            ))}
            <Pressable style={styles.tagBtnMini} onPress={() => navigation?.navigate('TagPicker')}>
              <Text style={[styles.tagBtnMiniText, !!composeFriend && styles.tagBtnMiniTextOn]}>
                {composeFriend ? '+ ' + composeFriend : '+ friend'}
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {filterOpen && (
        <View style={styles.filterRow}>
          {['all', ...categories.map((c) => c.id)].map((id) => {
            const label = id === 'all' ? 'all' : categories.find((c) => c.id === id)!.label;
            return (
              <Pill key={id} label={label} active={taskFilter === id} onPress={() => setTaskFilter(id)} />
            );
          })}
        </View>
      )}

      {(() => {
        let anyActive = false;
        const groups = visibleCategories.map((cat) => {
          const items = tasks.filter((t) => t.category === cat.id && !t.done);
          if (items.length) anyActive = true;
          return { cat, items };
        });
        return (
          <>
            {groups.map(({ cat, items }) =>
              items.length ? (
                <View key={cat.id}>
                  <View style={styles.groupLabel}>
                    <View style={[styles.groupDot, { backgroundColor: colorToken(cat.color) }]} />
                    <Text style={styles.groupLabelText}>{cat.label}</Text>
                  </View>
                  {items.map((t) => (
                    <Pressable
                      key={t.id}
                      style={styles.checkRow}
                      onPress={() => navigation?.navigate('CompleteStamp', { taskId: t.id })}
                    >
                      <View style={styles.checkbox} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.checkName}>{t.name}</Text>
                        <Text style={styles.checkMeta}>
                          {t.friend ? (
                            <Text style={styles.linkPill}> linked · {t.friend} </Text>
                          ) : (
                            'solo'
                          )}
                        </Text>
                      </View>
                      <Text style={styles.streakNum}>{t.streak}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null
            )}
            {!anyActive && <Text style={styles.emptyHint}>all clear — nice. add something above</Text>}
          </>
        );
      })()}

      <Pressable style={styles.archiveToggle} onPress={() => setArchiveOpen(!archiveOpen)}>
        <Text style={styles.archiveToggleText}>completed today ({doneCount})</Text>
        <Text style={styles.archiveToggleText}>{archiveOpen ? '▾' : '▸'}</Text>
      </Pressable>
      {archiveOpen && (
        doneTasks.length ? (
          doneTasks.map((t) => (
            <View key={t.id} style={styles.archiveRow}>
              <View style={styles.archiveCheckbox}>
                <Text style={styles.archiveCheckmark}>✓</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.archiveName}>{t.name}</Text>
                <Text style={styles.checkMeta}>{t.caption || (t.friend ? `linked · ${t.friend}` : 'no note')}</Text>
              </View>
              {t.photo ? (
                <Image source={{ uri: t.photo }} style={styles.archiveThumb} />
              ) : (
                <View style={styles.archiveThumb} />
              )}
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

  controlRow: { flexDirection: 'row', gap: 7, marginBottom: 4 },

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
  quickaddMeta: { flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  tagBtnMini: {
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  tagBtnMiniText: { fontFamily: fonts.mono, fontSize: 9, color: colors.inkSoft },
  tagBtnMiniTextOn: { color: colors.stamp },

  filterRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginVertical: 8 },

  groupLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, marginBottom: 7 },
  groupDot: { width: 7, height: 7, borderRadius: 3.5 },
  groupLabelText: { fontFamily: fonts.mono, fontSize: 9.5, letterSpacing: 0.5, textTransform: 'uppercase', color: colors.inkSoft },

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
    marginBottom: 8,
  },
  checkbox: { width: 19, height: 19, borderRadius: 9.5, borderWidth: 1.5, borderColor: colors.stamp },
  checkName: { fontFamily: fonts.monoBold, fontSize: 12, color: colors.ink },
  checkMeta: { fontFamily: fonts.mono, fontSize: 9, color: colors.inkSoft, marginTop: 2 },
  linkPill: { fontFamily: fonts.mono, fontSize: 8, backgroundColor: colors.forestBg, color: colors.forest, borderRadius: 8 },
  streakNum: { fontFamily: fonts.monoBold, fontSize: 10, color: colors.stamp },

  emptyHint: { fontFamily: fonts.mono, fontSize: 10, color: colors.inkSoft, textAlign: 'center', paddingVertical: 14 },

  archiveToggle: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
    borderStyle: 'dashed',
    paddingVertical: 10,
    paddingHorizontal: 2,
    marginTop: 6,
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
  archiveThumb: { width: 22, height: 22, borderRadius: 5, backgroundColor: colors.forestBg, borderWidth: 1, borderColor: colors.line },
});
