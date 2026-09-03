export const colors = {
  text: '#1E1B4B',
  textSoft: '#4A4470',
  muted: '#7C7A9C',
  faint: '#B9B6D4',

  primary: '#7C5CFC',
  primaryLight: '#A78BFA',
  primaryDark: '#5B3FD6',
  primarySoft: '#EFEAFF',

  pink: '#F472B6',
  cyan: '#38BDF8',
  mint: '#34D399',
  amber: '#FBBF24',

  white: '#FFFFFF',
  track: 'rgba(30, 27, 75, 0.10)',
};

/** Frosted surfaces. Real blur comes from `GlassCard`; these are the paint on top. */
export const glass = {
  fill: 'rgba(255, 255, 255, 0.55)',
  fillStrong: 'rgba(255, 255, 255, 0.72)',
  fillSoft: 'rgba(255, 255, 255, 0.38)',
  border: 'rgba(255, 255, 255, 0.75)',
  borderSoft: 'rgba(255, 255, 255, 0.5)',
  onDark: 'rgba(255, 255, 255, 0.18)',
  onDarkBorder: 'rgba(255, 255, 255, 0.28)',
};

export const font = {
  medium: 'Nunito_500Medium',
  semi: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  extra: 'Nunito_800ExtraBold',
};

export const shadows = {
  card: {
    shadowColor: '#5B3FD6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 3,
  },
  soft: {
    shadowColor: '#2E2A5C',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 22,
    elevation: 4,
  },
  glow: {
    shadowColor: '#7C5CFC',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.32,
    shadowRadius: 24,
    elevation: 10,
  },
};

export const radius = {
  md: 20,
  lg: 28,
  xl: 36,
  pill: 999,
};

export const lessonAccents = [
  ['#7C5CFC', '#A78BFA'],
  ['#F472B6', '#FB923C'],
  ['#34D399', '#38BDF8'],
  ['#38BDF8', '#7C5CFC'],
  ['#FBBF24', '#F472B6'],
] as const;
