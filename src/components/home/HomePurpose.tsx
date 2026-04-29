import { Link } from 'react-router-dom';

interface ImpactCardProps {
  number: string;
  title: string;
  description: string;
  bg: string;
}

const ImpactCard = ({ number, title, description, bg }: ImpactCardProps) => (
  <article
    style={{
      background: bg,
      borderRadius: 'var(--radius-lg)',
      padding: '2rem',
    }}
  >
    <span
      style={{
        fontFamily: 'var(--font-display)',
        fontSize: '3rem',
        color: 'var(--color-ambar)',
        lineHeight: 1,
      }}
    >
      {number}
    </span>
    <h3
      className="mt-3"
      style={{ color: 'var(--color-cru)', fontSize: '1.25rem' }}
    >
      {title}
    </h3>
    <p
      className="mt-2"
      style={{ color: 'var(--color-areia)', fontSize: '0.95rem' }}
    >
      {description}
    </p>
  </article>
);

export const HomePurpose = () => (
    <section
      style={{
        background: 'var(--color-cedro)',
        color: 'var(--color-cru)',
        paddingTop: 'var(--space-section)',
        paddingBottom: 'var(--space-section)',
      }}
    >
      <div className="mx-auto w-full max-w-[1280px] px-6 lg:px-10">
        <div className="max-w-[56ch] mb-12">
          <span
            className="circulou-tag"
            style={{
              background: 'var(--color-ambar)',
              color: 'var(--color-cedro)',
            }}
          >
            ♡ Brechó do Juntos
          </span>
          <h2
            className="mt-4"
            style={{
              fontSize: 'var(--text-display-lg)',
              color: 'var(--color-cru)',
            }}
          >
            A moda muda quando a gente muda junto.
          </h2>
          <p
            className="mt-5"
            style={{
              color: 'var(--color-areia)',
              fontSize: 'var(--text-body-lg)',
            }}
          >
            Cada peça revendida no Circulou economiza água, evita CO₂ e ainda doa parte do valor para ONGs parceiras escolhidas por você.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ImpactCard
            number="2.7M"
            title="Litros de água economizados"
            description="Cada peça reusada equivale a ~2 700 L que não foram gastos na produção."
            bg="var(--color-cobre)"
          />
          <ImpactCard
            number="87"
            title="ONGs parceiras"
            description="Quem vende escolhe pra qual causa parte do valor é doado."
            bg="var(--color-oliva)"
          />
          <ImpactCard
            number="3.4t"
            title="Tecido salvo do lixo"
            description="Tudo que deixou de virar resíduo desde nosso primeiro pedido."
            bg="var(--color-cobre)"
          />
        </div>

        <div className="text-center mt-12">
          {/* TODO rota /ongs */}
          <Link
            to="/ongs"
            className="circulou-btn-primary"
            style={{
              background: 'var(--color-ambar)',
              color: 'var(--color-cedro)',
            }}
          >
            Conheça nossas ONGs parceiras →
          </Link>
        </div>
      </div>
    </section>
  );
