import { useState, type KeyboardEvent } from 'react';
import { shippingService } from '@/Services/ShippingService';
import { LofnApiError } from '@/Services/HttpClient';
import { formatBRL } from '@/lib/currency';
import type { ShippingQuote } from '@/types/shipping';

interface ProductShippingCalculatorProps {
  productId: number;
}

type CalcStatus = 'idle' | 'calculating' | 'result' | 'error';

const CEP_PATTERN = /^\d{5}-?\d{3}$/;

export const ProductShippingCalculator = ({ productId }: ProductShippingCalculatorProps) => {
  const [cep, setCep] = useState('');
  const [status, setStatus] = useState<CalcStatus>('idle');
  const [quotes, setQuotes] = useState<ShippingQuote[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCalc = async () => {
    if (!CEP_PATTERN.test(cep.trim())) {
      setStatus('error');
      setErrorMsg('Informe um CEP válido (formato 00000-000).');
      setQuotes([]);
      return;
    }
    setStatus('calculating');
    setErrorMsg(null);
    try {
      const result = await shippingService.calculate(cep.trim(), [productId]);
      setQuotes(result);
      setStatus('result');
    } catch (err) {
      const message =
        err instanceof LofnApiError
          ? 'CEP inválido. Confirme os 8 dígitos.'
          : err instanceof Error
            ? err.message
            : 'Não foi possível calcular o frete.';
      setErrorMsg(message);
      setStatus('error');
      setQuotes([]);
    }
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void handleCalc();
    }
  };

  // MOCK :: LOFN-G38 — política de devolução estática.
  return (
    <section
      aria-labelledby="pdp-shipping-title"
      className="py-4"
      style={{ borderTop: '1px dashed var(--color-line)' }}
    >
      <h2
        id="pdp-shipping-title"
        className="inline-flex items-center gap-2 mb-2.5"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.78rem',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--color-cedro)',
        }}
      >
        <span aria-hidden="true" style={{ color: 'var(--color-cobre)', fontSize: '0.9rem' }}>
          ✈
        </span>
        Calcular frete e prazo
      </h2>

      <div className="flex gap-2" style={{ maxWidth: 360 }}>
        <input
          type="text"
          inputMode="numeric"
          placeholder="00000-000"
          aria-label="Digite seu CEP"
          aria-invalid={status === 'error' ? 'true' : 'false'}
          value={cep}
          onChange={e => setCep(e.target.value)}
          onKeyDown={handleKey}
          className="flex-1 min-w-0"
          style={{
            height: 44,
            borderRadius: 'var(--radius-sm)',
            border: '1.5px solid var(--color-line)',
            background: 'var(--color-surface)',
            padding: '0 0.85rem',
            fontFamily: 'var(--font-sans)',
            fontSize: '0.95rem',
            color: 'var(--color-ink)',
            letterSpacing: '0.05em',
          }}
        />
        <button
          type="button"
          onClick={() => void handleCalc()}
          disabled={status === 'calculating'}
          aria-label="Calcular frete para o CEP informado"
          style={{
            height: 44,
            padding: '0 1.1rem',
            borderRadius: 'var(--radius-sm)',
            border: '1.5px solid var(--color-cedro)',
            background: 'var(--color-cedro)',
            color: 'var(--color-cru)',
            fontFamily: 'var(--font-sans)',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: status === 'calculating' ? 'wait' : 'pointer',
            opacity: status === 'calculating' ? 0.7 : 1,
          }}
        >
          {status === 'calculating' ? 'Calculando…' : 'Calcular'}
        </button>
      </div>

      <a
        href="https://buscacepinter.correios.com.br/"
        className="inline-block mt-2 text-sm"
        style={{
          color: 'var(--color-cobre)',
          textDecoration: 'underline',
        }}
        target="_blank"
        rel="noopener noreferrer"
      >
        Não sei meu CEP →
      </a>

      <div role="status" aria-live="polite" className="mt-3">
        {status === 'error' && errorMsg ? (
          <p
            className="text-sm"
            style={{
              color: 'var(--color-cobre)',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.04em',
            }}
          >
            {errorMsg}
          </p>
        ) : null}

        {status === 'result' && quotes.length > 0 ? (
          <ul className="list-none p-0 m-0 flex flex-col gap-2">
            {quotes.map(q => (
              <li
                key={q.method}
                className="grid items-baseline gap-3 text-sm"
                style={{
                  gridTemplateColumns: '1fr auto auto',
                  padding: '0.7rem 0.85rem',
                  background: 'var(--color-areia-soft)',
                  border: '1px solid var(--color-line)',
                  borderRadius: 'var(--radius)',
                }}
              >
                <span style={{ fontWeight: 600, color: 'var(--color-cedro)' }}>
                  {q.method}
                </span>
                <span style={{ color: 'var(--color-mute)', fontSize: '0.85rem' }}>
                  {q.etaDays.min} a {q.etaDays.max} dias úteis
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    color: 'var(--color-cobre)',
                    fontSize: '1.05rem',
                  }}
                >
                  {formatBRL(q.priceCents / 100)}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <p
        className="mt-2.5"
        style={{
          fontSize: '0.75rem',
          color: 'var(--color-mute)',
          fontFamily: 'var(--font-mono)',
          letterSpacing: '0.04em',
        }}
      >
        Devolução grátis em até 7 dias se a peça não te servir.
      </p>
    </section>
  );
};
