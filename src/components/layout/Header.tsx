import { useEffect } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { useCategories } from '@/hooks/useCategories';
import { SearchBar } from '@/components/search/SearchBar';

const LOGO_CLIP =
  'polygon(50% 0%, 60% 18%, 78% 14%, 74% 32%, 92% 36%, 80% 52%, 96% 64%, 78% 70%, 84% 90%, 64% 84%, 50% 100%, 36% 84%, 16% 90%, 22% 70%, 4% 64%, 20% 52%, 8% 36%, 26% 32%, 22% 14%, 40% 18%)';

interface NavItemProps {
  to: string;
  label: string;
  active?: boolean;
  ariaLabel?: string;
}

const NavItem = ({ to, label, active, ariaLabel }: NavItemProps) => (
  <Link
    to={to}
    aria-label={ariaLabel}
    className="relative whitespace-nowrap text-sm font-medium px-1 py-2 no-underline hover:text-[var(--color-cobre)] transition-colors"
    style={{ color: 'var(--color-cedro)' }}
  >
    {label}
    {active ? (
      <span
        aria-hidden="true"
        className="absolute left-0 right-0 -bottom-[2px] h-[2px] rounded-sm"
        style={{ background: 'var(--color-ambar)' }}
      />
    ) : null}
  </Link>
);

export const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount } = useCart();
  const { global: globalCategories, loadGlobal } = useCategories();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const initialQuery = searchParams.get('q') ?? '';
  const activeCategoryId = Number(searchParams.get('cat')) || null;
  const isHome = location.pathname === '/';
  const isShopping = isHome || location.pathname.startsWith('/search');

  useEffect(() => {
    if (globalCategories.length === 0) void loadGlobal();
  }, [globalCategories.length, loadGlobal]);

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: 'var(--color-page)',
        borderBottom: '1px solid var(--color-line)',
      }}
    >
      <div className="mx-auto w-full max-w-[1280px] flex items-center justify-between gap-4 px-6 lg:px-10 py-4">
        <Link to="/" className="flex items-center gap-2 no-underline shrink-0">
          <span
            aria-hidden="true"
            style={{
              width: 32,
              height: 32,
              background: 'var(--color-ambar)',
              clipPath: LOGO_CLIP,
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.6rem',
              color: 'var(--color-oliva)',
              letterSpacing: '0.02em',
            }}
          >
            Circulou
          </span>
        </Link>

        <div className="grow max-w-[480px] hidden md:block">
          <SearchBar initialValue={initialQuery} />
        </div>

        <nav
          className="flex items-center gap-4 lg:gap-6"
          aria-label="Navegação principal"
        >
          <NavItem to="/" label="Comprar" active={isShopping} />
          <NavItem to="/#sell" label="Quero vender" />
          {/* TODO rota /ongs */}
          <NavItem to="/ongs" label="ONGs" />
          {/* TODO rota /favoritos */}
          <NavItem to="/favoritos" label="♡" ariaLabel="Favoritos" />
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <Link
                to="/profile"
                className="text-sm no-underline hover:underline"
                style={{ color: 'var(--color-cedro)' }}
              >
                {user.name}
              </Link>
              <button
                type="button"
                className="text-sm hover:underline bg-transparent border-none cursor-pointer"
                style={{ color: 'var(--color-cobre)' }}
                onClick={() => logout()}
              >
                Sair
              </button>
            </div>
          ) : (
            <NavItem to="/login" label="Entrar" />
          )}
          <Link
            to="/cart"
            className="circulou-btn-primary no-underline"
            style={{ minHeight: 40, padding: '0.5rem 1rem', fontSize: '0.9rem' }}
            aria-label={`Sacola — ${itemCount} ${itemCount === 1 ? 'item' : 'itens'}`}
          >
            Sacola
            <span
              aria-hidden="true"
              className="inline-flex items-center justify-center"
              style={{
                background: 'var(--color-ambar)',
                color: 'var(--color-cedro)',
                borderRadius: 999,
                padding: '0.05rem 0.45rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                marginLeft: '0.4rem',
              }}
            >
              {itemCount}
            </span>
          </Link>
        </nav>
      </div>

      {/* Search row em mobile (abaixo da linha principal). */}
      <div className="md:hidden px-6 pb-3">
        <SearchBar initialValue={initialQuery} />
      </div>

      {/* Barra de categorias (sticky com o header). */}
      <div
        style={{
          background: 'var(--color-surface-warm)',
          borderTop: '1px solid var(--color-line)',
        }}
      >
        <div
          className="mx-auto w-full max-w-[1280px] flex items-center gap-6 px-6 lg:px-10 py-2 overflow-x-auto"
          style={{ scrollbarWidth: 'none' }}
        >
          <NavItem to="/" label="Novidades" active={isHome} />
          {globalCategories.map(cat => (
            <NavItem
              key={cat.categoryId}
              to={`/search?cat=${cat.categoryId}`}
              label={cat.name}
              active={activeCategoryId === cat.categoryId}
            />
          ))}
        </div>
      </div>
    </header>
  );
};
