import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

interface SearchBarProps {
  initialValue?: string;
  className?: string;
}

export const SearchBar = ({ initialValue = '', className = '' }: SearchBarProps) => {
  const [value, setValue] = useState(initialValue);
  const navigate = useNavigate();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    navigate(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : '/');
  };

  return (
    <form
      role="search"
      className={`relative w-full ${className}`}
      onSubmit={handleSubmit}
    >
      <span
        aria-hidden="true"
        className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: 'var(--color-mute)', fontSize: '1.1rem' }}
      >
        🔍
      </span>
      <label htmlFor="header-search" className="sr-only">
        Buscar peças
      </label>
      <input
        id="header-search"
        type="search"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="Busque por marca, peça ou estilo…"
        className="w-full"
        style={{
          height: 44,
          borderRadius: 999,
          border: '1.5px solid var(--color-line)',
          background: 'var(--color-surface)',
          padding: '0 1rem 0 2.75rem',
          fontFamily: 'var(--font-sans)',
          color: 'var(--color-tinta)',
          outline: 'none',
        }}
        onFocus={e => {
          e.currentTarget.style.borderColor = 'var(--color-oliva)';
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(74, 75, 44, 0.18)';
        }}
        onBlur={e => {
          e.currentTarget.style.borderColor = 'var(--color-line)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      />
    </form>
  );
};
