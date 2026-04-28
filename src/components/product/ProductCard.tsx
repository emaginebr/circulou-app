import { Link, useNavigate } from 'react-router-dom';
import type { ProductInfo } from '@/types/product';
import type { StoreInfo } from '@/types/store';
import { PriceTag } from '@/components/product/PriceTag';

const PLACEHOLDER =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="%23eef2ee"/><text x="50%" y="50%" font-family="sans-serif" font-size="14" fill="%2390a4ae" text-anchor="middle" dy=".3em">Sem imagem</text></svg>';

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

  const handleCardClick = () => {
    navigate(productHref, { state: { product } });
  };

  return (
    <article
      className="circulou-card flex flex-col h-full bg-white border border-gray-200 rounded-[var(--radius)] overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={e => {
        if (e.key === 'Enter') handleCardClick();
      }}
    >
      <img
        src={product.imageUrl || PLACEHOLDER}
        alt={product.name}
        className="w-full aspect-square object-cover"
        loading="lazy"
        onError={e => {
          (e.currentTarget as HTMLImageElement).src = PLACEHOLDER;
        }}
      />
      <div className="flex flex-col gap-2 p-3 grow">
        <h3 className="text-base font-medium leading-snug">{product.name}</h3>
        <PriceTag price={product.price} discount={product.discount} />
        {storeHref && store ? (
          <Link
            to={storeHref}
            className="text-sm text-[var(--color-primary)] hover:underline mt-auto"
            onClick={e => e.stopPropagation()}
          >
            {store.name}
          </Link>
        ) : null}
      </div>
    </article>
  );
};
