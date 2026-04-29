import { Link } from 'react-router-dom';
import { useParallax } from '@/hooks/useParallax';

interface StepItemProps {
  num: string;
  title: string;
  description: string;
}

const StepItem = ({ num, title, description }: StepItemProps) => (
  <li className="flex gap-4 items-center">
    <div
      className="flex items-center justify-center shrink-0"
      style={{
        width: 56,
        height: 56,
        borderRadius: '50%',
        background: 'var(--color-ambar)',
        color: 'var(--color-cedro)',
        fontFamily: 'var(--font-display)',
        fontSize: '1.5rem',
      }}
      aria-hidden="true"
    >
      {num}
    </div>
    <div>
      <h3
        style={{
          color: 'var(--color-cru)',
          fontSize: '1.15rem',
          fontFamily: 'var(--font-sans)',
          fontWeight: 600,
        }}
      >
        {title}
      </h3>
      <p style={{ color: 'var(--color-areia)', fontSize: '0.95rem' }}>
        {description}
      </p>
    </div>
  </li>
);

export const HomeSellCta = () => {
  const blobRef = useParallax<HTMLSpanElement>({
    anchor: 'self',
    range: -160,
    offset: 80,
    xRange: 80,
    desktopOnly: true,
  });

  return (
    <section
      id="sell"
      className="relative overflow-hidden"
      style={{
        background: 'var(--color-cobre)',
        color: 'var(--color-cru)',
        paddingTop: 'var(--space-section)',
        paddingBottom: 'var(--space-section)',
      }}
    >
      <span
        ref={blobRef}
        aria-hidden="true"
        className="parallax-sell-blob absolute pointer-events-none"
        style={{
          width: 380,
          height: 380,
          right: -80,
          bottom: -120,
          background: 'var(--color-ambar)',
          opacity: 0.55,
          borderRadius: '48% 52% 38% 62% / 42% 38% 62% 58%',
        }}
      />

      <div className="relative z-[2] mx-auto w-full max-w-[1280px] px-6 lg:px-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <span
              className="circulou-tag"
              style={{
                background: 'var(--color-cru)',
                color: 'var(--color-cedro)',
              }}
            >
              ▲ Sacola do Bem
            </span>
            <h2
              className="mt-4"
              style={{
                fontSize: 'var(--text-display-lg)',
                color: 'var(--color-cru)',
              }}
            >
              Sua peça circulou.
              <br />
              Seu guarda-roupa agradece.
            </h2>
            <p
              className="mt-5 max-w-[50ch]"
              style={{
                fontSize: 'var(--text-body-lg)',
                color: 'var(--color-areia)',
              }}
            >
              A gente envia uma sacola pra sua casa. Você devolve com as peças que não usa mais. A Circulou cuida do resto — fotografa, anuncia e te paga em dinheiro ou crédito.
            </p>
            <div className="flex flex-wrap gap-4 mt-8">
              {/* TODO rota /quero-vender (não existe ainda) */}
              <Link
                to="/quero-vender"
                className="circulou-btn-primary"
                style={{
                  background: 'var(--color-cru)',
                  color: 'var(--color-cedro)',
                }}
              >
                Solicitar minha sacola
              </Link>
              {/* TODO rota /como-funciona */}
              <Link
                to="/como-funciona"
                className="circulou-btn-ghost"
                style={{
                  borderColor: 'var(--color-cru)',
                  color: 'var(--color-cru)',
                }}
              >
                Como funciona
              </Link>
            </div>
          </div>

          <ol
            className="list-none p-0 flex flex-col gap-6"
            aria-label="Como funciona em três passos"
          >
            <StepItem
              num="01"
              title="Peça sua sacola"
              description="Grátis e a gente entrega na sua porta."
            />
            <StepItem
              num="02"
              title="Encha e devolva"
              description="Coleta sem custo pra você."
            />
            <StepItem
              num="03"
              title="Receba seu valor"
              description="Em dinheiro, crédito ou doação para ONG."
            />
          </ol>
        </div>
      </div>
    </section>
  );
};
