import { useState } from 'react';
import { useAddresses } from '@/hooks/useAddresses';
import type { Address } from '@/types/address';
import { AddressForm } from '@/components/auth/AddressForm';

interface AddressPickerProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export const AddressPicker = ({ selectedId, onSelect }: AddressPickerProps) => {
  const { addresses, add, remove, setDefault } = useAddresses();
  const [showForm, setShowForm] = useState(false);

  const formatLine = (a: Address) =>
    `${a.street}, ${a.number}${a.complement ? ' ' + a.complement : ''} — ${a.district}, ${a.city}/${a.state} · CEP ${a.zipCode}`;

  return (
    <div>
      {addresses.length === 0 ? (
        <p className="text-sm text-[var(--color-mute)]">Nenhum endereço cadastrado.</p>
      ) : (
        <ul className="border border-gray-200 rounded-[var(--radius)] divide-y divide-gray-200 mb-3">
          {addresses.map(a => (
            <li key={a.addressId} className="p-3">
              <div className="flex items-start gap-2">
                <input
                  type="radio"
                  name="addr"
                  className="mt-1 h-4 w-4 accent-[var(--color-primary)]"
                  checked={selectedId === a.addressId}
                  onChange={() => onSelect(a.addressId)}
                  aria-label={`Selecionar ${a.label || a.recipientName}`}
                />
                <div className="grow min-w-0">
                  <div className="flex items-center gap-2">
                    <strong className="text-sm">{a.label || a.recipientName}</strong>
                    {a.isDefault ? (
                      <span className="inline-block px-2 py-0.5 text-xs rounded bg-[var(--color-primary)] text-white">
                        Padrão
                      </span>
                    ) : null}
                  </div>
                  <small className="block text-xs text-[var(--color-mute)]">
                    {a.recipientName}
                  </small>
                  <small className="block text-xs text-[var(--color-mute)]">
                    {formatLine(a)}
                  </small>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  {!a.isDefault ? (
                    <button
                      type="button"
                      className="text-xs text-[var(--color-primary)] hover:underline"
                      onClick={() => setDefault(a.addressId)}
                    >
                      Tornar padrão
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="text-xs text-[var(--color-danger)] hover:underline"
                    onClick={() => remove(a.addressId)}
                  >
                    Remover
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      {showForm ? (
        <div className="bg-white border border-gray-200 rounded-[var(--radius)] p-4">
          <AddressForm
            onSubmit={data => {
              add(data);
              setShowForm(false);
            }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      ) : (
        <button
          type="button"
          className="inline-flex items-center px-3 py-1.5 text-sm border border-[var(--color-primary)] text-[var(--color-primary)] rounded-[var(--radius)] hover:bg-[var(--color-primary)] hover:text-white transition"
          onClick={() => setShowForm(true)}
        >
          Adicionar novo endereço
        </button>
      )}
    </div>
  );
};
