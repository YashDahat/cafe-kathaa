import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import ChapterHeading from '@/components/kathaa/ChapterHeading';
import Stamp from '@/components/kathaa/Stamp';
import Reveal from '@/components/kathaa/Reveal';
import { useAddMarginNote, useMarginNotes, useShelf } from '@/hooks/kathaaHooks';
import { useAuth } from '@/context/AuthContext';
import { whatsappShare } from '@/lib/kathaa';
import { cn } from '@/lib/utils';
import type { ShelfBook } from '@/types/kathaa';

const SPINES = ['bg-primary text-primary-foreground', 'bg-[hsl(var(--espresso))] text-background', 'bg-secondary text-secondary-foreground', 'bg-accent text-accent-foreground'];

/** The Shelf: the cafe's reading library online. Hold a book for your table; read and pencil margin notes. */
export default function ShelfPage() {
  const { data: books, isLoading } = useShelf();
  const [language, setLanguage] = useState('All');
  const [open, setOpen] = useState<ShelfBook | null>(null);
  const langs = ['All', ...Array.from(new Set((books ?? []).map((b) => b.language)))];
  const shown = (books ?? []).filter((b) => language === 'All' || b.language === language);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-12">
      <ChapterHeading number="S" accent="पुस्तके" title="The Shelf"
        intro="Browse what’s on our walls before you come. Pick one and we’ll have it waiting at your table — or read what other regulars pencilled in its margins." />

      <div className="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Language">
        {langs.map((l) => (
          <button key={l} type="button" role="tab" aria-selected={language === l} onClick={() => setLanguage(l)}
            className={cn('kt-tap rounded-sm border px-3 text-base',
              language === l ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:border-primary')}>
            <span lang={l === 'मराठी' ? 'mr' : l === 'हिंदी' ? 'hi' : undefined}>{l}</span>
          </button>
        ))}
      </div>

      {/* Spines on a shelf */}
      <ul className="mt-10 grid grid-cols-2 gap-x-3 gap-y-8 border-b-8 border-[hsl(var(--tan)/0.6)] pb-1 sm:grid-cols-4 lg:grid-cols-5">
        {isLoading && Array.from({ length: 10 }).map((_, i) => <li key={i}><Skeleton className="h-56" /></li>)}
        {shown.map((b, i) => (
          <li key={b.id}>
            <Reveal variant="stamp" delay={(i % 5) * 60} className="h-full">
              <button type="button" onClick={() => setOpen(b)}
                className={cn('kt-pageturn relative flex h-56 w-full flex-col justify-between rounded-sm p-4 text-left shadow-sm', SPINES[i % SPINES.length])}
                aria-label={`${b.title} by ${b.author} — open`}>
                <span className="kt-mono text-[0.65rem] uppercase tracking-[0.2em] opacity-80"
                  lang={b.language === 'मराठी' ? 'mr' : b.language === 'हिंदी' ? 'hi' : undefined}>{b.language} · {b.genre}</span>
                <span className="kt-display text-2xl leading-tight">{b.title}</span>
                <span className="text-sm opacity-90">{b.author}</span>
                {b.staffPick && <span className="absolute -right-2 -top-3"><Stamp className="bg-background">Staff pick</Stamp></span>}
                {b.noteCount > 0 && <span className="kt-mono absolute bottom-3 right-3 text-xs opacity-80">✎ {b.noteCount}</span>}
              </button>
            </Reveal>
          </li>
        ))}
      </ul>
      {!isLoading && shown.length === 0 && <p className="mt-8 text-muted-foreground">This shelf is empty for now.</p>}

      <BookSheet book={open} onClose={() => setOpen(null)} />
    </div>
  );
}

function BookSheet({ book, onClose }: { book: ShelfBook | null; onClose: () => void }) {
  const { data: notes, isLoading } = useMarginNotes(book?.id ?? null);
  const add = useAddMarginNote(book?.id ?? null);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const tooShort = text.trim().length > 0 && text.trim().length < 3;
  const tooLong = text.length > 160;

  const submit = async () => {
    if (tooShort || tooLong || text.trim().length < 3) return;
    await add.mutateAsync(text.trim());
    setText('');
  };

  return (
    <Sheet open={!!book} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {book && (
          <>
            <SheetHeader>
              <SheetTitle className="kt-display text-3xl">{book.title}</SheetTitle>
              <SheetDescription className="text-base">{book.author} · {book.language}{book.genre ? ` · ${book.genre}` : ''}</SheetDescription>
            </SheetHeader>
            {book.blurb && <p className="mt-4 text-lg italic">{book.blurb}</p>}
            <div className="mt-6 flex flex-wrap gap-2">
              <Button className="kt-tap" onClick={() => navigate(`/book?bookId=${book.id}`)}>Keep it at my table</Button>
              <Button asChild variant="outline" className="kt-tap">
                <a href={whatsappShare(`“${book.title}” is on the shelf at Cafe Kathaa, FC Road. Read it with me? ${window.location.origin}/shelf`)}
                  target="_blank" rel="noreferrer"><Share2 size={18} className="mr-1" /> Share</a>
              </Button>
            </div>

            <h3 className="kt-mono mt-10 text-xs uppercase tracking-[0.2em] text-muted-foreground">Margin notes</h3>
            <div className="kt-card mt-3 px-4 py-4 pl-12">
              {isLoading && <Skeleton className="h-16" />}
              {!isLoading && (notes ?? []).length === 0 && <p className="text-muted-foreground">No notes yet. Be the first to pencil one in.</p>}
              <ul className="space-y-4">
                {notes?.map((n) => (
                  <li key={n.id}>
                    <p className="text-lg italic">“{n.text}”</p>
                    <p className="kt-mono text-xs text-muted-foreground">— {n.authorName ?? 'A reader'}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6">
              {isAuthenticated ? (
                <>
                  {(tooShort || tooLong) && (
                    <div role="alert" className="mb-2 rounded-sm border border-destructive/50 bg-destructive/5 p-2 text-sm text-destructive">
                      A margin note is 3–160 characters.
                    </div>
                  )}
                  <Label htmlFor="note" className="text-base">Leave a margin note</Label>
                  <Textarea id="note" value={text} onChange={(e) => setText(e.target.value)} rows={2}
                    className={cn('mt-2 text-base', (tooShort || tooLong) && 'border-destructive focus-visible:ring-destructive')}
                    placeholder="Read chapter four with the pineapple cooler." />
                  <div className="mt-2 flex items-center justify-between">
                    <span className="kt-mono text-xs text-muted-foreground">{text.length}/160 · shown after staff approve</span>
                    <Button className="kt-tap" disabled={text.trim().length < 3 || tooLong || add.isPending} onClick={submit}>Pencil it in</Button>
                  </div>
                </>
              ) : (
                <p className="text-base"><Link to="/login?redirect=%2Fshelf" className="kt-link">Log in</Link> to leave a margin note.</p>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
