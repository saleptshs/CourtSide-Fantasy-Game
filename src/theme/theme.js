// "Courtside" design system — a deliberate, total departure from the earlier
// neon-glow themes: true-black canvas, one confident warm accent (ember
// orange), a cool teal for contrast/availability, scoreboard-style Bebas
// Neue display type paired with clean Inter body text. Flat, high-contrast,
// minimal decoration — the accent color does the work, not glow effects.

export const colors = {
  bg: '#0A0A0A',
  surface: '#151515',
  surfaceAlt: '#1E1E1E',
  surfaceHigh: '#262626',
  surfaceHighest: '#2E2E2E',
  border: 'rgba(255,255,255,0.10)',

  text: '#FAFAFA',
  textMuted: '#9C9C9C',
  textFaint: '#5C5C5C',

  primary: '#FF6B35',        // ember orange — CTAs, active states, the leading bid
  primaryBright: '#FF8659',
  primaryDim: '#7A3115',
  secondary: '#FFD23F',       // gold — second accent, medals, highlights
  info: '#2DD4BF',           // teal — availability / positive / cool contrast
  danger: '#EF4444',

  emptySlot: '#262626',
};

export const gradients = {
  primary: ['#FF6B35', '#FF8659'],
  primaryButton: ['#FF6B35', '#FF8659'],
  card: ['#181818', '#131313'],
  pitch: ['#1F5A3F', '#163E2C'],
};

export const spacing = { xxs: 2, xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 40 };

export const radii = { sm: 4, DEFAULT: 8, md: 12, lg: 16, xl: 24, pill: 999 };

// Font families — Bebas Neue only ships one weight, which is fine: it's a
// condensed display face that reads as "bold" by design, so every headline
// step below resolves to the same font and leans on size/letter-spacing for
// hierarchy instead. Inter carries everything else (body, labels, numbers).
export const fonts = {
  headlineBlack: 'BebasNeue_400Regular',
  headlineExtraBold: 'BebasNeue_400Regular',
  headlineBold: 'BebasNeue_400Regular',
  headlineSemiBold: 'BebasNeue_400Regular',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
  heavy: 'Inter_900Black',
  mono: 'Inter_500Medium',
  monoSemiBold: 'Inter_600SemiBold',
  monoBold: 'Inter_700Bold',
};

export const typography = {
  headlineXl: { fontFamily: fonts.headlineBlack, fontSize: 40, lineHeight: 42, letterSpacing: 0.4, color: colors.text, textTransform: 'uppercase' },
  headlineLg: { fontFamily: fonts.headlineBold, fontSize: 30, lineHeight: 32, letterSpacing: 0.3, color: colors.text, textTransform: 'uppercase' },
  headlineMd: { fontFamily: fonts.headlineBold, fontSize: 24, lineHeight: 26, letterSpacing: 0.2, color: colors.text, textTransform: 'uppercase' },
  headlineSm: { fontFamily: fonts.bodyBold, fontSize: 15, lineHeight: 20, color: colors.text },
  body: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.text },
  bodyMuted: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: colors.textMuted },
  labelLg: { fontFamily: fonts.monoBold, fontSize: 13, letterSpacing: 0.4, color: colors.text },
  labelMd: { fontFamily: fonts.monoSemiBold, fontSize: 11, letterSpacing: 0.8, color: colors.textMuted },
  labelSm: { fontFamily: fonts.mono, fontSize: 9.5, letterSpacing: 1, color: colors.textFaint },
};

// Cross-platform elevation helper. Flat design by default — glow is used
// sparingly (primary CTAs, the leading bid) rather than on every card.
export function shadow(level = 1, glowColor = null) {
  const map = {
    1: { shadowOpacity: 0.25, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
    2: { shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
    3: { shadowOpacity: 0.4, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 10 },
  };
  return { shadowColor: glowColor || '#000000', ...map[level] };
}

// Rotating accent set — warm + cool alternation so adjacent managers/positions
// stay visually distinct without drifting back into a rainbow-neon look.
const ACCENT_CYCLE = ['#FF6B35', '#2DD4BF', '#FFD23F', '#EF4444', '#A78BFA'];
export function managerColor(index) {
  return ACCENT_CYCLE[index % ACCENT_CYCLE.length];
}
export function positionColor(index) {
  return ACCENT_CYCLE[index % ACCENT_CYCLE.length];
}
