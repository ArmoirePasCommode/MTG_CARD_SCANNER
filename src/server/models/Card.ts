export interface Card {
  id: string;
  name: string;
  edition: string | null;
  rarity: string | null;
  imageUrl: string | null;
  ownerId: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface NewCard {
  name: string;
  edition?: string | null;
  rarity?: string | null;
  imageUrl?: string | null;
}


