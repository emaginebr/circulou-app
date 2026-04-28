import { useLocation, useNavigate } from 'react-router-dom';
import { LoginForm } from 'nauth-react';
import { useTranslation } from 'react-i18next';

interface LocationStateWithFrom {
  from?: string;
}

export const LoginPage = () => {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationStateWithFrom | null;
  const from = state?.from ?? '/';

  return (
    <section className="max-w-md mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-4 text-center">{t('login')}</h1>
      <LoginForm onSuccess={() => navigate(from, { replace: true })} />
    </section>
  );
};
