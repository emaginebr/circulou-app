import { useState, type FormEvent } from 'react';
import type { Address } from '@/types/address';

const ZIP_RE = /^\d{5}-?\d{3}$/;

interface AddressFormProps {
  initial?: Address;
  onSubmit: (data: Omit<Address, 'addressId' | 'createdAt'>) => void;
  onCancel?: () => void;
}

const empty: Omit<Address, 'addressId' | 'createdAt'> = {
  label: '',
  recipientName: '',
  zipCode: '',
  street: '',
  number: '',
  complement: '',
  district: '',
  city: '',
  state: '',
  country: 'BR',
  isDefault: false,
};

const inputCls =
  'w-full rounded-[var(--radius-sm)] border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]';
const labelCls = 'block text-xs font-medium mb-1';

export const AddressForm = ({ initial, onSubmit, onCancel }: AddressFormProps) => {
  const [data, setData] = useState<Omit<Address, 'addressId' | 'createdAt'>>(() =>
    initial
      ? {
          label: initial.label,
          recipientName: initial.recipientName,
          zipCode: initial.zipCode,
          street: initial.street,
          number: initial.number,
          complement: initial.complement,
          district: initial.district,
          city: initial.city,
          state: initial.state,
          country: initial.country,
          isDefault: initial.isDefault,
        }
      : empty,
  );
  const [zipError, setZipError] = useState<string | null>(null);

  const handle = (key: keyof typeof data, value: string | boolean) =>
    setData(prev => ({ ...prev, [key]: value }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!ZIP_RE.test(data.zipCode)) {
      setZipError('CEP inválido (formato 00000-000).');
      return;
    }
    if (data.state.length !== 2) {
      setZipError('UF deve ter 2 caracteres.');
      return;
    }
    setZipError(null);
    onSubmit({ ...data, state: data.state.toUpperCase() });
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-12 gap-2">
      <div className="col-span-12 md:col-span-4">
        <label className={labelCls}>Apelido (opcional)</label>
        <input
          className={inputCls}
          value={data.label ?? ''}
          onChange={e => handle('label', e.target.value)}
          placeholder="Casa, Trabalho..."
        />
      </div>
      <div className="col-span-12 md:col-span-8">
        <label className={labelCls}>Destinatário</label>
        <input
          className={inputCls}
          required
          value={data.recipientName}
          onChange={e => handle('recipientName', e.target.value)}
        />
      </div>
      <div className="col-span-12 md:col-span-4">
        <label className={labelCls}>CEP</label>
        <input
          className={inputCls}
          required
          value={data.zipCode}
          onChange={e => handle('zipCode', e.target.value)}
          placeholder="00000-000"
        />
        {zipError ? (
          <small className="text-[var(--color-danger)] text-xs">{zipError}</small>
        ) : null}
      </div>
      <div className="col-span-12 md:col-span-6">
        <label className={labelCls}>Rua / Logradouro</label>
        <input
          className={inputCls}
          required
          value={data.street}
          onChange={e => handle('street', e.target.value)}
        />
      </div>
      <div className="col-span-6 md:col-span-2">
        <label className={labelCls}>Número</label>
        <input
          className={inputCls}
          required
          value={data.number}
          onChange={e => handle('number', e.target.value)}
        />
      </div>
      <div className="col-span-12 md:col-span-6">
        <label className={labelCls}>Complemento</label>
        <input
          className={inputCls}
          value={data.complement ?? ''}
          onChange={e => handle('complement', e.target.value)}
        />
      </div>
      <div className="col-span-12 md:col-span-6">
        <label className={labelCls}>Bairro</label>
        <input
          className={inputCls}
          required
          value={data.district}
          onChange={e => handle('district', e.target.value)}
        />
      </div>
      <div className="col-span-9 md:col-span-4">
        <label className={labelCls}>Cidade</label>
        <input
          className={inputCls}
          required
          value={data.city}
          onChange={e => handle('city', e.target.value)}
        />
      </div>
      <div className="col-span-3 md:col-span-2">
        <label className={labelCls}>UF</label>
        <input
          className={inputCls}
          required
          maxLength={2}
          value={data.state}
          onChange={e => handle('state', e.target.value.toUpperCase())}
        />
      </div>
      <div className="col-span-12">
        <label className="inline-flex items-center gap-2 mt-1 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4 accent-[var(--color-primary)]"
            checked={data.isDefault}
            onChange={e => handle('isDefault', e.target.checked)}
          />
          Definir como padrão
        </label>
      </div>
      <div className="col-span-12 flex gap-2 mt-1">
        <button
          type="submit"
          className="inline-flex items-center px-3 py-1.5 text-sm bg-[var(--color-primary)] text-white rounded-[var(--radius)] hover:bg-[var(--color-primary-hover)] transition"
        >
          Salvar
        </button>
        {onCancel ? (
          <button
            type="button"
            className="inline-flex items-center px-3 py-1.5 text-sm border border-gray-300 rounded-[var(--radius)] hover:bg-gray-50"
            onClick={onCancel}
          >
            Cancelar
          </button>
        ) : null}
      </div>
    </form>
  );
};
