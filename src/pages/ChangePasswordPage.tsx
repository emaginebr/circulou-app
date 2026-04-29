import { ChangePasswordForm } from 'nauth-react';
import { useNavigate } from 'react-router-dom';

export const ChangePasswordPage = () => {
  const navigate = useNavigate();
  return (
    <section className="max-w-md mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-4 text-center">Alterar senha</h1>
      <ChangePasswordForm onSuccess={() => navigate('/profile', { replace: true })} />
    </section>
  );
};
