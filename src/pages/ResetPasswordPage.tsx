import { useNavigate, useSearchParams } from 'react-router-dom';
import { ResetPasswordForm } from 'nauth-react';
import { useTranslation } from 'react-i18next';

export const ResetPasswordPage = () => {
  const { t } = useTranslation('auth');
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const recoveryHash = params.get('hash') ?? params.get('recoveryHash') ?? '';
  return (
    <section className="max-w-md mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-4 text-center">{t('resetPassword')}</h1>
      <ResetPasswordForm
        recoveryHash={recoveryHash}
        onSuccess={() => navigate('/login', { replace: true })}
      />
    </section>
  );
};
