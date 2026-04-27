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
  tags: string[]; // lowercased, deduped, max 20
  createdAt: string; // ISO
  updatedAt: string; // ISO
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
