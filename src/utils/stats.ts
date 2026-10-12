import { ACTIVITIES, ACTIVITY_TYPES, DEFAULT_BODY_WEIGHT_KG, INTENSITY_FACTOR } from '../constants/activities';
import type { ActivityType, Intensity, Metric, Workout } from '../types/workout';
import { addDays, diffInDays, parseLocalDate, startOfDay, startOfWeek, toDateKey } from './date';

export interface Summary {
  count: number;
  totalDurationMin: number;
  totalCalories: number;
  totalDistanceKm: number;
  avgDurationMin: number;
  activeDays: number;
}

export interface WeeklyComparison {
  current: Summary;
  previous: Summary;
  /** Percentage change per metric, null when the previous week had no data */
  change: {
    count: number | null;
    totalDurationMin: number | null;
    totalCalories: number | null;
    totalDistanceKm: number | null;
  };
  weekStart: Date;
}

export interface DailyPoint {
  dateKey: string;
  date: Date;
  value: number;
}

export interface ActivityBreakdown {
  type: ActivityType;
  count: number;
  durationMin: number;
  /** Share of total duration, 0..1 */
  share: number;
}

export interface PersonalBests {
  longestRunKm: number | null;
  fastestRunPaceMinPerKm: number | null;
  longestRideKm: number | null;
  longestWorkoutMin: number | null;
  mostCalories: number | null;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function workoutDate(workout: Workout): Date {
  const parsed = parseLocalDate(workout.date);
  if (!parsed) throw new Error(`Invalid workout date: ${workout.date}`);
  return parsed;
}

/** Newest first. Returns a new array. */
export function sortByDateDesc(workouts: Workout[]): Workout[] {
  return [...workouts].sort((a, b) => workoutDate(b).getTime() - workoutDate(a).getTime());
}

/** Workouts whose date is within [start, end) */
export function filterByRange(workouts: Workout[], start: Date, end: Date): Workout[] {
  const s = start.getTime();
  const e = end.getTime();
  return workouts.filter((w) => {
    const t = workoutDate(w).getTime();
    return t >= s && t < e;
  });
}

export function metricValue(workout: Workout, metric: Metric): number {
  switch (metric) {
    case 'count':
      return 1;
    case 'distanceKm':
      return workout.distanceKm ?? 0;
    default:
      return workout[metric];
  }
}

export function summarize(workouts: Workout[]): Summary {
  const totalDurationMin = workouts.reduce((sum, w) => sum + w.durationMin, 0);
  const totalCalories = workouts.reduce((sum, w) => sum + w.calories, 0);
  const totalDistanceKm = workouts.reduce((sum, w) => sum + (w.distanceKm ?? 0), 0);
  const activeDays = new Set(workouts.map((w) => toDateKey(workoutDate(w)))).size;
  return {
    count: workouts.length,
    totalDurationMin,
    totalCalories,
    totalDistanceKm: round1(totalDistanceKm),
    avgDurationMin: workouts.length ? Math.round(totalDurationMin / workouts.length) : 0,
    activeDays,
  };
}

/** Percentage change from `previous` to `current`, rounded; null if previous is 0. */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

/** Summary of the week containing `ref` compared with the week before. */
export function getWeeklyComparison(workouts: Workout[], ref: Date = new Date()): WeeklyComparison {
  const weekStart = startOfWeek(ref);
  const current = summarize(filterByRange(workouts, weekStart, addDays(weekStart, 7)));
  const previous = summarize(filterByRange(workouts, addDays(weekStart, -7), weekStart));
  return {
    current,
    previous,
    change: {
      count: percentChange(current.count, previous.count),
      totalDurationMin: percentChange(current.totalDurationMin, previous.totalDurationMin),
      totalCalories: percentChange(current.totalCalories, previous.totalCalories),
      totalDistanceKm: percentChange(current.totalDistanceKm, previous.totalDistanceKm),
    },
    weekStart,
  };
}

/** One point per day for `days` days starting at `start` (inclusive). */
export function getDailyTotals(
  workouts: Workout[],
  start: Date,
  days: number,
  metric: Metric = 'durationMin',
): DailyPoint[] {
  const totals = new Map<string, number>();
  workouts.forEach((w) => {
    const key = toDateKey(workoutDate(w));
    totals.set(key, (totals.get(key) ?? 0) + metricValue(w, metric));
  });

  const first = startOfDay(start);
  return Array.from({ length: days }, (_, i) => {
    const date = addDays(first, i);
    const dateKey = toDateKey(date);
    return { dateKey, date, value: round1(totals.get(dateKey) ?? 0) };
  });
}

/** Totals for the last `weeks` ISO weeks ending with the week containing `ref` (oldest first). */
export function getWeeklyTotals(
  workouts: Workout[],
  weeks: number,
  metric: Metric = 'durationMin',
  ref: Date = new Date(),
): DailyPoint[] {
  const lastWeekStart = startOfWeek(ref);
  return Array.from({ length: weeks }, (_, i) => {
    const start = addDays(lastWeekStart, -7 * (weeks - 1 - i));
    const inWeek = filterByRange(workouts, start, addDays(start, 7));
    const value = inWeek.reduce((sum, w) => sum + metricValue(w, metric), 0);
    return { dateKey: toDateKey(start), date: start, value: round1(value) };
  });
}

/** Per-activity count and duration, ordered like ACTIVITY_TYPES, omitting unused activities. */
export function getActivityBreakdown(workouts: Workout[]): ActivityBreakdown[] {
  const totalDuration = workouts.reduce((sum, w) => sum + w.durationMin, 0);
  return ACTIVITY_TYPES.map((type) => {
    const ofType = workouts.filter((w) => w.type === type);
    const durationMin = ofType.reduce((sum, w) => sum + w.durationMin, 0);
    return {
      type,
      count: ofType.length,
      durationMin,
      share: totalDuration ? durationMin / totalDuration : 0,
    };
  }).filter((b) => b.count > 0);
}

/**
 * Number of consecutive days with at least one workout, ending today.
 * If there is no workout today yet, the streak ending yesterday still counts.
 */
export function getCurrentStreak(workouts: Workout[], today: Date = new Date()): number {
  const days = new Set(workouts.map((w) => toDateKey(workoutDate(w))));
  let cursor = startOfDay(today);
  if (!days.has(toDateKey(cursor))) cursor = addDays(cursor, -1);

  let streak = 0;
  while (days.has(toDateKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/** Pace in minutes per km, or null if the workout has no distance. */
export function pacePerKm(workout: Pick<Workout, 'durationMin' | 'distanceKm'>): number | null {
  if (!workout.distanceKm || workout.distanceKm <= 0) return null;
  return workout.durationMin / workout.distanceKm;
}

/** Average speed in km/h, or null if the workout has no distance. */
export function speedKmh(workout: Pick<Workout, 'durationMin' | 'distanceKm'>): number | null {
  if (!workout.distanceKm || workout.durationMin <= 0) return null;
  return round1(workout.distanceKm / (workout.durationMin / 60));
}

export function getPersonalBests(workouts: Workout[]): PersonalBests {
  const runs = workouts.filter((w) => w.type === 'running' && (w.distanceKm ?? 0) > 0);
  const rides = workouts.filter((w) => w.type === 'cycling' && (w.distanceKm ?? 0) > 0);
  const max = (values: number[]) => (values.length ? Math.max(...values) : null);
  const min = (values: number[]) => (values.length ? Math.min(...values) : null);

  return {
    longestRunKm: max(runs.map((w) => w.distanceKm as number)),
    fastestRunPaceMinPerKm: min(runs.map((w) => pacePerKm(w) as number)),
    longestRideKm: max(rides.map((w) => w.distanceKm as number)),
    longestWorkoutMin: max(workouts.map((w) => w.durationMin)),
    mostCalories: max(workouts.map((w) => w.calories)),
  };
}

/** Total lifted volume (sets x reps x kg) of a strength workout. */
export function strengthVolumeKg(workout: Workout): number {
  return (workout.exercises ?? []).reduce((sum, e) => sum + e.sets * e.reps * e.weightKg, 0);
}

/** Calories estimated from MET: kcal = MET x intensity factor x kg x hours. */
export function estimateCalories(
  type: ActivityType,
  durationMin: number,
  intensity: Intensity = 'moderate',
  weightKg: number = DEFAULT_BODY_WEIGHT_KG,
): number {
  if (durationMin <= 0) return 0;
  return Math.round(ACTIVITIES[type].met * INTENSITY_FACTOR[intensity] * weightKg * (durationMin / 60));
}

/**
 * Shifts all workout dates by whole days so that the most recent one falls on
 * `today`. Used to keep the bundled sample data "fresh" whenever the app is
 * first opened. Times of day are preserved.
 */
export function rebaseWorkoutDates(workouts: Workout[], today: Date = new Date()): Workout[] {
  if (workouts.length === 0) return [];
  const latest = workouts.reduce((acc, w) => (workoutDate(w) > workoutDate(acc) ? w : acc));
  const offset = diffInDays(workoutDate(latest), today);
  if (offset === 0) return workouts.map((w) => ({ ...w }));

  return workouts.map((w) => {
    const shifted = addDays(workoutDate(w), offset);
    const time = w.date.includes('T') ? w.date.slice(w.date.indexOf('T')) : 'T00:00:00';
    return { ...w, date: `${toDateKey(shifted)}${time}` };
  });
}
