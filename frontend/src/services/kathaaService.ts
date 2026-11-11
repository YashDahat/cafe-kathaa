// Cafe Kathaa API — goes through the foundation apiClient (JWT attached, failures auto-toast).
import apiClient from '@/api/client';
import type { BulkUploadResult } from '@/types/bulkUpload';
import type {
  AdminReservationRow, BookDayAvailability, ChapterSettings, ChaptersMe, CreateReservation, MarginNote, MenuDish,
  Reservation, SeatingZone, ShelfBook, StoryChapter, UpsertMenuDish, UpsertSeatingZone, UpsertShelfBook,
  UpsertStoryChapter, ZoneAvailability,
} from '@/types/kathaa';

const PUB = '/api/v1/kathaa';
const ADM = '/api/v1/admin/kathaa';

function upload(path: string, file: File): Promise<BulkUploadResult> {
  const fd = new FormData();
  fd.append('file', file);
  return apiClient.post<BulkUploadResult>(path, fd).then((r) => r.data);
}

export const kathaaService = {
  menu: () => apiClient.get<MenuDish[]>(`${PUB}/menu`).then((r) => r.data),
  seating: () => apiClient.get<SeatingZone[]>(`${PUB}/seating`).then((r) => r.data),
  availability: (date: string) =>
    apiClient.get<ZoneAvailability[]>(`${PUB}/seating/availability`, { params: { date } }).then((r) => r.data),
  shelf: () => apiClient.get<ShelfBook[]>(`${PUB}/shelf`).then((r) => r.data),
  bookAvailability: (id: number, date: string) =>
    apiClient.get<BookDayAvailability>(`${PUB}/shelf/${id}/availability`, { params: { date } }).then((r) => r.data),
  notes: (bookId: number) => apiClient.get<MarginNote[]>(`${PUB}/shelf/${bookId}/notes`).then((r) => r.data),
  addNote: (bookId: number, text: string) =>
    apiClient.post<MarginNote>(`${PUB}/shelf/${bookId}/notes`, { text }).then((r) => r.data),
  story: () => apiClient.get<StoryChapter[]>(`${PUB}/story`).then((r) => r.data),
  book: (req: CreateReservation) => apiClient.post<Reservation>(`${PUB}/reservations`, req).then((r) => r.data),
  myReservations: () => apiClient.get<Reservation[]>(`${PUB}/reservations/mine`).then((r) => r.data),
  chapters: () => apiClient.get<ChaptersMe>(`${PUB}/chapters/me`).then((r) => r.data),
  favourites: () => apiClient.get<MenuDish[]>(`${PUB}/favourites`).then((r) => r.data),
  toggleFavourite: (dishId: number) =>
    apiClient.post<{ favourite: boolean }>(`${PUB}/favourites/${dishId}/toggle`).then((r) => r.data),

  admin: {
    menu: () => apiClient.get<MenuDish[]>(`${ADM}/menu`).then((r) => r.data),
    createDish: (b: UpsertMenuDish) => apiClient.post<MenuDish>(`${ADM}/menu`, b).then((r) => r.data),
    updateDish: (id: number, b: UpsertMenuDish) => apiClient.put<MenuDish>(`${ADM}/menu/${id}`, b).then((r) => r.data),
    deleteDish: (id: number) => apiClient.delete(`${ADM}/menu/${id}`).then(() => undefined),
    bulkMenu: (f: File) => upload(`${ADM}/menu/bulk-upload`, f),

    seating: () => apiClient.get<SeatingZone[]>(`${ADM}/seating`).then((r) => r.data),
    createZone: (b: UpsertSeatingZone) => apiClient.post<SeatingZone>(`${ADM}/seating`, b).then((r) => r.data),
    updateZone: (id: number, b: UpsertSeatingZone) =>
      apiClient.put<SeatingZone>(`${ADM}/seating/${id}`, b).then((r) => r.data),
    deleteZone: (id: number) => apiClient.delete(`${ADM}/seating/${id}`).then(() => undefined),
    bulkSeating: (f: File) => upload(`${ADM}/seating/bulk-upload`, f),

    shelf: () => apiClient.get<ShelfBook[]>(`${ADM}/shelf`).then((r) => r.data),
    createBook: (b: UpsertShelfBook) => apiClient.post<ShelfBook>(`${ADM}/shelf`, b).then((r) => r.data),
    updateBook: (id: number, b: UpsertShelfBook) => apiClient.put<ShelfBook>(`${ADM}/shelf/${id}`, b).then((r) => r.data),
    deleteBook: (id: number) => apiClient.delete(`${ADM}/shelf/${id}`).then(() => undefined),
    bulkShelf: (f: File) => upload(`${ADM}/shelf/bulk-upload`, f),

    notes: () => apiClient.get<MarginNote[]>(`${ADM}/notes`).then((r) => r.data),
    approveNote: (id: number) => apiClient.post<MarginNote>(`${ADM}/notes/${id}/approve`).then((r) => r.data),
    hideNote: (id: number) => apiClient.post<MarginNote>(`${ADM}/notes/${id}/hide`).then((r) => r.data),
    deleteNote: (id: number) => apiClient.delete(`${ADM}/notes/${id}`).then(() => undefined),

    story: () => apiClient.get<StoryChapter[]>(`${ADM}/story`).then((r) => r.data),
    createChapter: (b: UpsertStoryChapter) => apiClient.post<StoryChapter>(`${ADM}/story`, b).then((r) => r.data),
    updateChapter: (id: number, b: UpsertStoryChapter) =>
      apiClient.put<StoryChapter>(`${ADM}/story/${id}`, b).then((r) => r.data),
    deleteChapter: (id: number) => apiClient.delete(`${ADM}/story/${id}`).then(() => undefined),
    bulkStory: (f: File) => upload(`${ADM}/story/bulk-upload`, f),

    chapterSettings: () => apiClient.get<ChapterSettings>(`${ADM}/chapters/settings`).then((r) => r.data),
    updateChapterSettings: (b: ChapterSettings) =>
      apiClient.put<ChapterSettings>(`${ADM}/chapters/settings`, b).then((r) => r.data),
    reservations: () => apiClient.get<AdminReservationRow[]>(`${ADM}/reservations`).then((r) => r.data),
  },
};
