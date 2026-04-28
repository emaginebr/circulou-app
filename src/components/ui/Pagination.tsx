interface PaginationProps {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}

export const Pagination = ({ page, pageCount, onChange }: PaginationProps) => {
  if (pageCount <= 1) return null;
  const range: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(pageCount, start + 4);
  for (let i = start; i <= end; i++) range.push(i);

  const baseBtn =
    'inline-flex items-center justify-center min-w-[40px] h-10 px-3 border border-gray-300 text-sm';
  const idle = `${baseBtn} bg-white hover:bg-gray-50`;
  const active = `${baseBtn} bg-[var(--color-primary)] text-white border-[var(--color-primary)]`;
  const disabled = `${baseBtn} bg-gray-100 text-gray-400 cursor-not-allowed`;

  return (
    <nav aria-label="Paginação dos resultados" className="flex justify-center">
      <ul className="flex -space-x-px rounded overflow-hidden">
        <li>
          <button
            type="button"
            className={page === 1 ? disabled : idle}
            onClick={() => onChange(page - 1)}
            disabled={page === 1}
          >
            Anterior
          </button>
        </li>
        {range.map(n => (
          <li key={n}>
            <button
              type="button"
              className={page === n ? active : idle}
              onClick={() => onChange(n)}
            >
              {n}
            </button>
          </li>
        ))}
        <li>
          <button
            type="button"
            className={page === pageCount ? disabled : idle}
            onClick={() => onChange(page + 1)}
            disabled={page === pageCount}
          >
            Próxima
          </button>
        </li>
      </ul>
    </nav>
  );
};
