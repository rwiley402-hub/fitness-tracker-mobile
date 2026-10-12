import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BarChart } from 'react-native-chart-kit';

import ChartCard, { chartConfig, useChartWidth } from '../components/ChartCard';
import EmptyState from '../components/EmptyState';
import GoalProgress from '../components/GoalProgress';
import StatCard from '../components/StatCard';
import WorkoutCard from '../components/WorkoutCard';
import { WEEKLY_GOAL_MINUTES } from '../constants/activities';
import { useWorkouts } from '../context/WorkoutContext';
import type { TabScreenProps } from '../navigation/types';
import { cardShadow, colors, radius, spacing } from '../theme';
import { addDays, formatShortDate, weekdayShort } from '../utils/date';
import { formatDistance, formatDuration, formatNumber } from '../utils/format';
import { getCurrentStreak, getDailyTotals, getWeeklyComparison } from '../utils/stats';

export default function DashboardScreen({ navigation }: TabScreenProps<'Dashboard'>) {
  const { workouts, loading } = useWorkouts();
  const chartWidth = useChartWidth();

  const { weekly, daily, streak } = useMemo(() => {
    const now = new Date();
    const comparison = getWeeklyComparison(workouts, now);
    return {
      weekly: comparison,
      daily: getDailyTotals(workouts, comparison.weekStart, 7, 'durationMin'),
      streak: getCurrentStreak(workouts, now),
    };
  }, [workouts]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (workouts.length === 0) {
    return (
      <EmptyState
        title="No workouts yet"
        message="Log your first workout to see weekly stats here."
        actionLabel="Log a workout"
        onAction={() => navigation.navigate('AddWorkout')}
      />
    );
  }

  const { current, change, weekStart } = weekly;
  const recent = workouts.slice(0, 3);
  const weekLabel = `${formatShortDate(weekStart)} – ${formatShortDate(addDays(weekStart, 6))}`;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.weekLabel}>{weekLabel}</Text>

      <GoalProgress minutes={current.totalDurationMin} goalMinutes={WEEKLY_GOAL_MINUTES} />

      <View style={styles.grid}>
        <StatCard label="Workouts" icon="barbell-outline" value={String(current.count)} change={change.count} />
        <StatCard
          label="Active time"
          icon="time-outline"
          value={formatDuration(current.totalDurationMin)}
          change={change.totalDurationMin}
        />
        <StatCard
          label="Calories"
          icon="flame-outline"
          accent={colors.running}
          value={formatNumber(current.totalCalories)}
          change={change.totalCalories}
        />
        <StatCard
          label="Distance"
          icon="navigate-outline"
          accent={colors.cycling}
          value={formatDistance(current.totalDistanceKm)}
          change={change.totalDistanceKm}
        />
      </View>

      <View style={styles.streak}>
        <Ionicons name="flame" size={28} color={colors.running} />
        <View style={{ flex: 1 }}>
          <Text style={styles.streakValue}>
            {streak} day{streak === 1 ? '' : 's'} streak
          </Text>
          <Text style={styles.streakCaption}>
            {streak > 0 ? 'Keep it going tomorrow!' : 'Log a workout today to start a new streak.'}
          </Text>
        </View>
      </View>

      <ChartCard
        title="Active minutes per day"
        subtitle={`${current.activeDays} of 7 days active`}
        hasData={daily.some((d) => d.value > 0)}
      >
        <BarChart
          data={{
            labels: daily.map((d) => weekdayShort(d.date)),
            datasets: [{ data: daily.map((d) => d.value) }],
          }}
          width={chartWidth}
          height={200}
          yAxisLabel=""
          yAxisSuffix=""
          chartConfig={chartConfig}
          fromZero
          showValuesOnTopOfBars
          withInnerLines={false}
          style={styles.chart}
        />
      </ChartCard>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent workouts</Text>
        <Pressable onPress={() => navigation.navigate('Workouts')} hitSlop={8}>
          <Text style={styles.link}>See all</Text>
        </Pressable>
      </View>
      <View style={styles.list}>
        {recent.map((workout) => (
          <WorkoutCard
            key={workout.id}
            workout={workout}
            onPress={() => navigation.navigate('WorkoutDetail', { workoutId: workout.id })}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  weekLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...cardShadow,
  },
  streakValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  streakCaption: {
    fontSize: 13,
    color: colors.textMuted,
  },
  chart: {
    borderRadius: radius.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  link: {
    color: colors.primary,
    fontWeight: '600',
  },
  list: {
    gap: spacing.md,
  },
});
