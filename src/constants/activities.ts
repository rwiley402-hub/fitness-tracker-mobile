import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme';
import type { ActivityType, Intensity } from '../types/workout';

type IconName = ComponentProps<typeof Ionicons>['name'];

export interface ActivityMeta {
  label: string;
  color: string;
  icon: IconName;
  /** Whether distance is tracked for this activity */
  hasDistance: boolean;
  /** Metabolic equivalent used to estimate calories */
  met: number;
}

export const ACTIVITY_TYPES: ActivityType[] = ['running', 'cycling', 'strength', 'yoga'];

export const ACTIVITIES: Record<ActivityType, ActivityMeta> = {
  running: { label: 'Running', color: colors.running, icon: 'walk', hasDistance: true, met: 9.8 },
  cycling: { label: 'Cycling', color: colors.cycling, icon: 'bicycle', hasDistance: true, met: 7.5 },
  strength: { label: 'Strength', color: colors.strength, icon: 'barbell', hasDistance: false, met: 5.0 },
  yoga: { label: 'Yoga', color: colors.yoga, icon: 'leaf', hasDistance: false, met: 2.5 },
};

export const INTENSITIES: Intensity[] = ['low', 'moderate', 'high'];

/** Multiplier applied to MET values depending on perceived intensity */
export const INTENSITY_FACTOR: Record<Intensity, number> = {
  low: 0.85,
  moderate: 1,
  high: 1.15,
};

/** Body weight used for calorie estimates (no user profile in this demo) */
export const DEFAULT_BODY_WEIGHT_KG = 70;

/** Weekly goal shown on the dashboard (upper end of the WHO 150-300 active minutes guideline) */
export const WEEKLY_GOAL_MINUTES = 300;
