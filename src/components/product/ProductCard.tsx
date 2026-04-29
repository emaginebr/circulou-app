import { Link, useNavigate } from 'react-router-dom';
import type { ProductInfo } from '@/types/product';
import type { StoreInfo } from '@/types/store';
import { PriceTag } from '@/components/product/PriceTag';

const PLACEHOLDER =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="%23efe3c7"/><text x="50%" y="50%" font-family="sans-serif" font-size="14" fill="%238a7e6f" text-anchor="middle" dy=".3em">Sem imagem</text></svg>';

interface ProductCardProps {
  product: ProductInfo;
  store?: StoreInfo;
}

export const ProductCard = ({ product, store }: ProductCardProps) => {
  const navigate = useNavigate();
  const storeSlug = store?.slug ?? '';
  const productHref = storeSlug
    ? `/product/${storeSlug}/${product.slug}`
    : `/product/-/${product.slug}`;
  const storeHref = storeSlug ? `/loja/${storeSlug}` : undefined;

  const primaryImage =
    product.imageUrl ||
    [...(product.images ?? [])]
      .sort((a, b) => a.sortOrder - b.sortOrder)[0]?.imageUrl ||
    PLACEHOLDER;

  const handleCardClick = () => {
    navigate(productHref, { state: { product } });
  };

  return (
    <article
      className="circulou-card flex flex-col h-full overflow-hidden cursor-pointer focus:outline-none"
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={e => {
        if (e.key === 'Enter') handleCardClick();
      }}
      style={{
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--color-line)',
      }}
    >
      <img
        src={primaryImage}
        alt={product.name}
        className="w-full object-cover"
        loading="lazy"
        style={{ aspectRatio: '3 / 4', background: 'var(--color-areia-soft)' }}
        onError={e => {
          (e.currentTarget as HTMLImageElement).src = PLACEHOLDER;
        }}
      />
      <div className="flex flex-col gap-1.5 p-4 grow">
        {store ? (
          <span
            className="brand-label"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--color-cedro)',
            }}
          >
            {store.name}
          </span>
        ) : null}
        <h3
          className="product-name leading-snug"
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.95rem',
            fontWeight: 600,
            color: 'var(--color-tinta)',
            margin: 0,
          }}
        >
          {product.name}
        </h3>
        <PriceTag price={product.price} discount={product.discount} />
        {storeHref && store ? (
          <Link
            to={storeHref}
            className="text-sm hover:underline mt-auto no-underline"
            style={{ color: 'var(--color-cobre)' }}
            onClick={e => e.stopPropagation()}
          >
            {store.name}
          </Link>
        ) : null}
      </div>
    </article>
  );
};
