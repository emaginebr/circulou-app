import type { SearchPage } from '@/types/search';
import { shouldShowLoadMore } from '@/lib/pagination';

interface LoadMoreButtonProps {
  searchPage: SearchPage | null;
  onLoadMore: () => void;
  loading?: boolean;
}

export const LoadMoreButton = ({ searchPage, onLoadMore, loading }: LoadMoreButtonProps) => {
  if (!searchPage) return null;
  if (!shouldShowLoadMore(searchPage.fetchedPages, searchPage.pageCap, searchPage.exhausted)) {
    return null;
  }
  return <LoadMoreInner onLoadMore={onLoadMore} loading={Boolean(loading)} />;
};

const LoadMoreInner = ({
  onLoadMore,
  loading,
}: {
  onLoadMore: () => void;
  loading: boolean;
}) => (
    <div className="flex justify-center my-6">
      <button
        type="button"
        className="inline-flex items-center px-4 py-2 border border-[var(--color-primary)] text-[var(--color-primary)] rounded-[var(--radius)] hover:bg-[var(--color-primary)] hover:text-white transition disabled:opacity-50"
        onClick={onLoadMore}
        disabled={loading}
      >
        {loading ? '...' : 'Buscar mais'}
      </button>
    </div>
  );
