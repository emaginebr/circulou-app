import type { StoreInCategory } from '@/types/category';
import { StoreInCategoryCard } from '@/components/category/StoreInCategoryCard';

interface StoresInCategoryRailProps {
  stores: StoreInCategory[];
  categorySlug: string;
  categoryName: string;
}

export const StoresInCategoryRail = ({
  stores,
  categorySlug,
  categoryName,
}: StoresInCategoryRailProps) => {
  if (stores.length === 0) return null;

  return (
    <section
      aria-labelledby="stores-title"
      style={{
        background: 'var(--color-areia)',
        padding: 'var(--space-section-tight) 0',
        borderTop: '1px solid var(--color-line)',
      }}
    >
      <div className="mx-auto w-full max-w-[1280px] px-6 lg:px-10">
        <header className="flex justify-between items-end mb-8 gap-4 flex-wrap">
          <div>
            <span
              className="circulou-tag"
              style={{
                background: 'var(--color-cobre)',
                color: 'var(--color-cru)',
              }}
            >
              ○ Lojas parceiras
            </span>
            <h2
              id="stores-title"
              className="mt-2"
              style={{ fontSize: 'var(--text-display-md)' }}
            >
              Lojas com {categoryName.toLowerCase()} pra você
            </h2>
            <p
              className="max-w-[56ch] mt-2"
              style={{ color: 'var(--color-ink-soft)' }}
            >
              {stores.length} {stores.length === 1 ? 'loja tem' : 'lojas têm'} produtos nesta categoria. Conheça quem garimpa por aí.
            </p>
          </div>
        </header>

        <div className="circulou-rail" role="list" aria-label={`Lojas com produtos em ${categoryName}`}>
          {stores.map(store => (
            <StoreInCategoryCard
              key={store.storeId}
              store={store}
              categorySlug={categorySlug}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
