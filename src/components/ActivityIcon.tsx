import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ACTIVITIES } from '../constants/activities';
import type { ActivityType } from '../types/workout';

interface Props {
  type: ActivityType;
  size?: number;
}

export default function ActivityIcon({ type, size = 44 }: Props) {
  const meta = ACTIVITIES[type];
  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: `${meta.color}22` },
      ]}
      accessibilityLabel={meta.label}
    >
      <Ionicons name={meta.icon} size={size * 0.5} color={meta.color} />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
