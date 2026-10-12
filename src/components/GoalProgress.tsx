import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { cardShadow, colors, radius, spacing } from '../theme';
import { formatDuration } from '../utils/format';

interface Props {
  minutes: number;
  goalMinutes: number;
}

export default function GoalProgress({ minutes, goalMinutes }: Props) {
  const ratio = goalMinutes > 0 ? Math.min(minutes / goalMinutes, 1) : 0;
  const done = minutes >= goalMinutes;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.title}>Weekly active minutes</Text>
        <Text style={styles.percent}>{Math.round(ratio * 100)}%</Text>
      </View>
      <View
        style={styles.track}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: goalMinutes, now: Math.min(minutes, goalMinutes) }}
      >
        <View
          style={[
            styles.fill,
            { width: `${ratio * 100}%`, backgroundColor: done ? colors.success : colors.primary },
          ]}
        />
      </View>
      <Text style={styles.caption}>
        {done
          ? `Goal reached! ${formatDuration(minutes)} this week.`
          : `${formatDuration(minutes)} of ${formatDuration(goalMinutes)} · ${formatDuration(goalMinutes - minutes)} to go`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    ...cardShadow,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  percent: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  track: {
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
  },
  caption: {
    fontSize: 13,
    color: colors.textMuted,
  },
});
