import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, LayoutChangeEvent } from 'react-native';
import { colors } from '@/theme/colors';
import { fonts, textStyles } from '@/theme/typography';
import { Screen } from '@/components/Screen';
import { Ticket } from '@/components/Ticket';
import { DashedRect } from '@/components/DashedBorder';
import { recommendedTasks } from '@/data/mockData';

export default function NewEntryScreen({ navigation }: any) {
  const [customTask, setCustomTask] = useState('');
  const [inputSize, setInputSize] = useState({ width: 0, height: 0 });

  const onInputLayout = useCallback((e: LayoutChangeEvent) => {
    setInputSize(e.nativeEvent.layout);
  }, []);

  return (
    <Screen contentStyle={{ paddingTop: 4 }}>
      <Text style={[textStyles.appLogo, { color: colors.ink, marginBottom: 12 }]}>new entry</Text>

      {recommendedTasks.map((task) => (
        <Ticket
          key={task.id}
          icon={task.icon}
          iconBg={task.iconBg}
          title={task.title}
          subtitle={task.subtitle}
          onPress={() => navigation?.navigate('CompleteStamp', { task })}
        />
      ))}

      <Text style={styles.orLabel}>or write your own</Text>
      <View style={styles.customInputWrap} onLayout={onInputLayout}>
        {inputSize.width > 0 && (
          <DashedRect
            width={inputSize.width}
            height={inputSize.height}
            radius={6}
            color={colors.line}
            strokeWidth={1}
            dash={[4, 3]}
          />
        )}
        <TextInput
          style={styles.customInput}
          placeholder="e.g. no phone after 9pm"
          placeholderTextColor={colors.inkSoft}
          value={customTask}
          onChangeText={setCustomTask}
          returnKeyType="done"
          onSubmitEditing={() => {
            if (customTask.trim()) {
              navigation?.navigate('CompleteStamp', {
                task: { title: customTask.trim(), id: 'custom' },
              });
              setCustomTask('');
            }
          }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  orLabel: {
    ...textStyles.eyebrow,
    color: colors.inkSoft,
    marginTop: 4,
    marginBottom: 8,
  },
  customInputWrap: {
    position: 'relative',
  },
  customInput: {
    borderRadius: 6,
    padding: 10,
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.inkSoft,
  },
});
