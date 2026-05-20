/**
 * Formatting helpers shared across the collection UI.
 */

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const eurFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactUsdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export const formatUsd = (value: number | null | undefined): string => {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return usdFormatter.format(value);
};

export const formatEur = (value: number | null | undefined): string => {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return eurFormatter.format(value);
};

export const formatUsdCompact = (value: number | null | undefined): string => {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  if (value >= 1000) return compactUsdFormatter.format(value);
  return usdFormatter.format(value);
};

/**
 * Pick the user-facing price for a card based on whether the user owns the foil printing.
 * Falls back to the non-foil USD price if the foil price is missing.
 */
export const getDisplayPrice = (
  card:
    | { isFoil?: boolean | null; priceUsdFoil?: number | null; priceUsd?: number | null }
    | null
    | undefined
): number | null => {
  if (!card) return null;
  if (card.isFoil && card.priceUsdFoil !== null && card.priceUsdFoil !== undefined) {
    return card.priceUsdFoil;
  }
  return card.priceUsd ?? null;
};

export const cardLineValue = (card: {
  isFoil?: boolean | null;
  priceUsdFoil?: number | null;
  priceUsd?: number | null;
  quantity?: number | null;
}): number => {
  const unit = getDisplayPrice(card);
  if (unit === null) return 0;
  const qty = Math.max(1, card.quantity || 1);
  return unit * qty;
};
