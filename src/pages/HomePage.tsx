import { useEffect } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { useStores } from '@/hooks/useStores';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { HomeHero } from '@/components/home/HomeHero';
import { HomeFeatureBanners } from '@/components/home/HomeFeatureBanners';
import { HomeProductRail } from '@/components/home/HomeProductRail';
import { HomeEditorialBanner } from '@/components/home/HomeEditorialBanner';
import { HomeProductGridSection } from '@/components/home/HomeProductGridSection';
import { HomeSellCta } from '@/components/home/HomeSellCta';
import { HomePurpose } from '@/components/home/HomePurpose';

export const HomePage = () => {
  const { searchPage, loading, error, loadHome, clearError } = useProducts();
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

  // Produtos reais distribuídos entre as fileiras (rail + grid).
  // Não inventamos fakes: se o catálogo estiver vazio, ocultamos as
  // seções de produto e mantemos o fluxo editorial da home.
  const items = searchPage?.items ?? [];
  const railItems = items.slice(0, 6);
  const gridItems = items.slice(6, 14);

  return (
    <>
      <HomeHero />
      <HomeFeatureBanners />
      <HomeProductRail products={railItems} storesById={storesById} />
      <HomeEditorialBanner />
      <HomeProductGridSection products={gridItems} storesById={storesById} />
      <HomeSellCta />
      <HomePurpose />
    </>
  );
};
