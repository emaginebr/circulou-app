import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { categoriesService } from '@/Services/CategoriesService';
import type { CategoryNode } from '@/types/category';

const STATIC_PREFIXES = new Set([
  'search', 'loja', 'product', 'login', 'register', 'forgot-password',
  'reset-password', 'change-password', 'profile', 'cart', 'checkout',
  'order-confirmation', 'ongs', 'favoritos',
]);

const HOVER_CLOSE_DELAY_MS = 120;

const hasGrandchildren = (root: CategoryNode): boolean =>
  Boolean(root.children?.some(c => c.children && c.children.length > 0));

export const CategoryMegaMenu = () => {
  const [tree, setTree] = useState<CategoryNode[]>([]);
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const location = useLocation();
  const closeTimer = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    void categoriesService.getMarketplaceCategoryTree().then(t => {
      if (!cancelled) setTree(t);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const isHome = location.pathname === '/';
  const firstSegment = location.pathname.replace(/^\/+/, '').split('/')[0] ?? '';
  const activeRootSlug =
    !isHome && firstSegment && !STATIC_PREFIXES.has(firstSegment) ? firstSegment : null;

  const open = (slug: string) => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setOpenSlug(slug);
  };

  const scheduleClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => {
      setOpenSlug(null);
      closeTimer.current = null;
    }, HOVER_CLOSE_DELAY_MS);
  };

  const closeNow = () => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setOpenSlug(null);
  };

  const openedNode = openSlug ? tree.find(r => r.slug === openSlug) ?? null : null;
  const showPanel = Boolean(openedNode?.children?.length);

  return (
    <div
      style={{
        background: 'var(--color-surface-warm)',
        borderTop: '1px solid var(--color-line)',
        position: 'relative',
      }}
      onMouseLeave={scheduleClose}
    >
      <div
        className="mx-auto w-full max-w-[1280px] flex items-center gap-6 px-6 lg:px-10 py-2 overflow-x-auto"
        style={{ scrollbarWidth: 'none' }}
      >
        <RootLink to="/" label="Novidades" active={isHome} onMouseEnter={closeNow} />
        {tree.map(root => (
          <RootLink
            key={root.slug}
            to={`/${root.slug}`}
            label={root.name}
            active={activeRootSlug === root.slug || openSlug === root.slug}
            onMouseEnter={() => open(root.slug)}
            onFocus={() => open(root.slug)}
          />
        ))}
      </div>

      {showPanel && openedNode ? (
        <div
          onMouseEnter={() => open(openedNode.slug)}
          onMouseLeave={scheduleClose}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 40,
            background: 'var(--color-page)',
            borderTop: '1px solid var(--color-line)',
            boxShadow: '0 12px 28px rgba(0,0,0,0.12)',
          }}
        >
          <div className="mx-auto w-full max-w-[1280px] px-6 lg:px-10 py-8">
            <MegaPanelContent root={openedNode} onItemClick={closeNow} />
          </div>
        </div>
      ) : null}
    </div>
  );
};

interface RootLinkProps {
  to: string;
  label: string;
  active: boolean;
  onMouseEnter?: () => void;
  onFocus?: () => void;
}

const RootLink = ({ to, label, active, onMouseEnter, onFocus }: RootLinkProps) => (
  <Link
    to={to}
    onMouseEnter={onMouseEnter}
    onFocus={onFocus}
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

interface MegaPanelContentProps {
  root: CategoryNode;
  onItemClick: () => void;
}

const MegaPanelContent = ({ root, onItemClick }: MegaPanelContentProps) => {
  // 3 níveis: cada child do root vira uma coluna com cabeçalho, e seus
  // próprios children viram a lista de links abaixo.
  if (hasGrandchildren(root)) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-10 gap-y-6">
        {(root.children ?? []).map(group => (
          <div key={group.slug}>
            <h3
              className="font-bold uppercase"
              style={{
                color: 'var(--color-cedro)',
                letterSpacing: '0.08em',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.95rem',
                marginBottom: '0.75rem',
              }}
            >
              {group.name}
            </h3>
            <ul className="flex flex-col gap-2">
              {(group.children ?? []).map(item => (
                <li key={item.slug}>
                  <Link
                    to={`/${item.slug}`}
                    onClick={onItemClick}
                    className="text-sm no-underline hover:underline"
                    style={{ color: 'var(--color-cedro)' }}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  }

  // 2 níveis: lista única em grid (3 colunas em desktop).
  return (
    <div>
      <h3
        className="font-bold uppercase"
        style={{
          color: 'var(--color-cedro)',
          letterSpacing: '0.08em',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.95rem',
          marginBottom: '1rem',
        }}
      >
        {root.name}
      </h3>
      <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-10 gap-y-2">
        {(root.children ?? []).map(item => (
          <li key={item.slug}>
            <Link
              to={`/${item.slug}`}
              onClick={onItemClick}
              className="text-sm no-underline hover:underline"
              style={{ color: 'var(--color-cedro)' }}
            >
              {item.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};
