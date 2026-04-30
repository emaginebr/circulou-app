import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { categoriesService } from '@/Services/CategoriesService';
import type { CategoryNode } from '@/types/category';

interface ProductCategoryChipProps {
  categoryId: number | null;
}

interface ChipData {
  parents: CategoryNode[];
  category: CategoryNode | null;
}

const findById = (
  tree: CategoryNode[],
  id: number,
  parents: CategoryNode[] = [],
): ChipData => {
  for (const node of tree) {
    if (node.categoryId === id) return { parents, category: node };
    if (node.children) {
      const inner = findById(node.children, id, [...parents, node]);
      if (inner.category) return inner;
    }
  }
  return { parents: [], category: null };
};

export const ProductCategoryChip = ({ categoryId }: ProductCategoryChipProps) => {
  const [data, setData] = useState<ChipData>({ parents: [], category: null });

  useEffect(() => {
    let cancelled = false;
    if (categoryId === null) {
      setData({ parents: [], category: null });
      return undefined;
    }
    void categoriesService
      .getMarketplaceCategoryTree()
      .then(tree => {
        if (!cancelled) setData(findById(tree, categoryId));
      })
      .catch(() => {
        if (!cancelled) setData({ parents: [], category: null });
      });
    return () => {
      cancelled = true;
    };
  }, [categoryId]);

  if (!data.category) return null;

  // Mostra "Pai › Filho" quando há um parent direto (mais informativo que só leaf).
  const directParent = data.parents[data.parents.length - 1];
  const label = directParent
    ? `${directParent.name} › ${data.category.name}`
    : data.category.name;

  return (
    <Link
      to={`/${data.category.slug}`}
      aria-label={`Ver todos os produtos da categoria ${label}`}
      className="self-start no-underline transition-transform hover:-translate-y-px"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        padding: '0.4rem 0.85rem',
        borderRadius: 999,
        background: 'var(--color-oliva-soft)',
        color: 'var(--color-oliva)',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.78rem',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        border: '1px solid transparent',
      }}
    >
      <span aria-hidden="true">○</span>
      {label}
    </Link>
  );
};
