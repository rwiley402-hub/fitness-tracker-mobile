import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';

import { getSampleWorkouts, loadWorkouts, saveWorkouts } from '../storage/workoutStorage';
import type { NewWorkout, Workout } from '../types/workout';
import { sortByDateDesc } from '../utils/stats';

interface State {
  workouts: Workout[];
  loading: boolean;
  error: string | null;
}

type Action =
  | { type: 'loaded'; workouts: Workout[] }
  | { type: 'failed'; error: string }
  | { type: 'added'; workout: Workout }
  | { type: 'deleted'; id: string }
  | { type: 'replaced'; workouts: Workout[] };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'loaded':
      return { workouts: sortByDateDesc(action.workouts), loading: false, error: null };
    case 'failed':
      return { ...state, loading: false, error: action.error };
    case 'added':
      return { ...state, workouts: sortByDateDesc([action.workout, ...state.workouts]) };
    case 'deleted':
      return { ...state, workouts: state.workouts.filter((w) => w.id !== action.id) };
    case 'replaced':
      return { ...state, workouts: sortByDateDesc(action.workouts) };
    default:
      return state;
  }
}

interface WorkoutContextValue extends State {
  addWorkout: (workout: NewWorkout) => Workout;
  deleteWorkout: (id: string) => void;
  resetToSampleData: () => void;
  getWorkout: (id: string) => Workout | undefined;
}

const WorkoutContext = createContext<WorkoutContextValue | null>(null);

const createId = () => `w-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { workouts: [], loading: true, error: null });
  const hydrated = useRef(false);

  useEffect(() => {
    let cancelled = false;
    loadWorkouts()
      .then((workouts) => {
        if (cancelled) return;
        dispatch({ type: 'loaded', workouts });
        hydrated.current = true;
      })
      .catch((err: unknown) => {
        if (!cancelled) dispatch({ type: 'failed', error: String(err) });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist after every change once the initial load has completed.
  useEffect(() => {
    if (!hydrated.current) return;
    saveWorkouts(state.workouts).catch((err) => console.warn('Failed to save workouts', err));
  }, [state.workouts]);

  const addWorkout = useCallback((input: NewWorkout) => {
    const workout: Workout = { ...input, id: createId() };
    dispatch({ type: 'added', workout });
    return workout;
  }, []);

  const deleteWorkout = useCallback((id: string) => dispatch({ type: 'deleted', id }), []);

  const resetToSampleData = useCallback(
    () => dispatch({ type: 'replaced', workouts: getSampleWorkouts() }),
    [],
  );

  const getWorkout = useCallback(
    (id: string) => state.workouts.find((w) => w.id === id),
    [state.workouts],
  );

  const value = useMemo(
    () => ({ ...state, addWorkout, deleteWorkout, resetToSampleData, getWorkout }),
    [state, addWorkout, deleteWorkout, resetToSampleData, getWorkout],
  );

  return <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider>;
}

export function useWorkouts(): WorkoutContextValue {
  const ctx = useContext(WorkoutContext);
  if (!ctx) throw new Error('useWorkouts must be used inside a WorkoutProvider');
  return ctx;
}
