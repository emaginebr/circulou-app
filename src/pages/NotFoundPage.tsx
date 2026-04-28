import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const NotFoundPage = () => {
  const { t } = useTranslation('errors');
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 text-center">
      <h1 className="text-6xl font-bold mb-2">404</h1>
      <p className="text-lg text-[var(--color-mute)] mb-4">{t('notFound')}</p>
      <Link
        to="/"
        className="inline-flex items-center px-4 py-2 bg-[var(--color-primary)] text-white rounded-[var(--radius)] hover:bg-[var(--color-primary-hover)] transition no-underline"
      >
        Voltar à home
      </Link>
    </div>
  );
};
