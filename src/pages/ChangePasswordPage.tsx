import { ChangePasswordForm } from 'nauth-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const ChangePasswordPage = () => {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  return (
    <section className="max-w-md mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-4 text-center">{t('changePassword')}</h1>
      <ChangePasswordForm onSuccess={() => navigate('/profile', { replace: true })} />
    </section>
  );
};
