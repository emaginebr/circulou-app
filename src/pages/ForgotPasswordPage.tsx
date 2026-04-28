import { ForgotPasswordForm } from 'nauth-react';
import { useTranslation } from 'react-i18next';

export const ForgotPasswordPage = () => {
  const { t } = useTranslation('auth');
  return (
    <section className="max-w-md mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-4 text-center">{t('forgotPassword')}</h1>
      <ForgotPasswordForm />
    </section>
  );
};
