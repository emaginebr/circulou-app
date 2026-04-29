import { Link } from 'react-router-dom';
import { useParallax } from '@/hooks/useParallax';

const PHOTO_URL =
  'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=900&auto=format&fit=crop';

export const HomeEditorialBanner = () => {
  const photoRef = useParallax<HTMLDivElement>({
    anchor: 'self',
    range: -120,
    offset: 60,
    desktopOnly: true,
  });

  return (
    <section
      className="relative overflow-hidden"
      style={{
        background: 'var(--color-areia)',
        paddingTop: 'var(--space-section)',
        paddingBottom: 'var(--space-section)',
      }}
    >
      <div className="mx-auto w-full max-w-[1280px] px-6 lg:px-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div>
          <span
            className="circulou-tag"
            style={{
              background: 'var(--color-cobre)',
              color: 'var(--color-cru)',
            }}
          >
            ○ Histórias
          </span>
          <h2
            className="mt-4"
            style={{ fontSize: 'var(--text-display-lg)' }}
          >
            Cada peça carrega uma história. Qual será a próxima?
          </h2>
          <p
            className="mt-5 max-w-[52ch]"
            style={{
              color: 'var(--color-ink-soft)',
              fontSize: 'var(--text-body-lg)',
            }}
          >
            No Circulou a moda não termina no guarda-roupa — ela passa de mão em mão, ganha vida nova e diminui o impacto da indústria fast-fashion.
          </p>
          {/* TODO rota /curadoria-do-bem */}
          <Link to="/curadoria-do-bem" className="circulou-btn-primary mt-6">
            Conheça a Curadoria do Bem
          </Link>
        </div>
        <div className="relative">
          <div
            ref={photoRef}
            className="parallax-editorial overflow-hidden"
            role="img"
            aria-label="Foto editorial — Curadoria do Bem"
            style={{
              borderRadius: 'var(--radius-lg)',
              aspectRatio: '5 / 6',
              boxShadow: 'var(--shadow-lg)',
              background: `url('${PHOTO_URL}') center/cover`,
            }}
          />
        </div>
      </div>
    </section>
  );
};
