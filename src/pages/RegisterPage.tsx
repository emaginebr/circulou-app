import { useNavigate } from 'react-router-dom';
import { RegisterForm } from 'nauth-react';
import { useTranslation } from 'react-i18next';

export const RegisterPage = () => {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  return (
    <section className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-4 text-center">{t('register')}</h1>
      <RegisterForm onSuccess={() => navigate('/', { replace: true })} />
    </section>
  );
};
