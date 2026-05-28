// ─────────────────────────────────────────────
//  Swipet — Design Tokens
//  Single source of truth for all visual values
// ─────────────────────────────────────────────

// ── Palette ──────────────────────────────────
export const Colors = {
  // Primary — orange family
  primary: {
    50:  '#FFF7ED',
    100: '#FFEDD5',
    200: '#FED7AA',
    300: '#FDBA74',
    400: '#FB923C',
    500: '#F97316', // ← main accent
    600: '#EA6C0A',
    700: '#C2570A',
    800: '#9A3E08',
    900: '#7C2D0A',
  },

  // Neutrals
  neutral: {
    0:   '#FFFFFF',
    50:  '#FAFAF9',
    100: '#F5F5F4',
    150: '#EFEFED',
    200: '#E7E5E4',
    300: '#D6D3D1',
    400: '#A8A29E',
    500: '#78716C',
    600: '#57534E',
    700: '#44403C',
    800: '#292524',
    900: '#1C1917',
  },

  // Semantic
  success: '#22C55E',
  warning: '#EAB308',
  error:   '#EF4444',
  info:    '#3B82F6',

  // Password strength
  strength: {
    weak:   '#EF4444',
    fair:   '#F97316',
    good:   '#EAB308',
    strong: '#22C55E',
  },

  // Transparent overlays
  overlay: {
    light: 'rgba(255,255,255,0.85)',
    dark:  'rgba(28,25,23,0.55)',
  },
} as const;

// ── Typography ────────────────────────────────
export const FontSize = {
  xs:   11,
  sm:   13,
  base: 15,
  md:   17,
  lg:   19,
  xl:   22,
  '2xl': 26,
  '3xl': 32,
  '4xl': 40,
} as const;

export const FontWeight = {
  regular:   '400' as const,
  medium:    '500' as const,
  semibold:  '600' as const,
  bold:      '700' as const,
  extrabold: '800' as const,
} as const;

export const LineHeight = {
  tight:   1.15,
  snug:    1.3,
  normal:  1.5,
  relaxed: 1.65,
} as const;

// ── Spacing (4-pt grid) ───────────────────────
export const Spacing = {
  0:   0,
  1:   4,
  2:   8,
  3:   12,
  4:   16,
  5:   20,
  6:   24,
  7:   28,
  8:   32,
  10:  40,
  12:  48,
  16:  64,
  20:  80,
} as const;

// ── Border Radius ─────────────────────────────
export const Radius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  '2xl': 28,
  full: 9999,
} as const;

// ── Shadows ───────────────────────────────────
export const Shadow = {
  sm: {
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 12,
    elevation: 5,
  },
  lg: {
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 10,
  },
  orange: {
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

// ── Animation durations (ms) ──────────────────
export const Duration = {
  instant: 80,
  fast:    150,
  normal:  250,
  slow:    400,
  xslow:   600,
} as const;

// ── Z-Index ───────────────────────────────────
export const ZIndex = {
  base:    0,
  raised:  10,
  overlay: 100,
  modal:   200,
  toast:   300,
} as const;

// ── Layout ────────────────────────────────────
export const Layout = {
  screenPaddingH: Spacing[6],  // 24
  maxContentWidth: 480,
  inputHeight: 56,
  buttonHeight: 56,
  tabBarHeight: 80,
} as const;

// ── NativeWind class helpers (frequently reused combos) ──
// Use these as reference when writing className strings
export const NW = {
  // Buttons
  btnPrimary:  'bg-orange-500 active:bg-orange-600 rounded-2xl h-14 items-center justify-center',
  btnOutline:  'border border-orange-500 rounded-2xl h-14 items-center justify-center',
  btnGhost:    'rounded-2xl h-14 items-center justify-center',

  // Inputs
  inputBase:   'bg-neutral-50 border border-neutral-200 rounded-2xl px-4 h-14 text-neutral-900 text-base',
  inputFocused:'bg-white border-orange-400 rounded-2xl px-4 h-14 text-neutral-900 text-base',

  // Text styles
  heading1:   'text-4xl font-extrabold text-neutral-900 tracking-tight',
  heading2:   'text-2xl font-bold text-neutral-900',
  body:       'text-base text-neutral-600 leading-relaxed',
  caption:    'text-xs text-neutral-400',
  label:      'text-sm font-semibold text-neutral-700 mb-1',

  // Cards
  card:       'bg-white rounded-3xl p-5 shadow-sm',
} as const;