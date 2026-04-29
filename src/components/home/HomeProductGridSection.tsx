import { Link } from 'react-router-dom';
import { ProductCard } from '@/components/product/ProductCard';
import type { ProductInfo } from '@/types/product';
import type { StoreInfo } from '@/types/store';

interface HomeProductGridSectionProps {
  products: ProductInfo[];
  storesById?: Map<number, StoreInfo>;
}

export const HomeProductGridSection = ({
  products,
  storesById,
}: HomeProductGridSectionProps) => {
  if (products.length === 0) return null;

  return (
    <section
      aria-labelledby="alfaiataria-title"
      className="mx-auto w-full max-w-[1280px] px-6 lg:px-10"
      style={{
        paddingTop: 'var(--space-section-tight)',
        paddingBottom: 'var(--space-section-tight)',
      }}
    >
      <header className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <span className="circulou-tag">○ Seleção Alfaiataria</span>
          <h2
            id="alfaiataria-title"
            className="mt-2"
            style={{ fontSize: 'var(--text-display-md)' }}
          >
            O blazer certo, no preço justo
          </h2>
        </div>
        {/* TODO rota /search?categoria=alfaiataria */}
        <Link to="/search" className="circulou-btn-ghost">
          Ver toda seleção →
        </Link>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {products.map(p => {
          const store =
            p.storeId !== null && storesById
              ? storesById.get(p.storeId) ?? undefined
              : undefined;
          return <ProductCard key={p.productId} product={p} store={store} />;
        })}
      </div>
    </section>
  );
};
