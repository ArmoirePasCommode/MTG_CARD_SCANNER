/**
 * Design tokens for the MTG Card Scanner app.
 * All screens and components consume these to keep visuals consistent.
 */

export const colors = {
  background: '#0f0a1f',
  backgroundElevated: '#171029',
  backgroundCard: 'rgba(255,255,255,0.04)',
  backgroundCardSolid: '#1a1230',

  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.16)',
  borderFocus: '#a78bfa',

  text: '#f9fafb',
  textMuted: '#9ca3af',
  textSubtle: '#6b7280',

  primary: '#8b5cf6',
  primaryDeep: '#6d28d9',
  primarySoft: 'rgba(167,139,250,0.12)',
  primaryAccent: '#a78bfa',

  success: '#10b981',
  successSoft: 'rgba(16,185,129,0.15)',
  warning: '#f59e0b',
  warningSoft: 'rgba(245,158,11,0.15)',
  danger: '#ef4444',
  dangerSoft: 'rgba(239,68,68,0.15)',
};

export const gradients = {
  background: ['#0f0a1f', '#1a103a', '#0f0a1f'],
  primary: ['#8b5cf6', '#6d28d9'],
  card: ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)'],
};

/**
 * Per-rarity accent colors used for card items, badges, and gradient stripes.
 */
export const rarityColors = {
  common: { fg: '#cbd5e1', bg: 'rgba(203,213,225,0.15)' },
  uncommon: { fg: '#94a3b8', bg: 'rgba(148,163,184,0.18)' },
  rare: { fg: '#fbbf24', bg: 'rgba(251,191,36,0.18)' },
  mythic: { fg: '#f97316', bg: 'rgba(249,115,22,0.2)' },
  special: { fg: '#a78bfa', bg: 'rgba(167,139,250,0.18)' },
  bonus: { fg: '#a78bfa', bg: 'rgba(167,139,250,0.18)' },
};

export const getRarityColor = (rarity) => {
  if (!rarity) return rarityColors.common;
  const key = String(rarity).toLowerCase();
  return rarityColors[key] || rarityColors.common;
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '700', letterSpacing: 0.3 },
  h2: { fontSize: 22, fontWeight: '700', letterSpacing: 0.2 },
  h3: { fontSize: 18, fontWeight: '600' },
  body: { fontSize: 15, fontWeight: '400' },
  caption: { fontSize: 13, fontWeight: '500' },
  label: { fontSize: 12, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' },
};

export const shadow = {
  card: {
    shadowColor: '#7c3aed',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 8,
  },
  fab: {
    shadowColor: '#7c3aed',
    shadowOpacity: 0.45,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 12,
  },
};

export default {
  colors,
  gradients,
  rarityColors,
  getRarityColor,
  spacing,
  radius,
  typography,
  shadow,
};
