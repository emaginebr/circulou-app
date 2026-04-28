import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface SearchBarProps {
  initialValue?: string;
  className?: string;
}

export const SearchBar = ({ initialValue = '', className = '' }: SearchBarProps) => {
  const { t } = useTranslation('search');
  const [value, setValue] = useState(initialValue);
  const navigate = useNavigate();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      navigate('/');
      return;
    }
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <form
      role="search"
      className={`flex gap-2 ${className}`}
      onSubmit={handleSubmit}
    >
      <input
        type="search"
        className="flex-1 rounded-[var(--radius)] border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        placeholder={t('placeholder')}
        value={value}
        onChange={e => setValue(e.target.value)}
        aria-label={t('placeholder')}
      />
      <button
        type="submit"
        className="inline-flex items-center px-4 py-2 bg-[var(--color-primary)] text-white text-sm rounded-[var(--radius)] hover:bg-[var(--color-primary-hover)] transition"
      >
        {t('submit')}
      </button>
    </form>
  );
};
