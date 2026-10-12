import { ACTIVITIES } from '../constants/activities';
import type { ActivityType, Intensity, NewWorkout } from '../types/workout';
import { parseLocalDate, toLocalISOString } from './date';
import { estimateCalories } from './stats';

/** Raw string values coming from the "Add workout" form. */
export interface WorkoutFormValues {
  type: ActivityType;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  durationMin: string;
  distanceKm: string;
  calories: string;
  avgHeartRate: string;
  intensity: Intensity;
  notes: string;
}

export type WorkoutFormErrors = Partial<Record<keyof WorkoutFormValues, string>>;

export type ValidationResult =
  | { ok: true; workout: NewWorkout }
  | { ok: false; errors: WorkoutFormErrors };

const toNumber = (value: string) => Number(value.replace(',', '.').trim());

/**
 * Validates raw form input and converts it into a NewWorkout.
 * Calories are estimated from MET values when left blank.
 */
export function validateWorkoutForm(values: WorkoutFormValues, now: Date = new Date()): ValidationResult {
  const errors: WorkoutFormErrors = {};
  const meta = ACTIVITIES[values.type];

  const title = values.title.trim() || `${meta.label} session`;
  if (title.length > 60) errors.title = 'Keep the title under 60 characters.';

  const time = values.time.trim() || '12:00';
  const date = parseLocalDate(`${values.date.trim()}T${time}`);
  if (!date) {
    errors.date = 'Use the format YYYY-MM-DD and HH:mm.';
  } else if (date.getTime() > now.getTime() + 60_000) {
    errors.date = 'Workouts cannot be logged in the future.';
  }

  const duration = toNumber(values.durationMin);
  if (!values.durationMin.trim() || !Number.isFinite(duration) || duration <= 0) {
    errors.durationMin = 'Enter a duration in minutes.';
  } else if (duration > 600) {
    errors.durationMin = 'Duration must be 600 minutes or less.';
  }

  let distanceKm: number | undefined;
  if (meta.hasDistance) {
    const distance = toNumber(values.distanceKm);
    if (!values.distanceKm.trim() || !Number.isFinite(distance) || distance <= 0) {
      errors.distanceKm = 'Enter a distance in km.';
    } else if (distance > 500) {
      errors.distanceKm = 'Distance looks too large.';
    } else {
      distanceKm = Math.round(distance * 100) / 100;
    }
  }

  let calories: number | undefined;
  if (values.calories.trim()) {
    const parsed = toNumber(values.calories);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 10000) {
      errors.calories = 'Calories must be between 0 and 10,000.';
    } else {
      calories = Math.round(parsed);
    }
  }

  let avgHeartRate: number | undefined;
  if (values.avgHeartRate.trim()) {
    const parsed = toNumber(values.avgHeartRate);
    if (!Number.isInteger(parsed) || parsed < 30 || parsed > 230) {
      errors.avgHeartRate = 'Heart rate must be a whole number between 30 and 230.';
    } else {
      avgHeartRate = parsed;
    }
  }

  if (values.notes.length > 500) errors.notes = 'Notes must be 500 characters or less.';

  if (Object.keys(errors).length > 0 || !date) {
    return { ok: false, errors };
  }

  const durationMin = Math.round(duration);
  const workout: NewWorkout = {
    type: values.type,
    title,
    date: toLocalISOString(date),
    durationMin,
    calories: calories ?? estimateCalories(values.type, durationMin, values.intensity),
    intensity: values.intensity,
    ...(distanceKm !== undefined && { distanceKm }),
    ...(avgHeartRate !== undefined && { avgHeartRate }),
    ...(values.notes.trim() ? { notes: values.notes.trim() } : {}),
  };
  return { ok: true, workout };
}
