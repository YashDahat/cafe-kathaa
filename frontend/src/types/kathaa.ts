// Cafe Kathaa domain types — mirror backend kathaa/dto/KathaaDtos.java.
export type Diet = 'VEG' | 'EGG' | 'NON_VEG';

export interface MenuDish {
  id: number; name: string; slug: string; description: string | null; pageNote: string | null;
  category: string; price: number; diet: Diet; signature: boolean; imageUrl: string | null;
  active: boolean; sortOrder: number | null; workflowCode: string | null;
}
export interface UpsertMenuDish {
  name: string; slug?: string | null; description?: string | null; pageNote?: string | null; category: string;
  price: number; diet: Diet; signature: boolean; imageUrl?: string | null; active: boolean; sortOrder?: number | null;
}

export interface SeatingZone {
  id: number; name: string; slug: string; description: string | null; tagline: string | null;
  seatsPerSlot: number; maxParty: number; firstSlot: string; lastSlot: string; slotMinutes: number;
  petFriendly: boolean; workFriendly: boolean; imageUrl: string | null; active: boolean; sortOrder: number | null;
}
export type UpsertSeatingZone = Omit<SeatingZone, 'id' | 'slug'> & { slug?: string | null };

export interface Slot { slotKey: string; time: string; seatsLeft: number; bookable: boolean }
export interface ZoneAvailability { zoneId: number; zoneName: string; maxParty: number; slots: Slot[] }

export interface CreateReservation {
  zoneId: number; date: string; time: string; guests: number; bookId?: number | null;
  withPet?: boolean; petName?: string | null; occasion?: string | null; note?: string | null;
}
export interface Reservation {
  orderId: number; orderNumber: string | null; zoneId: number; zoneName: string; slotKey: string; guests: number;
  stageCode: string | null; cancellable: boolean; bookId: number | null; bookTitle: string | null;
  withPet: boolean; petName: string | null; occasion: string | null; note: string | null; createdAt: string;
}
export interface AdminReservationRow {
  id: number; orderId: number; zoneName: string; slotKey: string; guests: number; bookTitle: string | null;
  withPet: boolean; petName: string | null; occasion: string | null; note: string | null; createdAt: string;
}

export interface ShelfBook {
  id: number; title: string; author: string; language: string; genre: string | null; blurb: string | null;
  coverUrl: string | null; copies: number; staffPick: boolean; active: boolean; noteCount: number;
}
export type UpsertShelfBook = Omit<ShelfBook, 'id' | 'noteCount'>;
export interface BookDayAvailability { bookId: number; date: string; copiesFree: number }

export interface MarginNote {
  id: number; bookId: number; bookTitle: string | null; authorName: string | null; text: string;
  approved: boolean; createdAt: string;
}

export interface StoryChapter {
  id: number; marker: string; title: string; body: string | null; imageUrl: string | null;
  sortOrder: number | null; active: boolean;
}
export type UpsertStoryChapter = Omit<StoryChapter, 'id'>;

export interface Stamp { orderId: number; orderNumber: string; kind: 'VISIT' | 'TAKEAWAY'; at: string }
export interface ChaptersMe {
  enabled: boolean; stampsPerChapter: number; rewardText: string; totalStamps: number; chaptersCompleted: number;
  stampsInCurrentChapter: number; stampsToNextReward: number; recentStamps: Stamp[];
}
export interface ChapterSettings { stampsPerChapter: number; rewardText: string; enabled: boolean }
