import { Ionicons } from '@expo/vector-icons';
import React, { useLayoutEffect } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import ActivityIcon from '../components/ActivityIcon';
import EmptyState from '../components/EmptyState';
import { ACTIVITIES } from '../constants/activities';
import { useWorkouts } from '../context/WorkoutContext';
import type { RootStackScreenProps } from '../navigation/types';
import { cardShadow, colors, radius, spacing } from '../theme';
import { formatDateTime } from '../utils/date';
import { capitalize, formatDistance, formatDuration, formatNumber, formatPace } from '../utils/format';
import { pacePerKm, speedKmh, strengthVolumeKg, workoutDate } from '../utils/stats';

interface DetailItem {
  label: string;
  value: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}

export default function WorkoutDetailScreen({ route, navigation }: RootStackScreenProps<'WorkoutDetail'>) {
  const { getWorkout, deleteWorkout } = useWorkouts();
  const workout = getWorkout(route.params.workoutId);

  useLayoutEffect(() => {
    if (workout) navigation.setOptions({ title: ACTIVITIES[workout.type].label });
  }, [navigation, workout]);

  if (!workout) {
    return (
      <EmptyState
        title="Workout not found"
        message="It may have been deleted."
        actionLabel="Go back"
        onAction={() => navigation.goBack()}
      />
    );
  }

  const meta = ACTIVITIES[workout.type];
  const items: DetailItem[] = [
    { label: 'Duration', value: formatDuration(workout.durationMin), icon: 'time-outline' },
    { label: 'Calories', value: `${workout.calories} kcal`, icon: 'flame-outline' },
  ];
  if (workout.distanceKm !== undefined) {
    items.push({ label: 'Distance', value: formatDistance(workout.distanceKm), icon: 'navigate-outline' });
    items.push(
      workout.type === 'running'
        ? { label: 'Avg pace', value: formatPace(pacePerKm(workout)), icon: 'speedometer-outline' }
        : { label: 'Avg speed', value: `${speedKmh(workout) ?? '–'} km/h`, icon: 'speedometer-outline' },
    );
  }
  if (workout.avgHeartRate !== undefined) {
    items.push({ label: 'Avg heart rate', value: `${workout.avgHeartRate} bpm`, icon: 'heart-outline' });
  }
  items.push({ label: 'Intensity', value: capitalize(workout.intensity), icon: 'pulse-outline' });

  const confirmDelete = () => {
    Alert.alert('Delete workout?', `"${workout.title}" will be removed permanently.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteWorkout(workout.id);
          navigation.goBack();
        },
      },
    ]);
  };

  const volume = strengthVolumeKg(workout);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <ActivityIcon type={workout.type} size={64} />
        <Text style={styles.title}>{workout.title}</Text>
        <Text style={styles.date}>{formatDateTime(workoutDate(workout))}</Text>
        <View style={[styles.badge, { backgroundColor: `${meta.color}22` }]}>
          <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
        </View>
      </View>

      <View style={styles.grid}>
        {items.map((item) => (
          <View key={item.label} style={styles.gridItem}>
            <Ionicons name={item.icon} size={18} color={meta.color} />
            <Text style={styles.gridValue}>{item.value}</Text>
            <Text style={styles.gridLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      {workout.exercises && workout.exercises.length > 0 && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Exercises</Text>
            {volume > 0 && <Text style={styles.muted}>Volume {formatNumber(volume)} kg</Text>}
          </View>
          {workout.exercises.map((exercise, index) => (
            <View key={`${exercise.name}-${index}`} style={[styles.exerciseRow, index > 0 && styles.divider]}>
              <Text style={styles.exerciseName}>{exercise.name}</Text>
              <Text style={styles.muted}>
                {exercise.sets} × {exercise.reps}
                {exercise.weightKg > 0 ? ` @ ${exercise.weightKg} kg` : ' · bodyweight'}
              </Text>
            </View>
          ))}
        </View>
      )}

      {workout.notes ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Notes</Text>
          <Text style={styles.notes}>{workout.notes}</Text>
        </View>
      ) : null}

      <Pressable
        style={({ pressed }) => [styles.deleteButton, pressed && { opacity: 0.7 }]}
        onPress={confirmDelete}
        accessibilityRole="button"
      >
        <Ionicons name="trash-outline" size={18} color={colors.danger} />
        <Text style={styles.deleteText}>Delete workout</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  hero: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  date: {
    fontSize: 14,
    color: colors.textMuted,
  },
  badge: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  badgeText: {
    fontWeight: '700',
    fontSize: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  gridItem: {
    flexGrow: 1,
    flexBasis: '30%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 2,
    ...cardShadow,
  },
  gridValue: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.xs,
  },
  gridLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    ...cardShadow,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  exerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  divider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  exerciseName: {
    fontSize: 15,
    color: colors.text,
    flexShrink: 1,
  },
  muted: {
    fontSize: 13,
    color: colors.textMuted,
  },
  notes: {
    fontSize: 15,
    lineHeight: 21,
    color: colors.text,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  deleteText: {
    color: colors.danger,
    fontWeight: '700',
  },
});
