import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  type StyleProp,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
  type ViewStyle,
} from 'react-native';

import ChipGroup, { type ChipOption } from '../components/ChipGroup';
import { ACTIVITIES, ACTIVITY_TYPES, INTENSITIES } from '../constants/activities';
import { useWorkouts } from '../context/WorkoutContext';
import type { RootStackScreenProps } from '../navigation/types';
import { colors, radius, spacing } from '../theme';
import type { ActivityType, Intensity } from '../types/workout';
import { addDays, toDateKey } from '../utils/date';
import { capitalize } from '../utils/format';
import { estimateCalories } from '../utils/stats';
import { validateWorkoutForm, type WorkoutFormErrors, type WorkoutFormValues } from '../utils/validation';

const TYPE_OPTIONS: ChipOption<ActivityType>[] = ACTIVITY_TYPES.map((type) => ({
  value: type,
  label: ACTIVITIES[type].label,
  color: ACTIVITIES[type].color,
}));

const INTENSITY_OPTIONS: ChipOption<Intensity>[] = INTENSITIES.map((value) => ({
  value,
  label: capitalize(value),
}));

function initialValues(): WorkoutFormValues {
  const now = new Date();
  return {
    type: 'running',
    title: '',
    date: toDateKey(now),
    time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
    durationMin: '',
    distanceKm: '',
    calories: '',
    avgHeartRate: '',
    intensity: 'moderate',
    notes: '',
  };
}

export default function AddWorkoutScreen({ navigation }: RootStackScreenProps<'AddWorkout'>) {
  const { addWorkout } = useWorkouts();
  const [values, setValues] = useState<WorkoutFormValues>(initialValues);
  const [errors, setErrors] = useState<WorkoutFormErrors>({});

  const meta = ACTIVITIES[values.type];

  const set = <K extends keyof WorkoutFormValues>(key: K, value: WorkoutFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const estimatedCalories = useMemo(() => {
    const minutes = Number(values.durationMin.replace(',', '.'));
    return Number.isFinite(minutes) && minutes > 0
      ? estimateCalories(values.type, minutes, values.intensity)
      : null;
  }, [values.durationMin, values.type, values.intensity]);

  const today = toDateKey(new Date());
  const yesterday = toDateKey(addDays(new Date(), -1));

  const handleSave = () => {
    const result = validateWorkoutForm(values);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    const saved = addWorkout(result.workout);
    navigation.replace('WorkoutDetail', { workoutId: saved.id });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Field label="Activity">
          <ChipGroup options={TYPE_OPTIONS} selected={values.type} onSelect={(v) => set('type', v)} />
        </Field>

        <Field label="Title" error={errors.title}>
          <Input
            value={values.title}
            onChangeText={(v) => set('title', v)}
            placeholder={`${meta.label} session`}
            maxLength={60}
          />
        </Field>

        <Field label="Date & time" error={errors.date}>
          <View style={styles.row}>
            <Input
              style={styles.flex2}
              value={values.date}
              onChangeText={(v) => set('date', v)}
              placeholder="YYYY-MM-DD"
              maxLength={10}
              keyboardType="numbers-and-punctuation"
            />
            <Input
              style={styles.flex1}
              value={values.time}
              onChangeText={(v) => set('time', v)}
              placeholder="HH:mm"
              maxLength={5}
              keyboardType="numbers-and-punctuation"
            />
          </View>
          <View style={styles.quickDates}>
            <ChipGroup
              options={[
                { value: today, label: 'Today' },
                { value: yesterday, label: 'Yesterday' },
              ]}
              selected={values.date}
              onSelect={(v) => set('date', v)}
            />
          </View>
        </Field>

        <View style={styles.row}>
          <Field label="Duration (min)" error={errors.durationMin} style={styles.flex1}>
            <Input
              value={values.durationMin}
              onChangeText={(v) => set('durationMin', v)}
              placeholder="45"
              keyboardType="decimal-pad"
            />
          </Field>
          {meta.hasDistance && (
            <Field label="Distance (km)" error={errors.distanceKm} style={styles.flex1}>
              <Input
                value={values.distanceKm}
                onChangeText={(v) => set('distanceKm', v)}
                placeholder={values.type === 'cycling' ? '25' : '8'}
                keyboardType="decimal-pad"
              />
            </Field>
          )}
        </View>

        <Field label="Intensity">
          <ChipGroup
            options={INTENSITY_OPTIONS}
            selected={values.intensity}
            onSelect={(v) => set('intensity', v)}
          />
        </Field>

        <View style={styles.row}>
          <Field
            label="Calories"
            error={errors.calories}
            hint={estimatedCalories !== null ? `Blank = est. ${estimatedCalories} kcal` : 'Optional'}
            style={styles.flex1}
          >
            <Input
              value={values.calories}
              onChangeText={(v) => set('calories', v)}
              placeholder={estimatedCalories !== null ? String(estimatedCalories) : 'kcal'}
              keyboardType="number-pad"
            />
          </Field>
          <Field label="Avg heart rate" error={errors.avgHeartRate} hint="Optional" style={styles.flex1}>
            <Input
              value={values.avgHeartRate}
              onChangeText={(v) => set('avgHeartRate', v)}
              placeholder="bpm"
              keyboardType="number-pad"
            />
          </Field>
        </View>

        <Field label="Notes" error={errors.notes}>
          <Input
            value={values.notes}
            onChangeText={(v) => set('notes', v)}
            placeholder="How did it feel?"
            multiline
            maxLength={500}
            style={styles.notes}
          />
        </Field>

        <Pressable
          style={({ pressed }) => [styles.saveButton, pressed && { opacity: 0.8 }]}
          onPress={handleSave}
          accessibilityRole="button"
        >
          <Text style={styles.saveText}>Save workout</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  error,
  hint,
  style,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.field, style]}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

function Input(props: TextInputProps) {
  return <TextInput placeholderTextColor={colors.textMuted} {...props} style={[styles.input, props.style]} />;
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
  field: {
    gap: spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? spacing.md : spacing.sm,
    fontSize: 16,
    color: colors.text,
  },
  notes: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  flex1: {
    flex: 1,
  },
  flex2: {
    flex: 2,
  },
  quickDates: {
    marginTop: spacing.xs,
  },
  hint: {
    fontSize: 12,
    color: colors.textMuted,
  },
  error: {
    fontSize: 12,
    color: colors.danger,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
