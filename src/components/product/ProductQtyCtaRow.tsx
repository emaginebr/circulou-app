interface ProductQtyCtaRowProps {
  qty: number;
  setQty: (n: number) => void;
  limit: number;
  disabled?: boolean;
  adding: boolean;
  productName: string;
  onAddToCart: () => void;
  isFav: boolean;
  onToggleFav: () => void;
  /** Quando true, esconde stepper/CTA primário e mostra botão "Avise-me se voltar". */
  soldOut?: boolean;
}

export const ProductQtyCtaRow = ({
  qty,
  setQty,
  limit,
  disabled = false,
  adding,
  productName,
  onAddToCart,
  isFav,
  onToggleFav,
  soldOut = false,
}: ProductQtyCtaRowProps) => {
  const max = Math.max(1, limit);
  const canDec = qty > 1;
  const canInc = qty < max;
  const stepperDisabled = disabled || soldOut || max === 1;

  const dec = () => {
    if (canDec) setQty(qty - 1);
  };
  const inc = () => {
    if (canInc) setQty(qty + 1);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="pdp-qty-row">
        {/* Qty stepper */}
        <div
          role="group"
          aria-label="Seletor de quantidade"
          className="qty-stepper inline-flex items-center"
          style={{
            border: '1.5px solid var(--color-cedro)',
            borderRadius: 'var(--radius)',
            overflow: 'hidden',
            height: 52,
          }}
        >
          <button
            type="button"
            aria-label="Diminuir quantidade"
            onClick={dec}
            disabled={stepperDisabled || !canDec}
            style={{
              width: 44,
              height: '100%',
              background: 'transparent',
              border: 'none',
              color: 'var(--color-cedro)',
              fontSize: '1.15rem',
              cursor: stepperDisabled || !canDec ? 'not-allowed' : 'pointer',
              opacity: stepperDisabled || !canDec ? 0.4 : 1,
            }}
          >
            −
          </button>
          <input
            id="pdp-qty"
            type="number"
            min={1}
            max={max}
            value={qty}
            disabled={stepperDisabled}
            aria-label="Quantidade selecionada"
            onChange={e => {
              const n = Number(e.target.value) || 1;
              setQty(Math.max(1, Math.min(max, n)));
            }}
            style={{
              width: 48,
              height: '100%',
              border: 'none',
              textAlign: 'center',
              fontFamily: 'var(--font-sans)',
              fontWeight: 600,
              color: 'var(--color-cedro)',
              background: 'transparent',
              borderLeft: '1px solid var(--color-line)',
              borderRight: '1px solid var(--color-line)',
              MozAppearance: 'textfield',
            }}
          />
          <button
            type="button"
            aria-label="Aumentar quantidade"
            onClick={inc}
            disabled={stepperDisabled || !canInc}
            style={{
              width: 44,
              height: '100%',
              background: 'transparent',
              border: 'none',
              color: 'var(--color-cedro)',
              fontSize: '1.15rem',
              cursor: stepperDisabled || !canInc ? 'not-allowed' : 'pointer',
              opacity: stepperDisabled || !canInc ? 0.4 : 1,
            }}
          >
            +
          </button>
        </div>

        {/* CTA primário ou notificação */}
        {soldOut ? (
          <button
            type="button"
            className="circulou-btn-ghost pdp-cta-primary"
            style={{ minHeight: 52, fontSize: '1rem', width: '100%' }}
            onClick={onToggleFav}
            aria-label={`Avise-me quando ${productName} voltar`}
          >
            Avise-me se voltar
          </button>
        ) : (
          <button
            type="button"
            className="circulou-btn-primary pdp-cta-primary"
            style={{ minHeight: 52, fontSize: '1rem', width: '100%' }}
            onClick={onAddToCart}
            disabled={disabled || adding}
            aria-label={`Adicionar ${productName} à sacola`}
          >
            {adding ? 'Adicionando...' : 'Adicionar à sacola'}
          </button>
        )}

        {/* Favoritar */}
        <button
          type="button"
          aria-pressed={isFav}
          aria-label={isFav ? `Remover ${productName} dos favoritos` : `Favoritar ${productName}`}
          onClick={onToggleFav}
          className="pdp-cta-fav inline-flex items-center justify-center transition-colors"
          style={{
            width: 52,
            height: 52,
            borderRadius: 'var(--radius)',
            border: '1.5px solid var(--color-cedro)',
            background: isFav ? 'var(--color-cobre)' : 'var(--color-surface)',
            color: isFav ? 'var(--color-cru)' : 'var(--color-cedro)',
            fontSize: '1.4rem',
            cursor: 'pointer',
            flexShrink: 0,
            ...(isFav ? { borderColor: 'var(--color-cobre)' } : {}),
          }}
        >
          {isFav ? '♥' : '♡'}
        </button>
      </div>

      {limit === 1 ? (
        <span
          style={{
            fontSize: '0.78rem',
            color: 'var(--color-mute)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          máx. 1 por compra
        </span>
      ) : null}

      {/* Layout grid da linha — usa style tag inline para grid-template-areas em mobile.
          Tailwind 4 sem plugin não cobre grid-template-areas, então fica inline. */}
      <style>{`
        .pdp-qty-row {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          gap: 0.75rem;
          align-items: center;
        }
        @media (max-width: 520px) {
          .pdp-qty-row {
            grid-template-columns: auto auto;
            grid-template-areas:
              "qty fav"
              "cta cta";
            gap: 0.6rem 0.75rem;
          }
          .pdp-qty-row > .qty-stepper { grid-area: qty; }
          .pdp-qty-row > .pdp-cta-fav { grid-area: fav; }
          .pdp-qty-row > .pdp-cta-primary { grid-area: cta; }
        }
      `}</style>
    </div>
  );
};
