import { Heart, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useCart } from '@/cart';
import { useAuth } from '@/context/AuthContext';
import { useFavourites, useToggleFavourite } from '@/hooks/kathaaHooks';
import { withToast } from '@/lib/apiToast';
import { rupees } from '@/lib/kathaa';
import type { MenuDish } from '@/types/kathaa';
import DietMark from './DietMark';
import Stamp from './Stamp';

/** A menu entry written like a catalogue card: call number, title, margin note, ₹ price, favourite + add. */
export default function DishCard({ dish, index }: { dish: MenuDish; index: number }) {
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { data: favourites } = useFavourites();
  const toggle = useToggleFavourite();
  const isFav = !!favourites?.some((f) => f.id === dish.id);

  const add = () => {
    addItem({
      id: `MENU_DISH:${dish.id}`, name: dish.name, unitPrice: Number(dish.price), imageUrl: dish.imageUrl,
      metadata: { itemType: 'MENU_DISH', itemId: dish.id },
    });
    void withToast(Promise.resolve(), `${dish.name} added to your takeaway`);
  };

  const fav = () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent('/menu')}`);
      return;
    }
    toggle.mutate(dish.id);
  };

  return (
    <article id={dish.slug} className="kt-card-plain kt-pageturn relative flex h-full flex-col p-5" aria-labelledby={`dish-${dish.id}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="kt-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
          {dish.category} · {String(index + 1).padStart(3, '0')}
        </p>
        {dish.signature && <Stamp className="shrink-0">House pick</Stamp>}
      </div>
      <h3 id={`dish-${dish.id}`} className="mt-3 flex items-start gap-2 text-xl font-semibold leading-snug">
        <DietMark diet={dish.diet} className="mt-1.5" />
        <span>{dish.name}</span>
      </h3>
      {dish.description && <p className="mt-2 text-base text-muted-foreground">{dish.description}</p>}
      {dish.pageNote && (
        <p className="mt-3 border-l-2 border-accent/60 pl-3 text-base italic text-foreground/80">{dish.pageNote}</p>
      )}
      <div className="mt-auto flex items-center justify-between gap-2 pt-5">
        <span className="kt-mono text-lg font-semibold">{rupees(dish.price)}</span>
        <div className="flex items-center gap-1">
          <Button
            type="button" variant="ghost" size="icon" className="kt-tap" onClick={fav}
            aria-pressed={isFav} aria-label={isFav ? `Remove ${dish.name} from favourites` : `Save ${dish.name} to favourites`}
          >
            <Heart className={isFav ? 'fill-accent text-accent' : ''} size={20} />
          </Button>
          <Button type="button" onClick={add} className="kt-tap gap-1" aria-label={`Add ${dish.name} to takeaway`}>
            <Plus size={18} /> Add
          </Button>
        </div>
      </div>
    </article>
  );
}
