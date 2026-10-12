export type ActivityType = 'running' | 'cycling' | 'strength' | 'yoga';

export type Intensity = 'low' | 'moderate' | 'high';

export interface StrengthExercise {
  name: string;
  sets: number;
  reps: number;
  /** 0 for body-weight exercises */
  weightKg: number;
}

export interface Workout {
  id: string;
  type: ActivityType;
  title: string;
  /** Local date-time without offset, e.g. "2026-10-12T07:45:00" */
  date: string;
  durationMin: number;
  /** Only for distance-based activities (running, cycling) */
  distanceKm?: number;
  calories: number;
  avgHeartRate?: number;
  intensity: Intensity;
  exercises?: StrengthExercise[];
  notes?: string;
}

export type NewWorkout = Omit<Workout, 'id'>;

export type Metric = 'durationMin' | 'calories' | 'distanceKm' | 'count';
