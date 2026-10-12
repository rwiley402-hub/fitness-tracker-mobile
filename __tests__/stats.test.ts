import seed from '../src/data/workouts.json';
import type { Workout } from '../src/types/workout';
import {
  estimateCalories,
  filterByRange,
  getActivityBreakdown,
  getCurrentStreak,
  getDailyTotals,
  getPersonalBests,
  getWeeklyComparison,
  getWeeklyTotals,
  pacePerKm,
  percentChange,
  rebaseWorkoutDates,
  sortByDateDesc,
  speedKmh,
  strengthVolumeKg,
  summarize,
} from '../src/utils/stats';

let counter = 0;
function w(partial: Partial<Workout> & Pick<Workout, 'date'>): Workout {
  counter += 1;
  return {
    id: `t-${counter}`,
    type: 'running',
    title: 'Test',
    durationMin: 30,
    calories: 300,
    intensity: 'moderate',
    ...partial,
  };
}

// Wednesday, 14 October 2026 (local time)
const WED = new Date(2026, 9, 14, 12, 0, 0);

const sample: Workout[] = [
  // previous week (Mon 5 – Sun 11 Oct)
  w({ date: '2026-10-05T07:00:00', type: 'running', durationMin: 40, calories: 450, distanceKm: 8 }),
  w({ date: '2026-10-08T18:00:00', type: 'yoga', durationMin: 60, calories: 175 }),
  // current week (Mon 12 – Sun 18 Oct)
  w({ date: '2026-10-12T07:00:00', type: 'running', durationMin: 50, calories: 560, distanceKm: 10 }),
  w({ date: '2026-10-13T07:30:00', type: 'cycling', durationMin: 60, calories: 525, distanceKm: 24.5 }),
  w({ date: '2026-10-13T18:00:00', type: 'yoga', durationMin: 30, calories: 90 }),
  w({
    date: '2026-10-14T06:45:00',
    type: 'strength',
    durationMin: 55,
    calories: 320,
    exercises: [
      { name: 'Squat', sets: 4, reps: 6, weightKg: 80 },
      { name: 'Push-ups', sets: 3, reps: 15, weightKg: 0 },
    ],
  }),
];

describe('summarize', () => {
  it('returns zeros for an empty list', () => {
    expect(summarize([])).toEqual({
      count: 0,
      totalDurationMin: 0,
      totalCalories: 0,
      totalDistanceKm: 0,
      avgDurationMin: 0,
      activeDays: 0,
    });
  });

  it('aggregates totals and counts distinct active days', () => {
    const current = sample.slice(2);
    expect(summarize(current)).toEqual({
      count: 4,
      totalDurationMin: 195,
      totalCalories: 1495,
      totalDistanceKm: 34.5,
      avgDurationMin: 49,
      activeDays: 3,
    });
  });
});

describe('percentChange', () => {
  it.each([
    [150, 100, 50],
    [50, 100, -50],
    [100, 100, 0],
    [1, 3, -67],
  ])('%p vs %p -> %p%', (current, previous, expected) => {
    expect(percentChange(current, previous)).toBe(expected);
  });

  it('returns null when there is no baseline', () => {
    expect(percentChange(10, 0)).toBeNull();
  });
});

describe('getWeeklyComparison', () => {
  it('splits workouts into the current and previous ISO week', () => {
    const result = getWeeklyComparison(sample, WED);

    expect(result.weekStart).toEqual(new Date(2026, 9, 12));
    expect(result.current.count).toBe(4);
    expect(result.previous.count).toBe(2);
    expect(result.previous.totalDurationMin).toBe(100);
    expect(result.change.count).toBe(100);
    expect(result.change.totalDurationMin).toBe(95);
    expect(result.change.totalDistanceKm).toBe(331); // 34.5 vs 8 km
  });

  it('treats Sunday as the last day of the week', () => {
    const sunday = new Date(2026, 9, 18, 21, 0);
    expect(getWeeklyComparison(sample, sunday).weekStart).toEqual(new Date(2026, 9, 12));
  });
});

describe('filterByRange', () => {
  it('includes the start and excludes the end', () => {
    const result = filterByRange(sample, new Date(2026, 9, 13), new Date(2026, 9, 14));
    expect(result.map((x) => x.type)).toEqual(['cycling', 'yoga']);
  });
});

describe('getDailyTotals', () => {
  it('returns one point per day including empty days', () => {
    const points = getDailyTotals(sample, new Date(2026, 9, 12), 7, 'durationMin');

    expect(points).toHaveLength(7);
    expect(points.map((p) => p.dateKey)).toEqual([
      '2026-10-12',
      '2026-10-13',
      '2026-10-14',
      '2026-10-15',
      '2026-10-16',
      '2026-10-17',
      '2026-10-18',
    ]);
    expect(points.map((p) => p.value)).toEqual([50, 90, 55, 0, 0, 0, 0]);
  });

  it('supports the distance and count metrics', () => {
    const start = new Date(2026, 9, 13);
    expect(getDailyTotals(sample, start, 1, 'distanceKm')[0].value).toBe(24.5);
    expect(getDailyTotals(sample, start, 1, 'count')[0].value).toBe(2);
  });
});

describe('getWeeklyTotals', () => {
  it('returns N weeks, oldest first, ending with the current week', () => {
    const weeks = getWeeklyTotals(sample, 3, 'calories', WED);
    expect(weeks.map((x) => x.dateKey)).toEqual(['2026-09-28', '2026-10-05', '2026-10-12']);
    expect(weeks.map((x) => x.value)).toEqual([0, 625, 1495]);
  });
});

describe('getActivityBreakdown', () => {
  it('reports count, duration and share per activity, skipping unused ones', () => {
    const breakdown = getActivityBreakdown(sample.slice(2, 5));
    expect(breakdown.map((b) => b.type)).toEqual(['running', 'cycling', 'yoga']);
    expect(breakdown.find((b) => b.type === 'cycling')).toMatchObject({ count: 1, durationMin: 60 });
    const totalShare = breakdown.reduce((sum, b) => sum + b.share, 0);
    expect(totalShare).toBeCloseTo(1);
  });

  it('returns an empty list for no workouts', () => {
    expect(getActivityBreakdown([])).toEqual([]);
  });
});

describe('getCurrentStreak', () => {
  it('counts consecutive days ending today', () => {
    expect(getCurrentStreak(sample, WED)).toBe(3);
  });

  it('still counts a streak that ended yesterday', () => {
    expect(getCurrentStreak(sample, new Date(2026, 9, 15, 8, 0))).toBe(3);
  });

  it('is zero after a missed day', () => {
    expect(getCurrentStreak(sample, new Date(2026, 9, 16, 8, 0))).toBe(0);
  });

  it('is zero without workouts', () => {
    expect(getCurrentStreak([], WED)).toBe(0);
  });
});

describe('pace, speed and volume', () => {
  it('computes running pace in min/km', () => {
    expect(pacePerKm({ durationMin: 50, distanceKm: 10 })).toBe(5);
    expect(pacePerKm({ durationMin: 50 })).toBeNull();
  });

  it('computes cycling speed in km/h', () => {
    expect(speedKmh({ durationMin: 60, distanceKm: 24.5 })).toBe(24.5);
    expect(speedKmh({ durationMin: 45, distanceKm: 20 })).toBe(26.7);
  });

  it('computes strength volume (sets x reps x kg)', () => {
    expect(strengthVolumeKg(sample[5])).toBe(1920);
    expect(strengthVolumeKg(sample[0])).toBe(0);
  });
});

describe('getPersonalBests', () => {
  it('finds bests across all workouts', () => {
    expect(getPersonalBests(sample)).toEqual({
      longestRunKm: 10,
      fastestRunPaceMinPerKm: 5,
      longestRideKm: 24.5,
      longestWorkoutMin: 60,
      mostCalories: 560,
    });
  });

  it('returns nulls when there is no data', () => {
    expect(getPersonalBests([])).toEqual({
      longestRunKm: null,
      fastestRunPaceMinPerKm: null,
      longestRideKm: null,
      longestWorkoutMin: null,
      mostCalories: null,
    });
  });
});

describe('estimateCalories', () => {
  it('uses MET x weight x hours', () => {
    // running MET 9.8 * 70 kg * 0.5 h = 343
    expect(estimateCalories('running', 30)).toBe(343);
  });

  it('scales with intensity', () => {
    expect(estimateCalories('yoga', 60, 'low')).toBeLessThan(estimateCalories('yoga', 60, 'high'));
  });

  it('returns 0 for non-positive durations', () => {
    expect(estimateCalories('cycling', 0)).toBe(0);
  });
});

describe('sortByDateDesc', () => {
  it('sorts newest first without mutating the input', () => {
    const input = [sample[0], sample[5], sample[2]];
    const sorted = sortByDateDesc(input);
    expect(sorted.map((x) => x.date)).toEqual([sample[5].date, sample[2].date, sample[0].date]);
    expect(input[0]).toBe(sample[0]);
  });
});

describe('rebaseWorkoutDates', () => {
  it('shifts dates so the latest workout lands on today, preserving times', () => {
    const today = new Date(2026, 10, 3, 9, 0); // 3 Nov 2026
    const rebased = rebaseWorkoutDates(sample, today);

    expect(rebased[5].date).toBe('2026-11-03T06:45:00');
    expect(rebased[0].date).toBe('2026-10-25T07:00:00');
    expect(sample[5].date).toBe('2026-10-14T06:45:00'); // input untouched
  });

  it('handles an empty list', () => {
    expect(rebaseWorkoutDates([], WED)).toEqual([]);
  });
});

describe('bundled seed data', () => {
  const workouts = seed as Workout[];

  it('covers about 30 days with all four activity types', () => {
    const types = new Set(workouts.map((x) => x.type));
    expect(types).toEqual(new Set(['running', 'cycling', 'strength', 'yoga']));
    expect(workouts.length).toBeGreaterThanOrEqual(25);

    const sorted = sortByDateDesc(workouts);
    const newest = new Date(sorted[0].date);
    const oldest = new Date(sorted[sorted.length - 1].date);
    const spanDays = Math.round((newest.getTime() - oldest.getTime()) / 86_400_000);
    expect(spanDays).toBeGreaterThanOrEqual(28);
    expect(spanDays).toBeLessThanOrEqual(31);
  });

  it('has unique ids and distances only for running and cycling', () => {
    expect(new Set(workouts.map((x) => x.id)).size).toBe(workouts.length);
    workouts.forEach((x) => {
      expect(x.distanceKm !== undefined).toBe(x.type === 'running' || x.type === 'cycling');
    });
  });
});
