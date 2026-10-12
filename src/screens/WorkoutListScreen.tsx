import React, { useCallback, useMemo, useState } from 'react';
import { SectionList, StyleSheet, Text, View } from 'react-native';

import ChipGroup, { type ChipOption } from '../components/ChipGroup';
import EmptyState from '../components/EmptyState';
import WorkoutCard from '../components/WorkoutCard';
import { ACTIVITIES, ACTIVITY_TYPES } from '../constants/activities';
import { useWorkouts } from '../context/WorkoutContext';
import type { TabScreenProps } from '../navigation/types';
import { colors, spacing } from '../theme';
import type { ActivityType, Workout } from '../types/workout';
import { addDays, formatShortDate, startOfWeek, toDateKey } from '../utils/date';
import { formatDuration } from '../utils/format';
import { summarize, workoutDate } from '../utils/stats';

type Filter = 'all' | ActivityType;

const FILTER_OPTIONS: ChipOption<Filter>[] = [
  { value: 'all', label: 'All' },
  ...ACTIVITY_TYPES.map((type) => ({
    value: type,
    label: ACTIVITIES[type].label,
    color: ACTIVITIES[type].color,
  })),
];

interface WeekSection {
  key: string;
  title: string;
  summary: string;
  data: Workout[];
}

/** Groups workouts (already sorted newest first) by ISO week. */
function groupByWeek(workouts: Workout[]): WeekSection[] {
  const sections: WeekSection[] = [];
  const byKey = new Map<string, WeekSection>();

  workouts.forEach((workout) => {
    const weekStart = startOfWeek(workoutDate(workout));
    const key = toDateKey(weekStart);
    let section = byKey.get(key);
    if (!section) {
      section = {
        key,
        title: `${formatShortDate(weekStart)} – ${formatShortDate(addDays(weekStart, 6))}`,
        summary: '',
        data: [],
      };
      byKey.set(key, section);
      sections.push(section);
    }
    section.data.push(workout);
  });

  sections.forEach((section) => {
    const s = summarize(section.data);
    section.summary = `${s.count} workout${s.count === 1 ? '' : 's'} · ${formatDuration(s.totalDurationMin)}`;
  });
  return sections;
}

export default function WorkoutListScreen({ navigation }: TabScreenProps<'Workouts'>) {
  const { workouts } = useWorkouts();
  const [filter, setFilter] = useState<Filter>('all');

  const sections = useMemo(
    () => groupByWeek(filter === 'all' ? workouts : workouts.filter((w) => w.type === filter)),
    [workouts, filter],
  );

  const openDetail = useCallback(
    (id: string) => navigation.navigate('WorkoutDetail', { workoutId: id }),
    [navigation],
  );

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.content}
      stickySectionHeadersEnabled={false}
      ListHeaderComponent={
        <View style={styles.filters}>
          <ChipGroup
            options={FILTER_OPTIONS}
            selected={filter}
            onSelect={setFilter}
            accessibilityLabel="Filter by activity"
          />
        </View>
      }
      renderSectionHeader={({ section }) => (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Text style={styles.sectionSummary}>{section.summary}</Text>
        </View>
      )}
      renderItem={({ item }) => <WorkoutCard workout={item} onPress={() => openDetail(item.id)} />}
      ItemSeparatorComponent={Separator}
      ListEmptyComponent={
        <EmptyState
          title="Nothing here"
          message={
            filter === 'all'
              ? 'You have not logged any workouts yet.'
              : `No ${ACTIVITIES[filter].label.toLowerCase()} workouts logged yet.`
          }
          actionLabel="Log a workout"
          onAction={() => navigation.navigate('AddWorkout')}
        />
      }
    />
  );
}

function Separator() {
  return <View style={{ height: spacing.md }} />;
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  filters: {
    marginBottom: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  sectionSummary: {
    fontSize: 13,
    color: colors.textMuted,
  },
});
