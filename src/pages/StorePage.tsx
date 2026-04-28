import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useProducts } from '@/hooks/useProducts';
import { useStores } from '@/hooks/useStores';
import { useCategories } from '@/hooks/useCategories';
import { useUrlSearchState } from '@/hooks/useUrlSearchState';
import { storesService } from '@/Services/StoresService';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProductGrid } from '@/components/product/ProductGrid';
import { Pagination } from '@/components/ui/Pagination';
import { FiltersPanel } from '@/components/search/FiltersPanel';
import { SortControl } from '@/components/search/SortControl';
import { LoadMoreButton } from '@/components/search/LoadMoreButton';
import { StoreHeader } from '@/components/store/StoreHeader';
import type { StoreInfo } from '@/types/store';
import type { FilterState } from '@/types/search';
import { PAGE_SIZE } from '@/lib/pagination';

export const StorePage = () => {
  const { t } = useTranslation('search');
  const { storeSlug = '' } = useParams();
  const { params, setFilters, setSort, reset } = useUrlSearchState();
  const [searchParams] = useSearchParams();
  const { storesById } = useStores();
  const { byStoreSlug, loadByStoreSlug } = useCategories();
  const {
    searchPage,
    loading,
    error,
    pageCap,
    searchInStore,
    extendCap,
    resetCap,
    clearError,
  } = useProducts();

  const [store, setStore] = useState<StoreInfo | null>(null);
  const [storeError, setStoreError] = useState<string | null>(null);
  const [page, setPage] = useState(params.page ?? 1);

  useEffect(() => {
    let cancelled = false;
    setStoreError(null);
    storesService
      .getBySlug(storeSlug)
      .then(s => {
        if (!cancelled) setStore(s);
      })
      .catch(err => {
        if (!cancelled) setStoreError(err instanceof Error ? err.message : 'Falha ao carregar loja');
      });
    return () => {
      cancelled = true;
    };
  }, [storeSlug]);

  useEffect(() => {
    if (storeSlug) void loadByStoreSlug(storeSlug);
  }, [storeSlug, loadByStoreSlug]);

  const filters = useMemo<FilterState>(
    () => ({
      storeId: store?.storeId ?? null,
      priceMin: params.priceMin ?? null,
      priceMax: params.priceMax ?? null,
      onlyOnSale: params.onlyOnSale ?? false,
      categoryId: params.categoryId ?? null,
      sort: params.sort ?? 'relevance',
    }),
    [
      store?.storeId,
      params.priceMin,
      params.priceMax,
      params.onlyOnSale,
      params.categoryId,
      params.sort,
    ],
  );

  const runSearch = useMemo(
    () => () => {
      if (!store) return Promise.resolve();
      return searchInStore(store.storeId, params.q, filters);
    },
    [store, params.q, filters, searchInStore],
  );

  useEffect(() => {
    if (!store) return;
    void runSearch();
    setPage(1);
  }, [store, params.q, filters, runSearch]);

  useEffect(() => {
    resetCap();
  }, [store, params.q, filters, resetCap]);

  const visible = useMemo(() => {
    if (!searchPage) return [];
    const start = (page - 1) * PAGE_SIZE;
    return searchPage.items.slice(start, start + PAGE_SIZE);
  }, [searchPage, page]);

  const pageCount = useMemo(
    () => (searchPage ? Math.max(1, Math.ceil(searchPage.items.length / PAGE_SIZE)) : 1),
    [searchPage],
  );

  if (storeError) return <ErrorState message={storeError} />;
  if (!store) return <LoadingSpinner />;

  const categories = byStoreSlug[storeSlug] ?? [];

  const backParams = new URLSearchParams(searchParams);
  backParams.delete('store');
  backParams.delete('cat');
  const backHref = params.q ? `/search?${backParams.toString()}` : '/';

  return (
    <section className="max-w-7xl mx-auto px-4 py-4">
      <Link
        to={backHref}
        className="inline-block text-sm text-[var(--color-mute)] hover:underline mb-2"
      >
        ← Voltar à busca em todas as lojas
      </Link>
      <StoreHeader store={store} />

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 md:col-span-3">
          <FiltersPanel value={filters} onChange={setFilters} onClear={reset} />
          {categories.length > 0 ? (
            <aside className="bg-white border border-gray-200 rounded-[var(--radius)] p-3 mb-3">
              <h2 className="text-base font-semibold mb-2">Categoria</h2>
              <select
                className="w-full rounded-[var(--radius-sm)] border border-gray-300 px-2 py-1 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                value={filters.categoryId ?? ''}
                onChange={e =>
                  setFilters({ categoryId: e.target.value ? Number(e.target.value) : null })
                }
              >
                <option value="">Todas</option>
                {categories.map(c => (
                  <option key={c.categoryId} value={c.categoryId}>
                    {c.name}
                  </option>
                ))}
              </select>
            </aside>
          ) : null}
        </div>
        <div className="col-span-12 md:col-span-9">
          <header className="mb-3 flex items-baseline justify-between flex-wrap gap-2">
            <span className="text-[var(--color-mute)] text-sm">
              {searchPage ? `${searchPage.items.length} resultado(s)` : ''}
            </span>
            <SortControl value={filters.sort ?? 'relevance'} onChange={setSort} />
          </header>

          {loading && !searchPage ? <LoadingSpinner /> : null}
          {error ? (
            <ErrorState
              message={error}
              onRetry={() => {
                clearError();
                void runSearch();
              }}
            />
          ) : null}
          {!loading && !error && (!searchPage || searchPage.items.length === 0) ? (
            <EmptyState title={t('empty', { term: params.q || store.name })} />
          ) : null}
          {searchPage && searchPage.items.length > 0 ? (
            <>
              <ProductGrid products={visible} storesById={storesById} />
              <div className="mt-4">
                <Pagination page={page} pageCount={pageCount} onChange={setPage} />
              </div>
              <LoadMoreButton
                searchPage={searchPage}
                loading={loading}
                onLoadMore={() => {
                  void extendCap(runSearch);
                }}
              />
              <small className="block text-center text-[var(--color-mute)]">
                Pré-fetch atual: {pageCap} pág.
              </small>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
};
