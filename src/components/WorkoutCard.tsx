import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { cardShadow, colors, radius, spacing } from '../theme';
import type { Workout } from '../types/workout';
import { formatRelativeDay } from '../utils/date';
import { formatDistance, formatDuration } from '../utils/format';
import { workoutDate } from '../utils/stats';
import ActivityIcon from './ActivityIcon';

interface Props {
  workout: Workout;
  onPress?: () => void;
}

function WorkoutCard({ workout, onPress }: Props) {
  const date = workoutDate(workout);
  const time = workout.date.slice(11, 16);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${workout.title}, ${formatDuration(workout.durationMin)}`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <ActivityIcon type={workout.type} />
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {workout.title}
        </Text>
        <Text style={styles.subtitle}>
          {formatRelativeDay(date)} · {time}
        </Text>
        <View style={styles.metrics}>
          <Metric icon="time-outline" text={formatDuration(workout.durationMin)} />
          {workout.distanceKm !== undefined && (
            <Metric icon="navigate-outline" text={formatDistance(workout.distanceKm)} />
          )}
          <Metric icon="flame-outline" text={`${workout.calories} kcal`} />
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

function Metric({ icon, text }: { icon: React.ComponentProps<typeof Ionicons>['name']; text: string }) {
  return (
    <View style={styles.metric}>
      <Ionicons name={icon} size={13} color={colors.textMuted} />
      <Text style={styles.metricText}>{text}</Text>
    </View>
  );
}

export default React.memo(WorkoutCard);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    ...cardShadow,
  },
  pressed: {
    opacity: 0.7,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
  },
  metrics: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metricText: {
    fontSize: 12,
    color: colors.textMuted,
  },
});
