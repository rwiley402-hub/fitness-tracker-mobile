import React from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import type { LineChart } from 'react-native-chart-kit';

import { cardShadow, colors, radius, spacing } from '../theme';

type ChartConfig = React.ComponentProps<typeof LineChart>['chartConfig'];

/** Shared look & feel for every react-native-chart-kit chart in the app. */
export const chartConfig: ChartConfig = {
  backgroundGradientFrom: colors.surface,
  backgroundGradientTo: colors.surface,
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(91, 95, 239, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(110, 116, 137, ${opacity})`,
  barPercentage: 0.55,
  propsForBackgroundLines: {
    stroke: colors.border,
    strokeDasharray: '4',
  },
  propsForDots: {
    r: '4',
    strokeWidth: '2',
    stroke: colors.primary,
  },
};

/** Horizontal padding of screen + card, used to size charts to the card. */
const HORIZONTAL_INSET = spacing.lg * 2 + spacing.md * 2;

export function useChartWidth(): number {
  const { width } = useWindowDimensions();
  return Math.max(width - HORIZONTAL_INSET, 200);
}

interface Props {
  title: string;
  subtitle?: string;
  /** When false, an empty message is shown instead of the chart (chart-kit cannot render all-zero data reliably). */
  hasData?: boolean;
  children: React.ReactNode;
}

export default function ChartCard({ title, subtitle, hasData = true, children }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      <View style={styles.chart}>
        {hasData ? children : <Text style={styles.empty}>No data for this period yet.</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    ...cardShadow,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    paddingHorizontal: spacing.xs,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    paddingHorizontal: spacing.xs,
    marginTop: 2,
  },
  chart: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  empty: {
    color: colors.textMuted,
    paddingVertical: spacing.xxl,
  },
});
