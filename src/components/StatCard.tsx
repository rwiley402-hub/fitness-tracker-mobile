import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { cardShadow, colors, radius, spacing } from '../theme';
import { formatChange } from '../utils/format';

interface Props {
  label: string;
  value: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  accent?: string;
  /** Percent change vs. previous period; undefined hides the badge */
  change?: number | null;
}

export default function StatCard({ label, value, icon, accent = colors.primary, change }: Props) {
  const showChange = change !== undefined;
  const positive = (change ?? 0) >= 0;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name={icon} size={18} color={accent} />
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      {showChange && (
        <Text
          style={[
            styles.change,
            { color: change === null ? colors.textMuted : positive ? colors.success : colors.danger },
          ]}
        >
          {formatChange(change ?? null)} vs last week
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.xs,
    ...cardShadow,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  label: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  change: {
    fontSize: 12,
    fontWeight: '600',
  },
});
