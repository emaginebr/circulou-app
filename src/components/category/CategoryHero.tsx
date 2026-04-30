import { Link } from 'react-router-dom';
import type { CategoryNode } from '@/types/category';

interface CategoryHeroProps {
  category: CategoryNode;
  parents: CategoryNode[];
  totalCount: number;
  totalStores: number;
}

export const CategoryHero = ({
  category,
  parents,
  totalCount,
  totalStores,
}: CategoryHeroProps) => (
  <section
    aria-labelledby="cat-title"
    className="relative overflow-hidden"
    style={{
      background: 'var(--color-surface-warm)',
      borderBottom: '1px solid var(--color-line)',
    }}
  >
    <span
      aria-hidden="true"
      className="absolute pointer-events-none"
      style={{
        width: 280,
        height: 280,
        right: -80,
        top: -120,
        background: 'var(--color-ambar)',
        borderRadius: '48% 52% 38% 62% / 42% 38% 62% 58%',
        opacity: 0.45,
      }}
    />
    <div className="relative z-[1] mx-auto w-full max-w-[1280px] px-6 lg:px-10 py-10">
      <nav
        aria-label="Caminho de navegação"
        className="flex items-center gap-2 mb-4"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-caption)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--color-mute)',
        }}
      >
        <Link to="/" className="no-underline" style={{ color: 'var(--color-mute)' }}>
          Início
        </Link>
        {parents.map(parent => (
          <span key={parent.slug} className="flex items-center gap-2">
            <span aria-hidden="true" style={{ color: 'var(--color-line)' }}>
              ›
            </span>
            <Link
              to={`/categoria/${parent.slug}`}
              className="no-underline"
              style={{ color: 'var(--color-mute)' }}
            >
              {parent.name}
            </Link>
          </span>
        ))}
        <span aria-hidden="true" style={{ color: 'var(--color-line)' }}>
          ›
        </span>
        <span aria-current="page" style={{ color: 'var(--color-cedro)', fontWeight: 500 }}>
          {category.name}
        </span>
      </nav>

      <h1
        id="cat-title"
        className="mb-3"
        style={{
          fontSize: 'var(--text-display-lg)',
          color: 'var(--color-cedro)',
        }}
      >
        {category.name}
      </h1>

      <p
        aria-live="polite"
        className="inline-flex items-center gap-2 mb-3"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.85rem',
          color: 'var(--color-oliva)',
        }}
      >
        <strong
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.15rem',
            color: 'var(--color-cobre)',
            fontWeight: 400,
          }}
        >
          {totalCount}
        </strong>
        produtos circulando agora
        <span style={{ color: 'var(--color-mute)' }}>
          · {totalStores} {totalStores === 1 ? 'loja parceira' : 'lojas parceiras'}
        </span>
      </p>

    </div>
  </section>
);
