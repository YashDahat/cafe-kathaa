import { useEffect, useState } from 'react';
import type { ColDef } from 'ag-grid-community';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, EyeOff, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminDataGrid } from '@/components/admin/AdminDataGrid';
import { type RowAction } from '@/components/admin/RowActionsCell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { kathaaService } from '@/services/kathaaService';
import { withToast } from '@/lib/apiToast';
import { rupees } from '@/lib/kathaa';
import type { AdminReservationRow, MarginNote, MenuDish, SeatingZone, ShelfBook, StoryChapter } from '@/types/kathaa';
import KathaaCrudTab, { type Field } from './KathaaCrudTab';

const A = kathaaService.admin;
type AnyBody = Record<string, unknown>;

const dishFields: Field[] = [
  { key: 'name', label: 'Dish name', type: 'text', step: 'Dish', required: true, maxLength: 120 },
  { key: 'category', label: 'Menu section', type: 'text', step: 'Dish', required: true, hint: 'e.g. Plates & Sandwiches, Desserts, Drinks' },
  { key: 'price', label: 'Price (₹)', type: 'number', step: 'Dish', required: true, min: 0, max: 100000 },
  { key: 'diet', label: 'Veg / egg / non-veg', type: 'select', step: 'Dish', required: true, options: ['VEG', 'EGG', 'NON_VEG'] },
  { key: 'description', label: 'Description', type: 'textarea', step: 'Story' },
  { key: 'pageNote', label: 'Page note (one line of story)', type: 'text', step: 'Story', maxLength: 140 },
  { key: 'signature', label: 'House pick (shown on the home page)', type: 'switch', step: 'Story' },
  { key: 'imageUrl', label: 'Photo', type: 'image', step: 'Display' },
  { key: 'sortOrder', label: 'Sort order', type: 'number', step: 'Display', min: 0, max: 10000 },
  { key: 'active', label: 'On the menu', type: 'switch', step: 'Display' },
];

const zoneFields: Field[] = [
  { key: 'name', label: 'Area name', type: 'text', step: 'Area', required: true },
  { key: 'tagline', label: 'Tagline', type: 'text', step: 'Area', maxLength: 60 },
  { key: 'description', label: 'Description', type: 'textarea', step: 'Area' },
  { key: 'petFriendly', label: 'Pets welcome here', type: 'switch', step: 'Area' },
  { key: 'workFriendly', label: 'Work-friendly (writing desks)', type: 'switch', step: 'Area' },
  { key: 'seatsPerSlot', label: 'Seats per slot', type: 'number', step: 'Capacity', required: true, min: 1, max: 500 },
  { key: 'maxParty', label: 'Largest party per booking', type: 'number', step: 'Capacity', required: true, min: 1, max: 500 },
  { key: 'firstSlot', label: 'First slot (HH:mm)', type: 'time', step: 'Capacity', required: true },
  { key: 'lastSlot', label: 'Last slot (HH:mm)', type: 'time', step: 'Capacity', required: true },
  { key: 'slotMinutes', label: 'Slot length (minutes)', type: 'number', step: 'Capacity', required: true, min: 15, max: 480 },
  { key: 'imageUrl', label: 'Photo', type: 'image', step: 'Display' },
  { key: 'sortOrder', label: 'Sort order', type: 'number', step: 'Display', min: 0 },
  { key: 'active', label: 'Taking bookings', type: 'switch', step: 'Display' },
];

const bookFields: Field[] = [
  { key: 'title', label: 'Title', type: 'text', step: 'Book', required: true },
  { key: 'author', label: 'Author', type: 'text', step: 'Book', required: true },
  { key: 'language', label: 'Language', type: 'text', step: 'Book', required: true, hint: 'English, मराठी, हिंदी…' },
  { key: 'genre', label: 'Genre', type: 'text', step: 'Book' },
  { key: 'blurb', label: 'One-line blurb', type: 'textarea', step: 'Book', maxLength: 240 },
  { key: 'copies', label: 'Copies on the shelf', type: 'number', step: 'Shelf', required: true, min: 0, max: 50 },
  { key: 'staffPick', label: 'Staff pick', type: 'switch', step: 'Shelf' },
  { key: 'coverUrl', label: 'Cover photo', type: 'image', step: 'Shelf' },
  { key: 'active', label: 'On the shelf', type: 'switch', step: 'Shelf' },
];

const storyFields: Field[] = [
  { key: 'marker', label: 'Marker (e.g. 2018, Today)', type: 'text', step: 'Chapter', required: true, maxLength: 24 },
  { key: 'title', label: 'Title', type: 'text', step: 'Chapter', required: true },
  { key: 'body', label: 'Body', type: 'textarea', step: 'Chapter' },
  { key: 'imageUrl', label: 'Photo', type: 'image', step: 'Display' },
  { key: 'sortOrder', label: 'Sort order', type: 'number', step: 'Display', min: 0 },
  { key: 'active', label: 'Shown', type: 'switch', step: 'Display' },
];

function NotesTab() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ['admin-kathaa', 'notes'], queryFn: A.notes });
  const refresh = () => qc.invalidateQueries({ queryKey: ['admin-kathaa', 'notes'] });
  const approve = useMutation({ mutationFn: (id: number) => withToast(A.approveNote(id), 'Note published'), onSuccess: refresh });
  const hide = useMutation({ mutationFn: (id: number) => withToast(A.hideNote(id), 'Note hidden'), onSuccess: refresh });
  const del = useMutation({ mutationFn: (id: number) => withToast(A.deleteNote(id), 'Note deleted'), onSuccess: refresh });
  const cols: ColDef<MarginNote>[] = [
    { field: 'bookTitle', headerName: 'Book', flex: 1 }, { field: 'text', headerName: 'Note', flex: 2 },
    { field: 'authorName', headerName: 'By' }, { field: 'approved', headerName: 'Public' }, { field: 'createdAt', headerName: 'Written' },
  ];
  const actions: RowAction<MarginNote>[] = [
    { label: 'Approve', icon: Check, onClick: (r) => approve.mutate(r.id), hidden: (r) => r.approved },
    { label: 'Hide', icon: EyeOff, onClick: (r) => hide.mutate(r.id), hidden: (r) => !r.approved },
    { label: 'Delete', icon: Trash2, danger: true, onClick: (r) => del.mutate(r.id) },
  ];
  return (
    <>
      <p className="mb-3 text-sm text-muted-foreground">Readers’ margin notes appear on The Shelf only after you approve them. (Guest-written content — no bulk upload.)</p>
      <AdminDataGrid<MarginNote> rowData={data} columnDefs={cols} actions={actions} emptyMessage="No margin notes yet." height="calc(100vh - 300px)" />
    </>
  );
}

function BookingsTab() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ['admin-kathaa', 'reservations'], queryFn: A.reservations });
  const { data: settings } = useQuery({ queryKey: ['admin-kathaa', 'chapter-settings'], queryFn: A.chapterSettings });
  const [form, setForm] = useState({ stampsPerChapter: 8, rewardText: '', enabled: true });
  useEffect(() => { if (settings) setForm(settings); }, [settings]);
  const save = useMutation({
    mutationFn: () => withToast(A.updateChapterSettings(form), 'Stamp card updated'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-kathaa', 'chapter-settings'] }),
  });
  const errs: string[] = [];
  if (!Number.isInteger(form.stampsPerChapter) || form.stampsPerChapter < 2 || form.stampsPerChapter > 30) errs.push('Stamps per chapter must be 2–30');
  if (!form.rewardText.trim() || form.rewardText.length > 120) errs.push('Reward text is required (max 120 characters)');
  const cols: ColDef<AdminReservationRow>[] = [
    { field: 'slotKey', headerName: 'Slot', sort: 'desc' }, { field: 'zoneName', headerName: 'Area' },
    { field: 'guests', headerName: 'Guests', width: 100 }, { field: 'bookTitle', headerName: 'Book to keep' },
    { field: 'withPet', headerName: 'Pet', width: 90 }, { field: 'petName', headerName: 'Pet name' },
    { field: 'occasion', headerName: 'Occasion' }, { field: 'note', headerName: 'Note', flex: 1 }, { field: 'orderId', headerName: 'Order #', width: 100 },
  ];
  return (
    <div className="space-y-8">
      <section className="max-w-xl space-y-3 rounded-md border p-4">
        <h3 className="font-semibold">Chapters stamp card</h3>
        {errs.length > 0 && <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/5 p-2 text-sm text-destructive">{errs.map((e) => <p key={e}>{e}</p>)}</div>}
        <div className="flex items-center gap-3">
          <Switch id="cs-enabled" checked={form.enabled} onCheckedChange={(c) => setForm({ ...form, enabled: c })} />
          <Label htmlFor="cs-enabled">Stamp card active</Label>
        </div>
        <div><Label htmlFor="cs-n">Stamps per chapter</Label>
          <Input id="cs-n" type="number" value={form.stampsPerChapter} className={errs[0]?.startsWith('Stamps') ? 'border-destructive focus-visible:ring-destructive' : ''}
            onChange={(e) => setForm({ ...form, stampsPerChapter: Number(e.target.value) })} /></div>
        <div><Label htmlFor="cs-r">Reward when a chapter is complete</Label>
          <Input id="cs-r" value={form.rewardText} onChange={(e) => setForm({ ...form, rewardText: e.target.value })} /></div>
        <Button disabled={errs.length > 0 || save.isPending} onClick={() => save.mutate()}>Save</Button>
      </section>
      <section>
        <h3 className="mb-2 font-semibold">Booking extras</h3>
        <p className="mb-3 text-sm text-muted-foreground">Move bookings through Confirmed → Seated → Finished on the Orders board (workflow “Table bookings”). This list shows what each guest asked for.</p>
        <AdminDataGrid<AdminReservationRow> rowData={data} columnDefs={cols} emptyMessage="No bookings yet." height="calc(100vh - 520px)" />
      </section>
    </div>
  );
}

/** Cafe Kathaa CMS — menu, seating, shelf, margin notes, story and the stamp card in one place. */
export default function AdminKathaaPage() {
  return (
    <div className="space-y-4 p-1">
      <div>
        <h1 className="text-2xl font-bold">Cafe Kathaa</h1>
        <p className="text-sm text-muted-foreground">Everything on the public site that isn’t an order. Orders and bookings move on the Orders board.</p>
      </div>
      <Tabs defaultValue="menu">
        <TabsList className="flex-wrap">
          <TabsTrigger value="menu">Menu</TabsTrigger>
          <TabsTrigger value="seating">Seating</TabsTrigger>
          <TabsTrigger value="shelf">The Shelf</TabsTrigger>
          <TabsTrigger value="notes">Margin notes</TabsTrigger>
          <TabsTrigger value="story">Story</TabsTrigger>
          <TabsTrigger value="bookings">Bookings & stamps</TabsTrigger>
        </TabsList>
        <TabsContent value="menu">
          <KathaaCrudTab<MenuDish & Record<string, unknown>> entity="Dish" queryKey="menu" list={A.menu as never}
            create={(b) => A.createDish(b as never)} update={(id, b) => A.updateDish(id, b as never)} remove={A.deleteDish} bulk={A.bulkMenu}
            fields={dishFields}
            empty={{ name: '', category: '', price: null, diet: 'VEG', signature: false, active: true, sortOrder: 100, description: '', pageNote: '', imageUrl: null } as AnyBody}
            columns={[{ field: 'name', headerName: 'Dish', flex: 1 }, { field: 'category', headerName: 'Section' },
              { field: 'price', headerName: 'Price', valueFormatter: (p) => rupees(p.value as number) }, { field: 'diet', headerName: 'Diet', width: 110 },
              { field: 'signature', headerName: 'House pick', width: 120 }, { field: 'active', headerName: 'On menu', width: 110 }]}
            bulkColumns={['name', 'category', 'price', 'diet', 'description', 'pageNote', 'signature', 'sortOrder', 'imageUrl']}
            bulkSample={['Masala Chai', 'Drinks', '90', 'VEG', 'Kadak, with ginger', 'For the first chapter', 'false', '20', '']} />
        </TabsContent>
        <TabsContent value="seating">
          <KathaaCrudTab<SeatingZone & Record<string, unknown>> entity="Seating area" queryKey="seating" list={A.seating as never}
            create={(b) => A.createZone(b as never)} update={(id, b) => A.updateZone(id, b as never)} remove={A.deleteZone} bulk={A.bulkSeating}
            fields={zoneFields}
            extraValidate={(f) => (Number(f.maxParty) > Number(f.seatsPerSlot) ? ['Largest party can’t exceed seats per slot'] : [])}
            empty={{ name: '', tagline: '', description: '', seatsPerSlot: 12, maxParty: 4, firstSlot: '10:00', lastSlot: '21:00', slotMinutes: 90, petFriendly: false, workFriendly: false, active: true, sortOrder: 100, imageUrl: null } as AnyBody}
            columns={[{ field: 'name', headerName: 'Area', flex: 1 }, { field: 'seatsPerSlot', headerName: 'Seats/slot' },
              { field: 'maxParty', headerName: 'Max party' }, { field: 'firstSlot', headerName: 'From' }, { field: 'lastSlot', headerName: 'Last slot' },
              { field: 'slotMinutes', headerName: 'Minutes' }, { field: 'petFriendly', headerName: 'Pets' }, { field: 'active', headerName: 'Active' }]}
            bulkColumns={['name', 'tagline', 'description', 'seatsPerSlot', 'maxParty', 'firstSlot', 'lastSlot', 'slotMinutes', 'petFriendly', 'workFriendly', 'sortOrder']}
            bulkSample={['Terrace', 'Evenings only', 'Upstairs under the neem', '16', '6', '17:00', '21:00', '90', 'false', 'false', '4']} />
        </TabsContent>
        <TabsContent value="shelf">
          <KathaaCrudTab<ShelfBook & Record<string, unknown>> entity="Book" queryKey="shelf" list={A.shelf as never}
            create={(b) => A.createBook(b as never)} update={(id, b) => A.updateBook(id, b as never)} remove={A.deleteBook} bulk={A.bulkShelf}
            fields={bookFields}
            empty={{ title: '', author: '', language: 'English', genre: '', blurb: '', copies: 1, staffPick: false, active: true, coverUrl: null } as AnyBody}
            columns={[{ field: 'title', headerName: 'Title', flex: 1 }, { field: 'author', headerName: 'Author', flex: 1 },
              { field: 'language', headerName: 'Language' }, { field: 'copies', headerName: 'Copies', width: 100 },
              { field: 'staffPick', headerName: 'Staff pick', width: 110 }, { field: 'active', headerName: 'On shelf', width: 110 }]}
            bulkColumns={['title', 'author', 'language', 'genre', 'blurb', 'copies', 'staffPick', 'coverUrl']}
            bulkSample={['Vyakti ani Valli', 'P. L. Deshpande', 'मराठी', 'Humour', 'Character sketches', '1', 'true', '']} />
        </TabsContent>
        <TabsContent value="notes"><NotesTab /></TabsContent>
        <TabsContent value="story">
          <KathaaCrudTab<StoryChapter & Record<string, unknown>> entity="Story chapter" queryKey="story" list={A.story as never}
            create={(b) => A.createChapter(b as never)} update={(id, b) => A.updateChapter(id, b as never)} remove={A.deleteChapter} bulk={A.bulkStory}
            fields={storyFields}
            empty={{ marker: '', title: '', body: '', imageUrl: null, sortOrder: 100, active: true } as AnyBody}
            columns={[{ field: 'sortOrder', headerName: '#', width: 80 }, { field: 'marker', headerName: 'Marker' },
              { field: 'title', headerName: 'Title', flex: 1 }, { field: 'active', headerName: 'Shown', width: 100 }]}
            bulkColumns={['marker', 'title', 'body', 'sortOrder', 'imageUrl']}
            bulkSample={['2024', 'The garden grows', 'More tables under the trees.', '6', '']} />
        </TabsContent>
        <TabsContent value="bookings"><BookingsTab /></TabsContent>
      </Tabs>
    </div>
  );
}
