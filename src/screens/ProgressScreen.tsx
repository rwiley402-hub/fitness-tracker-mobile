import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';

import ChartCard, { chartConfig, useChartWidth } from '../components/ChartCard';
import ChipGroup, { type ChipOption } from '../components/ChipGroup';
import { ACTIVITIES } from '../constants/activities';
import { useWorkouts } from '../context/WorkoutContext';
import { cardShadow, colors, radius, spacing } from '../theme';
import type { Metric } from '../types/workout';
import { addDays, formatShortDate, startOfDay } from '../utils/date';
import { formatDistance, formatDuration, formatNumber, formatPace } from '../utils/format';
import {
  filterByRange,
  getActivityBreakdown,
  getDailyTotals,
  getPersonalBests,
  getWeeklyTotals,
} from '../utils/stats';

type ChartMetric = Exclude<Metric, 'count'>;

const METRIC_OPTIONS: ChipOption<ChartMetric>[] = [
  { value: 'durationMin', label: 'Minutes' },
  { value: 'calories', label: 'Calories' },
  { value: 'distanceKm', label: 'Distance' },
];

const METRIC_UNITS: Record<ChartMetric, string> = {
  durationMin: 'min',
  calories: 'kcal',
  distanceKm: 'km',
};

const WEEKS = 6;
const DAYS = 14;
const BREAKDOWN_DAYS = 30;

export default function ProgressScreen() {
  const { workouts, resetToSampleData } = useWorkouts();
  const [metric, setMetric] = useState<ChartMetric>('durationMin');
  const chartWidth = useChartWidth();

  const data = useMemo(() => {
    const today = startOfDay(new Date());
    const tomorrow = addDays(today, 1);
    const recent = filterByRange(workouts, addDays(today, -(BREAKDOWN_DAYS - 1)), tomorrow);
    return {
      weekly: getWeeklyTotals(workouts, WEEKS, metric, today),
      daily: getDailyTotals(workouts, addDays(today, -(DAYS - 1)), DAYS, metric),
      breakdown: getActivityBreakdown(recent),
      bests: getPersonalBests(workouts),
    };
  }, [workouts, metric]);

  const unit = METRIC_UNITS[metric];
  const weeklyTotal = data.weekly.reduce((sum, w) => sum + w.value, 0);

  const confirmReset = () => {
    Alert.alert(
      'Reset to sample data?',
      'All workouts you logged will be replaced with the bundled sample data.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: resetToSampleData },
      ],
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ChipGroup options={METRIC_OPTIONS} selected={metric} onSelect={setMetric} accessibilityLabel="Chart metric" />

      <ChartCard
        title={`Weekly ${METRIC_OPTIONS.find((o) => o.value === metric)?.label.toLowerCase()}`}
        subtitle={`Last ${WEEKS} weeks · avg ${formatNumber(weeklyTotal / WEEKS)} ${unit}/week`}
        hasData={weeklyTotal > 0}
      >
        <LineChart
          data={{
            labels: data.weekly.map((w) => formatShortDate(w.date)),
            datasets: [{ data: data.weekly.map((w) => w.value) }],
          }}
          width={chartWidth}
          height={220}
          chartConfig={chartConfig}
          yAxisSuffix=""
          fromZero
          bezier
          withInnerLines
          withOuterLines={false}
          style={styles.chart}
        />
      </ChartCard>

      <ChartCard
        title={`Daily ${unit}`}
        subtitle={`Last ${DAYS} days`}
        hasData={data.daily.some((d) => d.value > 0)}
      >
        <BarChart
          data={{
            // Show every other label so 14 bars stay readable on small screens.
            labels: data.daily.map((d, i) => (i % 2 === 0 ? String(d.date.getDate()) : '')),
            datasets: [{ data: data.daily.map((d) => d.value) }],
          }}
          width={chartWidth}
          height={200}
          yAxisLabel=""
          yAxisSuffix=""
          chartConfig={{ ...chartConfig, barPercentage: 0.35 }}
          fromZero
          withInnerLines={false}
          style={styles.chart}
        />
      </ChartCard>

      <ChartCard
        title="Activity mix"
        subtitle={`Share of active minutes, last ${BREAKDOWN_DAYS} days`}
        hasData={data.breakdown.length > 0}
      >
        <PieChart
          data={data.breakdown.map((b) => ({
            name: ACTIVITIES[b.type].label,
            population: b.durationMin,
            color: ACTIVITIES[b.type].color,
            legendFontColor: colors.textMuted,
            legendFontSize: 13,
          }))}
          width={chartWidth}
          height={190}
          chartConfig={chartConfig}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="12"
        />
      </ChartCard>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Personal bests</Text>
        <Best label="Longest run" value={formatDistance(data.bests.longestRunKm)} />
        <Best label="Fastest run pace" value={formatPace(data.bests.fastestRunPaceMinPerKm)} />
        <Best label="Longest ride" value={formatDistance(data.bests.longestRideKm)} />
        <Best
          label="Longest workout"
          value={data.bests.longestWorkoutMin !== null ? formatDuration(data.bests.longestWorkoutMin) : '–'}
        />
        <Best
          label="Most calories in one session"
          value={data.bests.mostCalories !== null ? `${formatNumber(data.bests.mostCalories)} kcal` : '–'}
        />
      </View>

      <Pressable onPress={confirmReset} style={styles.reset} accessibilityRole="button">
        <Text style={styles.resetText}>Reset to sample data</Text>
      </Pressable>
    </ScrollView>
  );
}

function Best({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.bestRow}>
      <Text style={styles.bestLabel}>{label}</Text>
      <Text style={styles.bestValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  chart: {
    borderRadius: radius.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    ...cardShadow,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  bestRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  bestLabel: {
    fontSize: 14,
    color: colors.textMuted,
  },
  bestValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  reset: {
    alignSelf: 'center',
    padding: spacing.md,
  },
  resetText: {
    color: colors.danger,
    fontWeight: '600',
  },
});
