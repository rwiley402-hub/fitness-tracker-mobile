import {
  addDays,
  diffInDays,
  formatRelativeDay,
  parseLocalDate,
  startOfWeek,
  toDateKey,
  toLocalISOString,
} from '../src/utils/date';
import { formatChange, formatDistance, formatDuration, formatNumber, formatPace } from '../src/utils/format';
import { validateWorkoutForm, type WorkoutFormValues } from '../src/utils/validation';

describe('date utils', () => {
  it('parses local dates and rejects impossible ones', () => {
    expect(parseLocalDate('2026-10-12T07:45:00')).toEqual(new Date(2026, 9, 12, 7, 45, 0));
    expect(parseLocalDate('2026-10-12')).toEqual(new Date(2026, 9, 12));
    expect(parseLocalDate('2026-02-30')).toBeNull();
    expect(parseLocalDate('2026-10-12T25:00')).toBeNull();
    expect(parseLocalDate('12/10/2026')).toBeNull();
  });

  it('round-trips local ISO strings', () => {
    const date = new Date(2026, 0, 5, 9, 3, 7);
    expect(toLocalISOString(date)).toBe('2026-01-05T09:03:07');
    expect(toDateKey(date)).toBe('2026-01-05');
  });

  it('finds the Monday that starts the week', () => {
    expect(startOfWeek(new Date(2026, 9, 14, 15, 30))).toEqual(new Date(2026, 9, 12));
    expect(startOfWeek(new Date(2026, 9, 18))).toEqual(new Date(2026, 9, 12));
    expect(startOfWeek(new Date(2026, 9, 12))).toEqual(new Date(2026, 9, 12));
  });

  it('adds days across month boundaries', () => {
    expect(toDateKey(addDays(new Date(2026, 9, 30), 3))).toBe('2026-11-02');
    expect(diffInDays(new Date(2026, 9, 30), new Date(2026, 10, 2))).toBe(3);
  });

  it('formats relative days', () => {
    const now = new Date(2026, 9, 14, 12);
    expect(formatRelativeDay(new Date(2026, 9, 14, 6), now)).toBe('Today');
    expect(formatRelativeDay(new Date(2026, 9, 13, 23), now)).toBe('Yesterday');
    expect(formatRelativeDay(new Date(2026, 9, 10, 9), now)).toBe('Sat, Oct 10');
  });
});

describe('format utils', () => {
  it.each([
    [45, '45m'],
    [60, '1h'],
    [75, '1h 15m'],
    [0, '0m'],
  ])('formatDuration(%p) = %p', (minutes, expected) => {
    expect(formatDuration(minutes)).toBe(expected);
  });

  it('formats pace, rounding seconds correctly', () => {
    expect(formatPace(5.25)).toBe('5:15 /km');
    expect(formatPace(4.999)).toBe('5:00 /km');
    expect(formatPace(null)).toBe('–');
  });

  it('formats distance, numbers and changes', () => {
    expect(formatDistance(10)).toBe('10.0 km');
    expect(formatDistance(null)).toBe('–');
    expect(formatNumber(12450.4)).toBe('12,450');
    expect(formatChange(12)).toBe('+12%');
    expect(formatChange(-5)).toBe('-5%');
    expect(formatChange(null)).toBe('new');
  });
});

describe('validateWorkoutForm', () => {
  const NOW = new Date(2026, 9, 14, 20, 0);
  const base: WorkoutFormValues = {
    type: 'running',
    title: 'Evening run',
    date: '2026-10-14',
    time: '18:30',
    durationMin: '42',
    distanceKm: '8,2',
    calories: '',
    avgHeartRate: '151',
    intensity: 'moderate',
    notes: '  Felt good  ',
  };

  it('builds a workout and estimates calories when blank', () => {
    const result = validateWorkoutForm(base, NOW);
    expect(result).toEqual({
      ok: true,
      workout: {
        type: 'running',
        title: 'Evening run',
        date: '2026-10-14T18:30:00',
        durationMin: 42,
        distanceKm: 8.2,
        calories: 480, // 9.8 * 70 * 0.7 h
        intensity: 'moderate',
        avgHeartRate: 151,
        notes: 'Felt good',
      },
    });
  });

  it('uses a default title and ignores distance for strength workouts', () => {
    const result = validateWorkoutForm(
      { ...base, type: 'strength', title: ' ', distanceKm: '', calories: '300', notes: '' },
      NOW,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.workout.title).toBe('Strength session');
      expect(result.workout.distanceKm).toBeUndefined();
      expect(result.workout.calories).toBe(300);
      expect(result.workout.notes).toBeUndefined();
    }
  });

  it('collects field errors', () => {
    const result = validateWorkoutForm(
      {
        ...base,
        date: '2026-13-01',
        durationMin: '0',
        distanceKm: '',
        avgHeartRate: '400',
        calories: '-5',
      },
      NOW,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(Object.keys(result.errors).sort()).toEqual(
        ['avgHeartRate', 'calories', 'date', 'distanceKm', 'durationMin'].sort(),
      );
    }
  });

  it('rejects workouts in the future', () => {
    const result = validateWorkoutForm({ ...base, date: '2026-10-15' }, NOW);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.date).toMatch(/future/);
  });
});
