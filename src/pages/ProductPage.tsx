import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { useStores } from '@/hooks/useStores';
import { productsService } from '@/Services/ProductsService';
import { storesService } from '@/Services/StoresService';
import { categoriesService } from '@/Services/CategoriesService';
import { ProductStatusEnum } from '@/types/product';
import type { ProductInfo } from '@/types/product';
import type { ProductAttributes as ProductAttributesData } from '@/types/productAttributes';
import type { StoreReputation } from '@/types/storeReputation';
import type { CategoryNode } from '@/types/category';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { ProductGallery } from '@/components/product/ProductGallery';
import { ProductBreadcrumb } from '@/components/product/ProductBreadcrumb';
import { ProductCategoryChip } from '@/components/product/ProductCategoryChip';
import { ProductPriceBlock } from '@/components/product/ProductPriceBlock';
import { ProductStateBadges } from '@/components/product/ProductStateBadges';
import { ProductQtyCtaRow } from '@/components/product/ProductQtyCtaRow';
import { ProductDescription } from '@/components/product/ProductDescription';
import { ProductShippingCalculator } from '@/components/product/ProductShippingCalculator';
import { ProductSellerCompact } from '@/components/product/ProductSellerCompact';
import { ProductAttributes } from '@/components/product/ProductAttributes';
import { RelatedProductsRail } from '@/components/product/RelatedProductsRail';

interface LocationStateWithProduct {
  product?: ProductInfo;
}

const findCategorySlug = (tree: CategoryNode[], categoryId: number): string | null => {
  for (const node of tree) {
    if (node.categoryId === categoryId) return node.slug;
    if (node.children) {
      const inner = findCategorySlug(node.children, categoryId);
      if (inner) return inner;
    }
  }
  return null;
};

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
  const [isFav, setIsFav] = useState(false);

  // Attrs / reputation / related — todos mocks client-side.
  const [attributes, setAttributes] = useState<ProductAttributesData | null>(null);
  const [reputation, setReputation] = useState<StoreReputation | null>(null);
  const [related, setRelated] = useState<ProductInfo[]>([]);
  const [categorySlug, setCategorySlug] = useState<string | null>(null);

  // Fetch base do produto (mantém a lógica do ProductPage anterior).
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

  // Sobe pro topo a cada novo produto.
  useEffect(() => {
    if (product) {
      window.scrollTo({ top: 0, behavior: 'auto' });
      setQty(1);
      setIsFav(false);
    }
  }, [product?.productId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mocks LOFN-G30/G34/G35: atributos + relacionados + reputação em paralelo.
  useEffect(() => {
    let cancelled = false;
    if (!product) {
      return () => {
        cancelled = true;
      };
    }
    const productId = product.productId;
    const categoryId = product.categoryId;
    const storeId = product.storeId;

    void Promise.all([
      productsService.getAttributes(productId, categoryId),
      productsService.getRelated(productId, categoryId, 6),
      storeId !== null ? storesService.getReputation(storeId) : Promise.resolve(null),
      categoryId !== null
        ? categoriesService.getMarketplaceCategoryTree()
        : Promise.resolve([] as CategoryNode[]),
    ]).then(([attrs, relatedItems, rep, tree]) => {
      if (cancelled) return;
      setAttributes(attrs);
      setRelated(relatedItems);
      setReputation(rep);
      setCategorySlug(categoryId !== null ? findCategorySlug(tree, categoryId) : null);
    });

    return () => {
      cancelled = true;
    };
  }, [product?.productId, product?.categoryId, product?.storeId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading && !product) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} />;
  if (!product) {
    return <ErrorState message="Produto não encontrado." />;
  }

  const limit = product.limit > 0 ? product.limit : 99;
  const isInactive = product.status !== ProductStatusEnum.Active;
  const store = product.storeId !== null ? storesById.get(product.storeId) : undefined;
  const sku = `SKU ${String(product.productId).padStart(6, '0')}`;
  // MOCK :: LOFN-G30 — "marca" derivada do mock de atributos quando houver,
  // senão fallback para o nome da loja como brand-line.
  const brandLine =
    attributes?.groups
      .find(g => g.title === 'Geral')
      ?.items.find(i => i.label === 'Marca')?.value ?? store?.name ?? 'Brechó parceiro';

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

  const toggleFav = () => {
    setIsFav(v => !v);
    toast.success(
      isFav ? 'Removido dos favoritos' : 'Salvo nos favoritos',
    );
  };

  return (
    <article className="mx-auto w-full max-w-[1280px] px-6 lg:px-10">
      {/* Breadcrumb */}
      <section className="pt-7 pb-4">
        <ProductBreadcrumb categoryId={product.categoryId} productName={product.name} />
      </section>

      {/* Grid 2-col em ≥1024 px (galeria sticky à esquerda + painel à direita). */}
      <section className="pdp-grid pb-12">
        <div className="pdp-gallery-col">
          <ProductGallery
            images={product.images ?? []}
            fallbackUrl={product.imageUrl}
            productName={product.name}
            soldOut={isInactive}
          />
        </div>

        <section className="flex flex-col gap-4" aria-labelledby="pdp-product-title">
          {/* Eyebrow brand + SKU */}
          <p
            className="flex items-center gap-2 m-0"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--color-cedro)',
            }}
          >
            <span aria-hidden="true">●</span>
            <span style={{ borderBottom: '1px dashed var(--color-line)', paddingBottom: 1 }}>
              {brandLine}
            </span>
            <span aria-hidden="true" style={{ color: 'var(--color-line)' }}>
              ·
            </span>
            <span>{sku}</span>
          </p>

          <h1
            id="pdp-product-title"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
              color: 'var(--color-cedro)',
              lineHeight: 1.1,
              letterSpacing: '-0.01em',
            }}
          >
            {product.name}
          </h1>

          <ProductCategoryChip categoryId={product.categoryId} />

          <ProductPriceBlock price={product.price} discount={product.discount} />

          <ProductStateBadges product={product} attributes={attributes} />

          <ProductQtyCtaRow
            qty={qty}
            setQty={setQty}
            limit={limit}
            adding={adding}
            disabled={isInactive}
            soldOut={isInactive}
            productName={product.name}
            onAddToCart={() => void handleAdd()}
            isFav={isFav}
            onToggleFav={toggleFav}
          />

          <ProductDescription markdown={product.description ?? ''} />

          <ProductShippingCalculator productId={product.productId} />

          {store && reputation ? (
            <ProductSellerCompact store={store} reputation={reputation} />
          ) : null}

          {attributes ? <ProductAttributes attributes={attributes} /> : null}
        </section>
      </section>

      <RelatedProductsRail
        products={related}
        storesById={storesById}
        categorySlug={categorySlug}
      />

      <style>{`
        .pdp-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
          align-items: start;
        }
        .pdp-grid > * { min-width: 0; }
        @media (min-width: 1024px) {
          .pdp-grid {
            grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
            gap: 3rem;
          }
          .pdp-gallery-col {
            position: sticky;
            top: 113px;
            align-self: start;
          }
        }
      `}</style>
    </article>
  );
};
