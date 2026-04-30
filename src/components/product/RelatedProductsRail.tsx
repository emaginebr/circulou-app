import { Link } from 'react-router-dom';
import type { ProductInfo } from '@/types/product';
import type { StoreInfo } from '@/types/store';
import { ProductCard } from '@/components/product/ProductCard';

interface RelatedProductsRailProps {
  products: ProductInfo[];
  storesById: Map<number, StoreInfo>;
  /** Slug da categoria do produto, para o CTA "Ver toda categoria". */
  categorySlug?: string | null;
}

export const RelatedProductsRail = ({
  products,
  storesById,
  categorySlug,
}: RelatedProductsRailProps) => {
  if (products.length === 0) return null;

  const allCta = categorySlug ? `/${categorySlug}` : '/';

  return (
    <section
      aria-labelledby="pdp-related-title"
      className="mx-auto w-full max-w-[1280px] px-6 lg:px-10"
      style={{
        paddingTop: 'var(--space-section-tight)',
        paddingBottom: 'var(--space-section)',
      }}
    >
      <header className="flex items-end justify-between gap-4 flex-wrap mb-7">
        <div>
          <span className="circulou-tag">○ Você também vai gostar</span>
          <h2
            id="pdp-related-title"
            className="mt-2"
            style={{ fontSize: 'var(--text-display-md)' }}
          >
            Outras peças pra completar a vibe
          </h2>
          <p
            className="mt-2 max-w-[50ch]"
            style={{ color: 'var(--color-mute)' }}
          >
            Garimpamos peças parecidas em estilo e faixa de preço.
          </p>
        </div>
        <Link to={allCta} className="circulou-btn-ghost no-underline">
          Ver toda categoria →
        </Link>
      </header>

      <div
        className="circulou-rail"
        role="list"
        aria-label="Carrossel de produtos relacionados"
      >
        {products.map(p => {
          const store =
            p.storeId !== null ? storesById.get(p.storeId) ?? undefined : undefined;
          return (
            <div
              key={p.productId}
              role="listitem"
              className="w-[240px] sm:w-[260px]"
            >
              <ProductCard
                product={p}
                store={store}
                showStore
                storeName={store?.name}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
};
