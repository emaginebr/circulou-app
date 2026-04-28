import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { SearchBar } from '@/components/search/SearchBar';

export const Header = () => {
  const { t } = useTranslation(['common', 'auth', 'cart']);
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount } = useCart();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') ?? '';
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="mx-auto max-w-7xl flex items-center justify-between gap-3 px-4 py-3">
        <Link to="/" className="no-underline shrink-0">
          <span className="text-2xl font-bold text-[var(--color-primary)]">
            {t('common:appName')}
          </span>
        </Link>
        <div className="grow max-w-xl">
          <SearchBar initialValue={initialQuery} />
        </div>
        <nav className="flex items-center gap-3">
          <Link
            to="/cart"
            className="relative no-underline text-[var(--color-ink)]"
            aria-label={t('cart:title')}
          >
            <span aria-hidden="true">🛒</span>
            {itemCount > 0 ? (
              <span className="absolute -top-2 -right-2 inline-flex items-center justify-center min-w-[20px] h-5 px-1 text-[10px] rounded-full bg-[var(--color-primary)] text-white">
                {itemCount}
              </span>
            ) : null}
          </Link>
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <Link
                to="/profile"
                className="text-sm no-underline text-[var(--color-ink)] hover:underline"
              >
                {user.name}
              </Link>
              <button
                type="button"
                className="text-sm text-[var(--color-primary)] hover:underline"
                onClick={() => logout()}
              >
                {t('auth:logout')}
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center px-3 py-1.5 text-sm border border-[var(--color-primary)] text-[var(--color-primary)] rounded-[var(--radius)] hover:bg-[var(--color-primary)] hover:text-white transition no-underline"
            >
              {t('auth:login')}
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};
