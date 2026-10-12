export const colors = {
  background: '#F5F6FA',
  surface: '#FFFFFF',
  text: '#1C1F2E',
  textMuted: '#6E7489',
  border: '#E4E6EE',
  primary: '#5B5FEF',
  primarySoft: '#ECECFE',
  success: '#22A06B',
  danger: '#D64545',
  running: '#FF7A45',
  cycling: '#2F9BFF',
  strength: '#8E5CF7',
  yoga: '#1FBF8F',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const typography = {
  title: { fontSize: 24, fontWeight: '700' as const, color: colors.text },
  heading: { fontSize: 18, fontWeight: '700' as const, color: colors.text },
  body: { fontSize: 15, color: colors.text },
  caption: { fontSize: 13, color: colors.textMuted },
};

export const cardShadow = {
  shadowColor: '#1C1F2E',
  shadowOpacity: 0.06,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
};
