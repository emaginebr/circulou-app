import type { ProductInfo } from '@/types/product';
import type { StoreInfo } from '@/types/store';
import { ProductCard } from '@/components/product/ProductCard';

interface ProductGridProps {
  products: ProductInfo[];
  storesById?: Map<number, StoreInfo>;
}

export const ProductGrid = ({ products, storesById }: ProductGridProps) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    {products.map(p => {
      const store =
        p.storeId !== null && storesById ? storesById.get(p.storeId) ?? undefined : undefined;
      return <ProductCard key={p.productId} product={p} store={store} />;
    })}
  </div>
);
