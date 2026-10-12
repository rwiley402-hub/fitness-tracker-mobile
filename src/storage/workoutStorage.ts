import AsyncStorage from '@react-native-async-storage/async-storage';

import seedWorkouts from '../data/workouts.json';
import type { Workout } from '../types/workout';
import { rebaseWorkoutDates } from '../utils/stats';

const STORAGE_KEY = '@fitness-tracker/workouts/v1';

function isWorkout(value: unknown): value is Workout {
  if (!value || typeof value !== 'object') return false;
  const w = value as Record<string, unknown>;
  return (
    typeof w.id === 'string' &&
    typeof w.type === 'string' &&
    typeof w.title === 'string' &&
    typeof w.date === 'string' &&
    typeof w.durationMin === 'number' &&
    typeof w.calories === 'number'
  );
}

/** Sample data with dates shifted so the newest workout is today. */
export function getSampleWorkouts(today: Date = new Date()): Workout[] {
  return rebaseWorkoutDates(seedWorkouts as Workout[], today);
}

/**
 * Loads workouts from AsyncStorage. On first launch (nothing stored yet) the
 * bundled sample data is persisted and returned.
 */
export async function loadWorkouts(): Promise<Workout[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (raw === null) {
    const sample = getSampleWorkouts();
    await saveWorkouts(sample);
    return sample;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isWorkout) : [];
  } catch {
    console.warn('Stored workouts were corrupted; starting with an empty log.');
    return [];
  }
}

export async function saveWorkouts(workouts: Workout[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(workouts));
}

export async function clearWorkouts(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
