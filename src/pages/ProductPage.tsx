import { useEffect, useMemo, useState } from 'react';
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
import { ProductPriceBlock } from '@/components/product/ProductPriceBlock';
import { ProductStateBadges } from '@/components/product/ProductStateBadges';
import { ProductQtyCtaRow } from '@/components/product/ProductQtyCtaRow';
import { ProductDescription } from '@/components/product/ProductDescription';
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

  // Fetch base do produto. Quando navega entre produtos (mesma instância
  // do componente) o `productSlug` muda — precisamos sincronizar o `product`
  // state, seja a partir do `state` da rota ou de uma chamada fresca.
  useEffect(() => {
    let cancelled = false;
    if (initialFromState && initialFromState.slug === productSlug) {
      setProduct(initialFromState);
      setLoading(false);
      setError(null);
      return;
    }
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

  // Atributos exibidos: se o produto tem `filterValues[]` reais (do
  // Tipo de Produto da categoria), usa esses; senão cai no mock.
  const displayAttributes = useMemo<ProductAttributesData | null>(() => {
    const fv = product?.filterValues;
    if (!product || !fv || fv.length === 0) return attributes;
    const sizeFilter = fv.find(f => f.filterLabel.toLowerCase().includes('tamanho'));
    const conditionRaw = fv.find(f => f.filterLabel.toLowerCase().includes('condição'))?.value ?? null;
    return {
      productId: product.productId,
      condition:
        conditionRaw === 'Nova com etiqueta'
          ? 'new-with-tag'
          : conditionRaw === 'Seminova'
            ? 'semi-new'
            : conditionRaw === 'Sinais de uso'
              ? 'signs-of-use'
              : 'great',
      sizeBr: sizeFilter?.value ?? null,
      groups: [
        {
          title: 'Geral',
          items: fv.map(f => ({ label: f.filterLabel, value: f.value })),
        },
      ],
    };
  }, [product, attributes]);

  if (loading && !product) return <LoadingSpinner />;
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

          <ProductPriceBlock price={product.price} discount={product.discount} />

          <ProductStateBadges product={product} attributes={displayAttributes} />

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

          {displayAttributes ? <ProductAttributes attributes={displayAttributes} /> : null}

          {store && reputation ? (
            <ProductSellerCompact store={store} reputation={reputation} />
          ) : null}
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
