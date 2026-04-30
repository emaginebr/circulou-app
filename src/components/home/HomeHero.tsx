import { Link } from 'react-router-dom';
import { useParallax } from '@/hooks/useParallax';

const SUN_CLIP =
  'polygon(50% 0%, 58% 12%, 70% 6%, 70% 22%, 86% 22%, 80% 36%, 96% 44%, 84% 56%, 96% 70%, 80% 74%, 86% 90%, 70% 84%, 70% 100%, 58% 92%, 50% 104%, 42% 92%, 30% 100%, 30% 84%, 14% 90%, 20% 74%, 4% 70%, 16% 56%, 4% 44%, 20% 36%, 14% 22%, 30% 22%, 30% 6%, 42% 12%)';

const HERO_PHOTO_URL =
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=900&auto=format&fit=crop';

export const HomeHero = () => {
  // MOCK: contadores fixos (a serem trocados por endpoint /metrics).
  const kpis = [
    { value: '+12k', label: 'produtos circulando' },
    { value: '87', label: 'ONGs parceiras' },
    { value: '3.4t', label: 'resíduos evitados' },
  ];

  const sunRef = useParallax<HTMLDivElement>({
    anchor: 'root',
    speed: 0.3,
    max: 180,
    xRange: 40,
    rotateRange: -8,
    desktopOnly: true,
  });

  const blobRef = useParallax<HTMLDivElement>({
    anchor: 'root',
    speed: -0.2,
    max: 120,
    xRange: -60,
    desktopOnly: true,
  });

  const textRef = useParallax<HTMLDivElement>({
    anchor: 'root',
    speed: -0.12,
    max: 40,
    opacityRange: 0.45,
    desktopOnly: true,
  });

  const photoRef = useParallax<HTMLDivElement>({
    anchor: 'root',
    speed: -0.18,
    max: 60,
    desktopOnly: true,
  });

  return (
    <section
      aria-labelledby="hero-title"
      className="relative overflow-hidden flex items-center min-h-[78vh]"
      style={{ background: 'var(--color-oliva)' }}
    >
      <div
        ref={sunRef}
        aria-hidden="true"
        className="parallax-hero-sun absolute pointer-events-none opacity-90"
        style={{
          width: 520,
          height: 520,
          right: -120,
          top: -180,
          background: 'var(--color-ambar)',
          clipPath: SUN_CLIP,
        }}
      />
      <div
        ref={blobRef}
        aria-hidden="true"
        className="parallax-hero-blob absolute pointer-events-none opacity-80"
        style={{
          width: 240,
          height: 240,
          bottom: -60,
          left: -40,
          background: 'var(--color-cobre)',
          borderRadius: '48% 52% 38% 62% / 42% 38% 62% 58%',
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-[1280px] px-6 lg:px-10 py-16">
        <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-12 items-center">
          <div ref={textRef} className="parallax-hero-text">
            <span
              className="circulou-tag"
              style={{
                background: 'rgba(245,236,229,0.12)',
                color: 'var(--color-ambar)',
                border: '1px solid rgba(245,236,229,0.18)',
              }}
            >
              ✦ Coleção de Outono · 2026
            </span>
            <h1
              id="hero-title"
              className="max-w-[36ch]"
              style={{
                fontSize: 'var(--text-display-xl)',
                color: 'var(--color-cru)',
                marginTop: '1.5rem',
                marginBottom: '1.5rem',
              }}
            >
              Moda sustentável não é o futuro. É o presente.
            </h1>
            <p
              className="mb-8 max-w-[48ch]"
              style={{
                fontSize: 'var(--text-body-lg)',
                color: 'var(--color-areia)',
              }}
            >
              Produtos garimpados, curados com afeto e prontos para uma segunda jornada. Compre, venda e doe — tudo em um só marketplace.
            </p>
            <div className="flex flex-wrap gap-4">
              {/* TODO rota /search dedicada à curadoria */}
              <Link
                to="/search"
                className="circulou-btn-primary"
                style={{
                  background: 'var(--color-ambar)',
                  color: 'var(--color-cedro)',
                }}
              >
                Garimpar agora →
              </Link>
              {/* TODO rota /quero-vender (não existe ainda) */}
              <Link
                to="/quero-vender"
                className="circulou-btn-ghost"
                style={{
                  borderColor: 'var(--color-cru)',
                  color: 'var(--color-cru)',
                }}
              >
                Quero vender
              </Link>
            </div>

            {/* MOCK: contadores estáticos (substituir por /metrics no futuro) */}
            <dl
              className="flex flex-wrap gap-8 mt-8"
              style={{ color: 'var(--color-areia)', fontSize: '0.9rem' }}
            >
              {kpis.map(kpi => (
                <div key={kpi.label}>
                  <dt className="sr-only">{kpi.label}</dt>
                  <dd>
                    <strong
                      style={{
                        color: 'var(--color-ambar)',
                        fontFamily: 'var(--font-display)',
                        fontSize: '1.5rem',
                      }}
                    >
                      {kpi.value}
                    </strong>
                    <br />
                    {kpi.label}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative">
            <div
              ref={photoRef}
              className="parallax-hero-photo overflow-hidden"
              role="img"
              aria-label="Produto em destaque"
              style={{
                borderRadius: 'var(--radius-lg)',
                aspectRatio: '4 / 5',
                background: `url('${HERO_PHOTO_URL}') center/cover`,
                boxShadow: 'var(--shadow-lg)',
                transform: 'rotate(-1.5deg)',
              }}
            />
            <span
              aria-hidden="true"
              className="absolute"
              style={{
                top: -12,
                right: 32,
                transform: 'rotate(4deg)',
                background: 'var(--color-cru)',
                color: 'var(--color-cedro)',
                fontFamily: 'var(--font-display)',
                fontSize: '0.95rem',
                padding: '0.5rem 1.2rem',
                borderRadius: '999px',
                boxShadow: 'var(--shadow)',
              }}
            >
              feito com amor ♡
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
