import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { categoriesService } from '@/Services/CategoriesService';
import type { CategoryNode } from '@/types/category';

interface ProductBreadcrumbProps {
  categoryId: number | null;
  productName: string;
}

interface ResolvedCategory {
  parents: CategoryNode[];
  category: CategoryNode | null;
}

// MOCK :: LOFN-G36 — mapeamento categoryId → label legível e árvore.
// Reusa categoriesService.getMarketplaceCategoryTree() (já mock client-side).
const findById = (
  tree: CategoryNode[],
  id: number,
  parents: CategoryNode[] = [],
): ResolvedCategory => {
  for (const node of tree) {
    if (node.categoryId === id) return { parents, category: node };
    if (node.children) {
      const inner = findById(node.children, id, [...parents, node]);
      if (inner.category) return inner;
    }
  }
  return { parents: [], category: null };
};

export const ProductBreadcrumb = ({ categoryId, productName }: ProductBreadcrumbProps) => {
  const [resolved, setResolved] = useState<ResolvedCategory>({
    parents: [],
    category: null,
  });

  useEffect(() => {
    let cancelled = false;
    if (categoryId === null) {
      setResolved({ parents: [], category: null });
      return undefined;
    }
    void categoriesService
      .getMarketplaceCategoryTree()
      .then(tree => {
        if (cancelled) return;
        setResolved(findById(tree, categoryId));
      })
      .catch(() => {
        if (!cancelled) setResolved({ parents: [], category: null });
      });
    return () => {
      cancelled = true;
    };
  }, [categoryId]);

  return (
    <nav
      aria-label="Caminho de navegação"
      className="flex items-center flex-wrap gap-2"
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-caption)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: 'var(--color-mute)',
      }}
    >
      <Link to="/" className="no-underline" style={{ color: 'var(--color-mute)' }}>
        Início
      </Link>
      {resolved.parents.map(parent => (
        <span key={parent.slug} className="flex items-center gap-2">
          <span aria-hidden="true" style={{ color: 'var(--color-line)' }}>
            ›
          </span>
          <Link
            to={`/${parent.slug}`}
            className="no-underline hover:text-[var(--color-cobre)]"
            style={{ color: 'var(--color-mute)' }}
          >
            {parent.name}
          </Link>
        </span>
      ))}
      {resolved.category ? (
        <span className="flex items-center gap-2">
          <span aria-hidden="true" style={{ color: 'var(--color-line)' }}>
            ›
          </span>
          <Link
            to={`/${resolved.category.slug}`}
            className="no-underline hover:text-[var(--color-cobre)]"
            style={{ color: 'var(--color-mute)' }}
          >
            {resolved.category.name}
          </Link>
        </span>
      ) : null}
      <span aria-hidden="true" style={{ color: 'var(--color-line)' }}>
        ›
      </span>
      <span
        aria-current="page"
        className="truncate"
        style={{
          color: 'var(--color-cedro)',
          fontWeight: 500,
          maxWidth: '36ch',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {productName}
      </span>
    </nav>
  );
};
