import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useProducts } from '@/hooks/useProducts';
import { useStores } from '@/hooks/useStores';
import { useUrlSearchState } from '@/hooks/useUrlSearchState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProductGrid } from '@/components/product/ProductGrid';
import { Pagination } from '@/components/ui/Pagination';
import { FiltersPanel } from '@/components/search/FiltersPanel';
import { SortControl } from '@/components/search/SortControl';
import { LoadMoreButton } from '@/components/search/LoadMoreButton';
import { PAGE_SIZE } from '@/lib/pagination';
import type { FilterState } from '@/types/search';

export const SearchResultsPage = () => {
  const { t } = useTranslation('search');
  const { params, setFilters, setSort, reset } = useUrlSearchState();
  const { storesById } = useStores();
  const {
    searchPage,
    loading,
    error,
    pageCap,
    searchUnified,
    extendCap,
    resetCap,
    clearError,
  } = useProducts();
  const [page, setPage] = useState(params.page ?? 1);

  const filters = useMemo<FilterState>(
    () => ({
      storeId: params.storeId ?? null,
      priceMin: params.priceMin ?? null,
      priceMax: params.priceMax ?? null,
      onlyOnSale: params.onlyOnSale ?? false,
      categoryId: params.categoryId ?? null,
      sort: params.sort ?? 'relevance',
    }),
    [
      params.storeId,
      params.priceMin,
      params.priceMax,
      params.onlyOnSale,
      params.categoryId,
      params.sort,
    ],
  );

  const runSearch = useMemo(
    () => () => searchUnified(params.q, filters),
    [searchUnified, params.q, filters],
  );

  useEffect(() => {
    if (!params.q) return;
    void runSearch();
    setPage(1);
  }, [params.q, filters, runSearch]);

  useEffect(() => {
    resetCap();
  }, [params.q, filters, resetCap]);

  const visible = useMemo(() => {
    if (!searchPage) return [];
    const start = (page - 1) * PAGE_SIZE;
    return searchPage.items.slice(start, start + PAGE_SIZE);
  }, [searchPage, page]);

  const pageCount = useMemo(
    () => (searchPage ? Math.max(1, Math.ceil(searchPage.items.length / PAGE_SIZE)) : 1),
    [searchPage],
  );

  if (!params.q) return <Navigate to="/" replace />;

  return (
    <section className="max-w-7xl mx-auto px-4 py-4">
      <header className="mb-3 flex items-baseline justify-between flex-wrap gap-2">
        <h1 className="text-xl font-semibold mb-0">&ldquo;{params.q}&rdquo;</h1>
        <div className="flex items-center gap-3">
          {searchPage ? (
            <small className="text-[var(--color-mute)]">
              {searchPage.items.length} resultado(s)
            </small>
          ) : null}
          <SortControl value={filters.sort ?? 'relevance'} onChange={setSort} />
        </div>
      </header>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 md:col-span-3">
          <FiltersPanel value={filters} onChange={setFilters} onClear={reset} />
        </div>
        <div className="col-span-12 md:col-span-9">
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
            <EmptyState title={t('empty', { term: params.q })} />
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
              {searchPage.exhausted ? null : (
                <small className="block text-center text-[var(--color-mute)]">
                  Pré-fetch atual: {pageCap} pág. ({searchPage.fetchedPages} buscadas)
                </small>
              )}
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
};
