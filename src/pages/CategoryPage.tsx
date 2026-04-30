import { useEffect, useMemo, useState, useCallback, type ReactNode } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useStores } from '@/hooks/useStores';
import { categoriesService } from '@/Services/CategoriesService';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { Pagination } from '@/components/ui/Pagination';
import { FiltersPanel } from '@/components/search/FiltersPanel';
import { SortControl } from '@/components/search/SortControl';
import { ProductCard } from '@/components/product/ProductCard';
import { CategoryHero } from '@/components/category/CategoryHero';
import { SubcategoryChips } from '@/components/category/SubcategoryChips';
import { StoresInCategoryRail } from '@/components/category/StoresInCategoryRail';
import { PAGE_SIZE } from '@/lib/pagination';
import type {
  CategoryNode,
  CategorySearchResult,
  StoreInCategory,
} from '@/types/category';
import type { FilterState, SortBy } from '@/types/search';

const parseNumber = (raw: string | null): number | null => {
  if (raw === null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
};

const SORT_VALUES: ReadonlyArray<SortBy> = [
  'relevance',
  'priceAsc',
  'priceDesc',
  'discount',
  'newest',
];

const parseSort = (raw: string | null): SortBy =>
  (SORT_VALUES as readonly string[]).includes(raw ?? '')
    ? (raw as SortBy)
    : 'relevance';

export const CategoryPage = () => {
  const params = useParams();
  // Rota /:slug/* — junta o primeiro segmento com o splat pra reconstruir
  // slugs hierárquicos (ex: "cursos/programacao").
  const rest = params['*'] ?? '';
  const slug = rest ? `${params.slug ?? ''}/${rest}` : params.slug ?? '';
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { storesById } = useStores();

  const [tree, setTree] = useState<CategoryNode[]>([]);
  const [result, setResult] = useState<CategorySearchResult | null>(null);
  const [storesInCategory, setStoresInCategory] = useState<StoreInCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filters = useMemo<FilterState>(
    () => ({
      storeId: parseNumber(searchParams.get('store')),
      priceMin: parseNumber(searchParams.get('min')),
      priceMax: parseNumber(searchParams.get('max')),
      onlyOnSale: searchParams.get('sale') === 'true' || searchParams.get('sale') === '1',
      categoryId: null,
      sort: parseSort(searchParams.get('sort')),
    }),
    [searchParams],
  );

  const page = parseNumber(searchParams.get('page')) ?? 1;
  const effectiveSlug = slug;

  const updateSearchParams = useCallback(
    (mutator: (next: URLSearchParams) => void) => {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        mutator(next);
        return next;
      });
    },
    [setSearchParams],
  );

  const setFilters = useCallback(
    (partial: Partial<FilterState>) =>
      updateSearchParams(next => {
        const apply = (key: string, value: unknown) => {
          if (value === null || value === undefined || value === '' || value === false)
            next.delete(key);
          else next.set(key, String(value));
        };
        if ('storeId' in partial) apply('store', partial.storeId);
        if ('priceMin' in partial) apply('min', partial.priceMin);
        if ('priceMax' in partial) apply('max', partial.priceMax);
        if ('onlyOnSale' in partial) apply('sale', partial.onlyOnSale);
        if ('sort' in partial && partial.sort) next.set('sort', partial.sort);
        next.delete('page');
      }),
    [updateSearchParams],
  );

  const setSort = useCallback(
    (sort: SortBy) =>
      updateSearchParams(next => {
        next.set('sort', sort);
        next.delete('page');
      }),
    [updateSearchParams],
  );

  const setPage = useCallback(
    (n: number) =>
      updateSearchParams(next => {
        if (n > 1) next.set('page', String(n));
        else next.delete('page');
      }),
    [updateSearchParams],
  );

  // Subcategoria agora vive na URL (slug hierárquico). Clicar num chip
  // navega pra /{full-slug}; "limpar" volta pra /{rootSlug} (a raiz).
  const setSubSlug = useCallback(
    (next: string | null) => {
      const target = next ?? slug.split('/')[0] ?? '';
      navigate(target ? `/${target}` : '/');
    },
    [navigate, slug],
  );

  const reset = useCallback(
    () =>
      updateSearchParams(next => {
        next.delete('store');
        next.delete('min');
        next.delete('max');
        next.delete('sale');
        next.delete('sort');
        next.delete('page');
      }),
    [updateSearchParams],
  );

  // Carrega árvore do marketplace (mock).
  useEffect(() => {
    let cancelled = false;
    void categoriesService
      .getMarketplaceCategoryTree()
      .then(t => {
        if (!cancelled) setTree(t);
      })
      .catch(() => {
        if (!cancelled) setTree([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Carrega resultado da busca paginada.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void categoriesService
      .searchInCategory(effectiveSlug, filters, page)
      .then(res => {
        if (!cancelled) setResult(res);
      })
      .catch(err => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Falha ao carregar categoria');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [effectiveSlug, filters, page]);

  // Carrega lojas da categoria raiz (não filtra por subcategoria — visão consolidada).
  useEffect(() => {
    let cancelled = false;
    void categoriesService
      .listStoresInCategory(slug)
      .then(list => {
        if (!cancelled) setStoresInCategory(list);
      })
      .catch(() => {
        if (!cancelled) setStoresInCategory([]);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Encontra root para subcategorias. Slugs hierárquicos (ex: "cursos/programacao")
  // mapeiam para o nó raiz pelo primeiro segmento ("cursos"); o leaf é
  // resolvido server-side via `searchInCategory(slug, ...)`.
  const rootSlug = slug.split('/')[0] ?? slug;
  const rootNode = useMemo(() => tree.find(n => n.slug === rootSlug) ?? null, [tree, rootSlug]);
  const subcategories = rootNode?.children ?? [];

  const start = result ? (result.page - 1) * PAGE_SIZE + 1 : 0;
  const end = result ? Math.min(start + result.products.length - 1, result.totalCount) : 0;

  if (!rootNode && !loading && tree.length > 0) {
    return (
      <section className="mx-auto w-full max-w-[1280px] px-6 lg:px-10 py-16 text-center">
        <h1 className="mb-3" style={{ fontSize: 'var(--text-display-md)' }}>
          Categoria não encontrada
        </h1>
        <p style={{ color: 'var(--color-ink-soft)' }} className="mb-6">
          O endereço {slug ? `“${slug}”` : 'informado'} não corresponde a nenhuma categoria do marketplace.
        </p>
        <Link to="/" className="circulou-btn-primary no-underline">
          Voltar para a home
        </Link>
      </section>
    );
  }

  const headerNode: CategoryNode = result?.category ?? rootNode ?? {
    slug,
    name: slug,
    productCount: 0,
  };

  const storeNameFor = (storeId: number | null): string | undefined => {
    if (storeId === null) return undefined;
    return storesById.get(storeId)?.name;
  };

  return (
    <div>
      <CategoryHero
        category={headerNode}
        parents={result?.parents ?? []}
        totalCount={result?.totalCount ?? 0}
        totalStores={storesInCategory.length}
      />

      {subcategories.length > 0 && rootNode ? (
        <SubcategoryChips
          subcategories={subcategories}
          totalCount={rootNode.productCount}
          activeSlug={slug === rootSlug ? null : slug}
          onSelect={setSubSlug}
        />
      ) : null}

      <div className="mx-auto w-full max-w-[1280px] px-6 lg:px-10 py-10">
        <div className="lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-10">
            <div className="hidden lg:block self-start sticky" style={{ top: 200 }}>
              <FiltersPanel value={filters} onChange={setFilters} onClear={reset} />
              {/* MOCK :: LOFN-G04 — facets visuais (condição/tamanho/marca). */}
              {/* Estes campos NÃO filtram de fato; existem apenas para preview da UX. */}
              {/* TODO(LOFN-G04): integrar quando o endpoint /facets existir. */}
              <FacetsMock />
            </div>

            <main aria-labelledby="results-title">
              <h2 id="results-title" className="sr-only">
                Resultados em {headerNode.name}
              </h2>

              <div
                className="flex justify-between items-center gap-4 flex-wrap pb-4 mb-6"
                style={{ borderBottom: '1px solid var(--color-line)' }}
              >
                <p
                  aria-live="polite"
                  className="text-sm"
                  style={{ color: 'var(--color-mute)' }}
                >
                  {result && result.totalCount > 0 ? (
                    <>
                      Mostrando{' '}
                      <strong style={{ color: 'var(--color-cedro)' }}>
                        {start}–{end}
                      </strong>{' '}
                      de{' '}
                      <strong style={{ color: 'var(--color-cedro)' }}>
                        {result.totalCount}
                      </strong>{' '}
                      peças
                    </>
                  ) : null}
                </p>
                <SortControl value={filters.sort ?? 'relevance'} onChange={setSort} />
              </div>

              {loading && !result ? <LoadingSpinner /> : null}
              {error ? (
                <ErrorState
                  message={error}
                  onRetry={() => {
                    setError(null);
                    void categoriesService
                      .searchInCategory(effectiveSlug, filters, page)
                      .then(setResult);
                  }}
                />
              ) : null}

              {result && result.totalCount === 0 && !loading && !error ? (
                <EmptyCategory
                  onClear={reset}
                  onHome={() => navigate('/')}
                />
              ) : null}

              {result && result.products.length > 0 ? (
                <>
                  {/* 4-col em ≥1200, 3-col em ≥1024, 2-col abaixo. */}
                  <div className="grid gap-x-4 gap-y-5 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                    {result.products.map(p => (
                      <ProductCard
                        key={p.productId}
                        product={p}
                        showStore
                        storeName={storeNameFor(p.storeId)}
                      />
                    ))}
                  </div>

                  <div className="mt-12">
                    <Pagination
                      page={result.page}
                      pageCount={result.pageCount}
                      onChange={setPage}
                    />
                  </div>
                </>
              ) : null}
            </main>
          </div>
      </div>

      <StoresInCategoryRail
        stores={storesInCategory}
        categorySlug={slug}
        categoryName={rootNode?.name ?? headerNode.name}
      />

      {/* FAB mobile — abre drawer com filtros (mesmo conteúdo do desktop). */}
      <button
        type="button"
        className="lg:hidden fixed circulou-btn-primary"
        style={{
          right: '1.25rem',
          bottom: '1.25rem',
          zIndex: 30,
          minHeight: 48,
          padding: '0 1.25rem',
          boxShadow: 'var(--shadow-lg)',
        }}
        onClick={() => setDrawerOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={drawerOpen}
      >
        ☰ Filtros
      </button>

      {drawerOpen ? (
        <FiltersDrawer onClose={() => setDrawerOpen(false)}>
          <FiltersPanel value={filters} onChange={setFilters} onClear={reset} />
          <FacetsMock />
        </FiltersDrawer>
      ) : null}
    </div>
  );
};

interface EmptyCategoryProps {
  onClear: () => void;
  onHome: () => void;
}

const EmptyCategory = ({ onClear, onHome }: EmptyCategoryProps) => (
  <div
    className="text-center mx-auto"
    style={{
      maxWidth: 480,
      padding: '2.5rem 2rem',
      background: 'var(--color-surface)',
      border: '1px dashed var(--color-line)',
      borderRadius: 'var(--radius-lg)',
    }}
  >
    <div
      aria-hidden="true"
      className="mx-auto mb-5 relative"
      style={{
        width: 96,
        height: 96,
        background: 'var(--color-ambar)',
        borderRadius: 'var(--radius-blob)',
      }}
    >
      <span
        className="absolute inset-0 flex items-center justify-center"
        style={{
          fontSize: '3rem',
          color: 'var(--color-cedro)',
          fontFamily: 'var(--font-display)',
        }}
      >
        ○
      </span>
    </div>
    <h2 className="mb-3" style={{ fontSize: '1.5rem' }}>
      Nada por aqui ainda
    </h2>
    <p className="mb-6" style={{ color: 'var(--color-ink-soft)' }}>
      Volte logo — peças novas chegam todo dia. Tente afrouxar a faixa de preço, mudar de subcategoria ou voltar para a home.
    </p>
    <div className="flex gap-3 justify-center flex-wrap">
      <button type="button" className="circulou-btn-ghost" onClick={onClear}>
        Limpar filtros
      </button>
      <button type="button" className="circulou-btn-primary" onClick={onHome}>
        Voltar para a home
      </button>
    </div>
  </div>
);

interface FiltersDrawerProps {
  children: ReactNode;
  onClose: () => void;
}

const FiltersDrawer = ({ children, onClose }: FiltersDrawerProps) => (
  <div
    role="dialog"
    aria-modal="true"
    aria-label="Filtros"
    className="lg:hidden fixed inset-0 z-50 flex"
  >
    <button
      type="button"
      aria-label="Fechar filtros"
      className="absolute inset-0 bg-black/40"
      onClick={onClose}
      style={{ border: 'none' }}
    />
    <div
      className="ml-auto h-full w-full max-w-sm overflow-y-auto"
      style={{
        background: 'var(--color-surface)',
        borderLeft: '1px solid var(--color-line)',
        padding: '1.25rem',
      }}
    >
      <header
        className="flex justify-between items-center pb-3 mb-4"
        style={{ borderBottom: '1px solid var(--color-line)' }}
      >
        <h2 style={{ fontSize: '1.3rem' }}>Filtros</h2>
        <button
          type="button"
          aria-label="Fechar filtros"
          onClick={onClose}
          className="inline-flex items-center justify-center"
          style={{
            width: 44,
            height: 44,
            background: 'transparent',
            border: 'none',
            color: 'var(--color-cedro)',
            fontSize: '1.4rem',
            cursor: 'pointer',
          }}
        >
          ✕
        </button>
      </header>
      {children}
    </div>
  </div>
);

/**
 * MOCK :: LOFN-G04 — facets visuais (condição / tamanho / marca).
 * Renderiza a UX de filtros que o backend ainda não suporta de fato.
 * Os controles abaixo NÃO afetam o resultado da busca.
 *
 * TODO(LOFN-G04): conectar a GET /marketplace/categories/:slug/facets.
 */
const FacetsMock = () => (
  <div
    className="mt-4"
    aria-label="Filtros adicionais (visual, não funcionais)"
    style={{
      background: 'var(--color-surface)',
      border: '1px dashed var(--color-line)',
      borderRadius: 'var(--radius)',
      padding: '1rem',
    }}
  >
    <p
      className="mb-3"
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '0.7rem',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        color: 'var(--color-mute)',
      }}
    >
      Em breve · facets
    </p>

    <FacetGroup title="Condição da peça">
      {['Nova com etiqueta', 'Semi-nova', 'Usada em ótimo estado', 'Usada com sinais'].map(label => (
        <FacetCheckbox key={label} label={label} />
      ))}
    </FacetGroup>

    <FacetGroup title="Tamanho">
      <div className="grid grid-cols-4 gap-1.5">
        {['34', '35', '36', '37', '38', '39', '40', '41'].map(size => (
          <button
            key={size}
            type="button"
            aria-pressed="false"
            disabled
            style={{
              minHeight: 36,
              borderRadius: 'var(--radius-sm)',
              border: '1.5px solid var(--color-line)',
              background: 'var(--color-surface)',
              color: 'var(--color-ink)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              opacity: 0.55,
            }}
          >
            {size}
          </button>
        ))}
      </div>
    </FacetGroup>

    <FacetGroup title="Marca">
      {['Nike', 'Adidas', 'Vans', 'Melissa', 'Arezzo', 'Schutz'].map(label => (
        <FacetCheckbox key={label} label={label} />
      ))}
    </FacetGroup>
  </div>
);

interface FacetGroupProps {
  title: string;
  children: ReactNode;
}

const FacetGroup = ({ title, children }: FacetGroupProps) => (
  <div className="mb-4">
    <h3
      className="mb-2 flex justify-between items-center"
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '0.75rem',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        color: 'var(--color-cedro)',
      }}
    >
      {title}
    </h3>
    {children}
  </div>
);

interface FacetCheckboxProps {
  label: string;
}

const FacetCheckbox = ({ label }: FacetCheckboxProps) => (
  <label
    className="flex items-center gap-2 py-1.5"
    style={{ fontSize: '0.9rem', color: 'var(--color-ink)', opacity: 0.6 }}
  >
    <input type="checkbox" disabled className="h-4 w-4" />
    <span>{label}</span>
  </label>
);

