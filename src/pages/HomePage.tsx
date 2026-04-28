import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useProducts } from '@/hooks/useProducts';
import { useStores } from '@/hooks/useStores';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProductGrid } from '@/components/product/ProductGrid';

export const HomePage = () => {
  const { t } = useTranslation('search');
  const { searchPage, homeTitleKey, loading, error, loadHome, clearError } = useProducts();
  const { storesById } = useStores();

  useEffect(() => {
    void loadHome();
  }, [loadHome]);

  if (loading && !searchPage) return <LoadingSpinner />;
  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={() => {
          clearError();
          void loadHome();
        }}
      />
    );
  }
  if (!searchPage || searchPage.items.length === 0) {
    return <EmptyState title={t(homeTitleKey)} description="Sem produtos no momento." />;
  }
  return (
    <section className="max-w-7xl mx-auto px-4 py-4">
      <h1 className="text-2xl font-semibold mb-4">{t(homeTitleKey)}</h1>
      <ProductGrid products={searchPage.items} storesById={storesById} />
    </section>
  );
};
