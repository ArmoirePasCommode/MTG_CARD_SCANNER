// MIRROR of src/shared/apiTypes.ts — keep in sync manually.
// Source of truth: src/shared/apiTypes.ts (backend).

export interface User {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  createdAt?: string;
}

export interface Card {
  id: string;
  ownerId: string;
  name: string;
  edition: string | null;
  setName: string | null;
  collectorNumber: string | null;
  scryfallId: string | null;
  manaCost: string | null;
  typeLine: string | null;
  oracleText: string | null;
  colors: string[] | null;
  rarity: string | null;
  imageUrl: string | null;
  quantity: number;
  isFoil: boolean;
  priceUsd: number | null;
  priceEur: number | null;
  priceUsdFoil: number | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface NewCard {
  name: string;
  edition?: string | null;
  setName?: string | null;
  collectorNumber?: string | null;
  scryfallId?: string | null;
  manaCost?: string | null;
  typeLine?: string | null;
  oracleText?: string | null;
  colors?: string[] | null;
  rarity?: string | null;
  imageUrl?: string | null;
  quantity?: number;
  isFoil?: boolean;
  priceUsd?: number | null;
  priceEur?: number | null;
  priceUsdFoil?: number | null;
  tags?: string[];
}

export interface CardUpdate {
  quantity?: number;
  isFoil?: boolean;
  priceUsd?: number | null;
  priceEur?: number | null;
  priceUsdFoil?: number | null;
  tags?: string[];
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface TagInfo {
  name: string;
  count: number;
}

export interface TagRequest {
  cardIds: string[];
  add?: string[];
  remove?: string[];
}

export interface RecognizeResponse {
  text: string;
  cardName: string | null;
}

export interface BulkAddResponse {
  saved: Card[];
}

export interface ApiError {
  error: string;
  details?: string;
}
