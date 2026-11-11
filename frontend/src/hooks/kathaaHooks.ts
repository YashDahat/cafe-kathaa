import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { kathaaService } from '@/services/kathaaService';
import { withToast } from '@/lib/apiToast';
import { useAuth } from '@/context/AuthContext';
import type { CreateReservation } from '@/types/kathaa';

export const useMenu = () => useQuery({ queryKey: ['kathaa', 'menu'], queryFn: kathaaService.menu });
export const useSeating = () => useQuery({ queryKey: ['kathaa', 'seating'], queryFn: kathaaService.seating });
export const useAvailability = (date: string | null) =>
  useQuery({
    queryKey: ['kathaa', 'availability', date],
    queryFn: () => kathaaService.availability(date as string),
    enabled: !!date,
  });
export const useShelf = () => useQuery({ queryKey: ['kathaa', 'shelf'], queryFn: kathaaService.shelf });
export const useBookAvailability = (bookId: number | null, date: string | null) =>
  useQuery({
    queryKey: ['kathaa', 'book-availability', bookId, date],
    queryFn: () => kathaaService.bookAvailability(bookId as number, date as string),
    enabled: bookId != null && !!date,
  });
export const useMarginNotes = (bookId: number | null) =>
  useQuery({
    queryKey: ['kathaa', 'notes', bookId],
    queryFn: () => kathaaService.notes(bookId as number),
    enabled: bookId != null,
  });
export const useStory = () => useQuery({ queryKey: ['kathaa', 'story'], queryFn: kathaaService.story });

export function useMyReservations() {
  const { isAuthenticated } = useAuth();
  return useQuery({ queryKey: ['kathaa', 'reservations'], queryFn: kathaaService.myReservations, enabled: isAuthenticated });
}
export function useChapters() {
  const { isAuthenticated } = useAuth();
  return useQuery({ queryKey: ['kathaa', 'chapters'], queryFn: kathaaService.chapters, enabled: isAuthenticated });
}
export function useFavourites() {
  const { isAuthenticated } = useAuth();
  return useQuery({ queryKey: ['kathaa', 'favourites'], queryFn: kathaaService.favourites, enabled: isAuthenticated });
}

export function useBookTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateReservation) => withToast(kathaaService.book(req), 'Your table is saved'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kathaa', 'reservations'] });
      qc.invalidateQueries({ queryKey: ['kathaa', 'availability'] });
      qc.invalidateQueries({ queryKey: ['orders', 'mine'] });
    },
  });
}

export function useToggleFavourite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dishId: number) => kathaaService.toggleFavourite(dishId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kathaa', 'favourites'] }),
  });
}

export function useAddMarginNote(bookId: number | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (text: string) =>
      withToast(kathaaService.addNote(bookId as number, text), 'Note pencilled in — it appears once staff approve it'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kathaa', 'notes', bookId] }),
  });
}
