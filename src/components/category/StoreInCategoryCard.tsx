import { Link } from 'react-router-dom';
import type { StoreInCategory } from '@/types/category';

interface StoreInCategoryCardProps {
  store: StoreInCategory;
  categorySlug: string;
}

export const StoreInCategoryCard = ({ store, categorySlug }: StoreInCategoryCardProps) => (
  <Link
    to={`/loja/${store.slug}?cat=${categorySlug}`}
    role="listitem"
    className="circulou-card flex flex-col gap-3 no-underline"
    style={{
      flex: '0 0 240px',
      scrollSnapAlign: 'start',
      background: 'var(--color-surface)',
      borderRadius: 'var(--radius)',
      padding: '1.25rem',
      border: '1px solid var(--color-line)',
      color: 'var(--color-ink)',
    }}
  >
    <div className="flex items-center gap-3">
      <div
        aria-hidden="true"
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          backgroundColor: 'var(--color-areia-soft)',
          backgroundImage: store.logoUrl ? `url('${store.logoUrl}')` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          border: '1.5px solid var(--color-line)',
          flexShrink: 0,
        }}
      />
      <div className="min-w-0">
        <div
          className="truncate"
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '1rem',
            fontWeight: 600,
            color: 'var(--color-cedro)',
          }}
        >
          {store.name}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.7rem',
            color: 'var(--color-mute)',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          ○ Brechó parceiro
        </div>
      </div>
    </div>
    <span
      className="mt-auto"
      style={{
        fontSize: '0.85rem',
        fontWeight: 600,
        color: 'var(--color-cobre)',
      }}
    >
      {store.productCount} {store.productCount === 1 ? 'peça nesta categoria' : 'peças nesta categoria'} →
    </span>
  </Link>
);
