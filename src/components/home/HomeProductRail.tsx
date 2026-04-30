import { Link } from 'react-router-dom';
import { ProductCard } from '@/components/product/ProductCard';
import type { ProductInfo } from '@/types/product';
import type { StoreInfo } from '@/types/store';

interface HomeProductRailProps {
  products: ProductInfo[];
  storesById?: Map<number, StoreInfo>;
}

export const HomeProductRail = ({ products, storesById }: HomeProductRailProps) => {
  if (products.length === 0) return null;

  return (
    <section
      aria-labelledby="hotnews-title"
      className="mx-auto w-full max-w-[1280px] px-6 lg:px-10"
      style={{
        paddingTop: 'var(--space-section-tight)',
        paddingBottom: 'var(--space-section-tight)',
      }}
    >
      <header className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <span className="circulou-tag">★ Hot News</span>
          <h2
            id="hotnews-title"
            className="mt-2"
            style={{ fontSize: 'var(--text-display-md)' }}
          >
            Suéteres & tricôs que acabaram de chegar
          </h2>
          <p
            className="mt-2 max-w-[50ch]"
            style={{ color: 'var(--color-mute)' }}
          >
            Onze produtos garimpados nos últimos sete dias, prontos pra circular.
          </p>
        </div>
        {/* TODO rota /search?categoria=hot-news */}
        <Link to="/search" className="circulou-btn-ghost">
          Ver todos →
        </Link>
      </header>

      <div
        className="circulou-rail"
        role="list"
        aria-label="Carrossel de produtos Hot News"
      >
        {products.map(p => {
          const store =
            p.storeId !== null && storesById
              ? storesById.get(p.storeId) ?? undefined
              : undefined;
          return (
            <div
              key={p.productId}
              role="listitem"
              className="w-[240px] sm:w-[260px]"
            >
              <ProductCard product={p} store={store} />
            </div>
          );
        })}
      </div>
    </section>
  );
};
