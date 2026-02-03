/**
 * Outia Design Tokens
 *
 * Centralized design system for consistent visual identity.
 * Based on brand analysis: Trustworthy, Modern, Safety-First.
 *
 * Typography: Inter (headings) + System (body) + JetBrains Mono (scores)
 * Primary: Slate Blue + Electric Teal
 * Risk States: Jade Green / Warm Amber / Coral Red
 */

export const colors = {
  // Brand Primary
  brand: {
    primary: '#2D3B5F',      // Slate Blue - trust, stability
    secondary: '#00B4D8',    // Electric Teal - modern, tech
    dark: '#1A2332',         // Deep Navy - depth
  },

  // Risk States (Sofisticados)
  risk: {
    low: {
      primary: '#00C896',    // Jade Green - safe passage
      light: '#E6F9F4',      // Background tint
      dark: '#008F6B',       // Emphasis
    },
    medium: {
      primary: '#F4A261',    // Warm Amber - caution
      light: '#FFF4ED',      // Background tint
      dark: '#E07B3C',       // Emphasis
    },
    high: {
      primary: '#E63946',    // Coral Red - urgency
      light: '#FDEBED',      // Background tint
      dark: '#C62634',       // Emphasis
    },
  },

  // Legacy risk colors (for backwards compatibility)
  riskFlat: {
    low: '#00C896',
    medium: '#F4A261',
    high: '#E63946',
  },

  // Neutrals - Slate scale for consistency
  slate: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
    950: '#020617',
  },

  // Semantic colors
  background: {
    primary: '#FFFFFF',
    secondary: '#F8FAFC',
    tertiary: '#F1F5F9',
    card: '#FFFFFF',
    cardElevated: '#FFFFFF',
    // Dark mode
    darkPrimary: '#0F172A',
    darkSecondary: '#1E293B',
    darkTertiary: '#334155',
    darkCard: '#1E293B',
  },

  text: {
    primary: '#111827',
    secondary: '#6B7280',
    tertiary: '#9CA3AF',
    inverse: '#FFFFFF',
    // Dark mode
    darkPrimary: '#F8FAFC',
    darkSecondary: '#B4BCC8',
    darkTertiary: '#64748B',
  },

  border: {
    light: '#E5E7EB',
    medium: '#D1D5DB',
    dark: '#2A3341',
  },

  // Gamification
  gamification: {
    gold: '#FFB627',
    silver: '#C0C0C0',
    bronze: '#CD7F32',
    platinum: '#E5E4E2',
    points: '#FFB627',
    xp: '#8B5CF6',
  },

  // UI States
  state: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
} as const;

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
} as const;

export const borderRadius = {
  none: 0,
  sm: 6,
  md: 10,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  '4xl': 32,
  full: 9999,
} as const;

export const typography = {
  // Font sizes
  size: {
    xs: 11,
    sm: 12,
    base: 14,
    md: 15,
    lg: 16,
    xl: 18,
    '2xl': 20,
    '3xl': 24,
    '4xl': 28,
    '5xl': 32,
    '6xl': 40,
    '7xl': 48,
    '8xl': 56,
    '9xl': 64,
  },

  // Font weights (as strings for RN compatibility)
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },

  // Line heights
  leading: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },

  // Letter spacing
  tracking: {
    tighter: -0.5,
    tight: -0.25,
    normal: 0,
    wide: 0.5,
    wider: 1,
    widest: 1.5,
  },
} as const;

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  // Risk glow shadows
  glow: {
    low: {
      shadowColor: colors.risk.low.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 16,
      elevation: 8,
    },
    medium: {
      shadowColor: colors.risk.medium.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 16,
      elevation: 8,
    },
    high: {
      shadowColor: colors.risk.high.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 16,
      elevation: 8,
    },
  },
} as const;

export const animation = {
  // Durations (ms)
  duration: {
    instant: 100,
    fast: 150,
    normal: 250,
    slow: 400,
    slower: 600,
    slowest: 800,
  },

  // Spring configs for Reanimated
  spring: {
    snappy: { damping: 20, stiffness: 400 },
    bouncy: { damping: 12, stiffness: 300 },
    gentle: { damping: 15, stiffness: 200 },
    smooth: { damping: 25, stiffness: 150 },
  },
} as const;

// Helper functions
export function getRiskColor(
  classification: 'low' | 'medium' | 'high',
  variant: 'primary' | 'light' | 'dark' = 'primary'
): string {
  return colors.risk[classification][variant];
}

export function getRiskClassification(score: number): 'low' | 'medium' | 'high' {
  if (score <= 33) return 'low';
  if (score <= 66) return 'medium';
  return 'high';
}

export function getRiskLabel(classification: 'low' | 'medium' | 'high'): string {
  const labels = {
    low: 'Low Risk',
    medium: 'Medium Risk',
    high: 'High Risk',
  };
  return labels[classification];
}

// Type exports
export type RiskClassification = 'low' | 'medium' | 'high';
export type ColorScheme = 'light' | 'dark';
