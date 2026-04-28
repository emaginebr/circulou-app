import { useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { AddressPicker } from '@/components/checkout/AddressPicker';
import { useAddresses } from '@/hooks/useAddresses';

const inputCls =
  'w-full rounded-[var(--radius-sm)] border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] disabled:bg-gray-100 disabled:text-[var(--color-mute)]';
const labelCls = 'block text-sm font-medium mb-1';

export const ProfilePage = () => {
  const { t } = useTranslation(['auth', 'common']);
  const { user, isAuthenticated, isLoading, updateUser, logout } = useAuth();
  const { defaultAddress, setDefault } = useAddresses();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user?.name]);

  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateUser({ name });
      toast.success('Perfil atualizado');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao atualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-4">{t('auth:profile')}</h1>
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="mb-3">
          <label htmlFor="profile-name" className={labelCls}>
            {t('auth:name')}
          </label>
          <input
            id="profile-name"
            type="text"
            className={inputCls}
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label className={labelCls}>{t('auth:email')}</label>
          <input
            type="email"
            className={inputCls}
            value={user?.email ?? ''}
            disabled
            readOnly
          />
        </div>
        <button
          type="submit"
          className="inline-flex items-center px-3 py-1.5 text-sm bg-[var(--color-primary)] text-white rounded-[var(--radius)] hover:bg-[var(--color-primary-hover)] transition disabled:opacity-50"
          disabled={saving}
        >
          {saving ? '...' : t('common:save')}
        </button>
      </form>
      <hr className="border-gray-200 my-4" />
      <h2 className="text-lg font-semibold mb-3">Endereços</h2>
      <small className="block text-[var(--color-mute)] mb-2">
        Os endereços ficam armazenados localmente neste dispositivo (LOFN-G13).
      </small>
      <AddressPicker
        selectedId={defaultAddress?.addressId ?? null}
        onSelect={id => setDefault(id)}
      />
      <hr className="border-gray-200 my-4" />
      <div className="flex flex-col gap-2">
        <Link
          to="/change-password"
          className="self-start text-[var(--color-primary)] hover:underline text-sm"
        >
          {t('auth:changePassword')}
        </Link>
        <button
          type="button"
          className="self-start inline-flex items-center px-2 py-1 text-xs border border-[var(--color-danger)] text-[var(--color-danger)] rounded-[var(--radius-sm)] hover:bg-[var(--color-danger)] hover:text-white transition"
          onClick={() => logout()}
        >
          {t('auth:logout')}
        </button>
      </div>
    </section>
  );
};
