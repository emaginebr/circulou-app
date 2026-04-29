import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { useStores } from '@/hooks/useStores';
import { productsService } from '@/Services/ProductsService';
import { ProductStatusEnum } from '@/types/product';
import type { ProductInfo } from '@/types/product';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { ProductGallery } from '@/components/product/ProductGallery';
import { PriceTag } from '@/components/product/PriceTag';

interface LocationStateWithProduct {
  product?: ProductInfo;
}

export const ProductPage = () => {
  const { storeSlug = '', productSlug = '' } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const initialFromState = (location.state as LocationStateWithProduct | null)?.product;

  const { isAuthenticated } = useAuth();
  const { add } = useCart();
  const { storesById } = useStores();

  const [product, setProduct] = useState<ProductInfo | null>(initialFromState ?? null);
  const [loading, setLoading] = useState(!initialFromState);
  const [error, setError] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (initialFromState && initialFromState.slug === productSlug) return;
    setLoading(true);
    setError(null);
    productsService
      .getByStoreAndSlug(storeSlug, productSlug)
      .then(p => {
        if (!cancelled) setProduct(p);
      })
      .catch(err => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Falha ao carregar produto');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [storeSlug, productSlug, initialFromState]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} />;
  if (!product) {
    return <ErrorState message="Produto não encontrado." />;
  }

  const limit = product.limit > 0 ? product.limit : 99;
  const isInactive = product.status !== ProductStatusEnum.Active;
  const store = product.storeId !== null ? storesById.get(product.storeId) : undefined;

  const handleAdd = async () => {
    if (!isAuthenticated) {
      setAdding(true);
      try {
        await add(product, qty, storeSlug);
        toast.success('Item salvo. Faça login para confirmar.');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Falha ao adicionar');
      } finally {
        setAdding(false);
      }
      navigate('/login', {
        state: { from: location.pathname + location.search },
      });
      return;
    }
    setAdding(true);
    try {
      const result = await add(product, qty, storeSlug);
      if (result.refusedReason === 'unavailable') {
        toast.error('Produto indisponível.');
      } else if (result.refusedReason === 'limit_exceeded') {
        toast.warning(`Quantidade ajustada ao limite (${result.effectiveQty}).`);
      } else {
        toast.success('Adicionado ao carrinho');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao adicionar');
    } finally {
      setAdding(false);
    }
  };

  return (
    <article className="max-w-7xl mx-auto px-4 py-4">
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 md:col-span-6">
          <ProductGallery
            images={product.images ?? []}
            fallbackUrl={product.imageUrl}
            productName={product.name}
          />
        </div>
        <div className="col-span-12 md:col-span-6">
          <h1 className="text-2xl font-semibold">{product.name}</h1>
          {store ? (
            <Link
              to={`/loja/${store.slug}`}
              className="block text-sm text-[var(--color-primary)] hover:underline mb-2"
            >
              {store.name}
            </Link>
          ) : null}
          <PriceTag price={product.price} discount={product.discount} />
          {product.frequency > 0 ? (
            <span className="inline-block px-2 py-0.5 text-xs rounded bg-blue-500 text-white mt-2">
              Recorrente
            </span>
          ) : null}
          {isInactive ? (
            <div
              className="bg-yellow-50 border border-yellow-200 text-yellow-900 rounded-[var(--radius)] p-3 mt-3"
              role="alert"
            >
              Produto indisponível no momento.
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-3">
              <label htmlFor="qty" className="text-sm font-medium mb-0">
                Quantidade
              </label>
              <input
                id="qty"
                type="number"
                className="w-20 rounded-[var(--radius-sm)] border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                min={1}
                max={limit}
                value={qty}
                onChange={e =>
                  setQty(Math.max(1, Math.min(limit, Number(e.target.value) || 1)))
                }
              />
              <small className="text-[var(--color-mute)]">limite {limit}</small>
            </div>
          )}
          <button
            type="button"
            className="inline-flex items-center mt-3 px-4 py-2 bg-[var(--color-primary)] text-white rounded-[var(--radius)] hover:bg-[var(--color-primary-hover)] transition disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => void handleAdd()}
            disabled={adding || isInactive}
          >
            {adding ? '...' : 'Adicionar ao carrinho'}
          </button>
          <hr className="border-gray-200 my-4" />
          <div className="markdown-body prose prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {product.description ?? ''}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </article>
  );
};
