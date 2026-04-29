import { Link } from 'react-router-dom';

const PHOTO_CURADORIA =
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&auto=format&fit=crop';
const PHOTO_LAST_CHANCE =
  'https://images.unsplash.com/photo-1551232864-3f0890e580d9?w=900&auto=format&fit=crop';
const PHOTO_NOVAS =
  'https://images.unsplash.com/photo-1485518882345-15568b007407?w=900&auto=format&fit=crop';

interface BannerTileProps {
  href: string;
  bgUrl: string;
  tagText: string;
  tagBg: string;
  tagColor: string;
  title: string;
  description?: string;
  variant?: 'wide' | 'narrow';
}

const BannerTile = ({
  href,
  bgUrl,
  tagText,
  tagBg,
  tagColor,
  title,
  description,
  variant = 'narrow',
}: BannerTileProps) => (
  <Link
    to={href}
    className="circulou-card relative overflow-hidden block group"
    style={{
      borderRadius: 'var(--radius-lg)',
      aspectRatio: variant === 'wide' ? '16 / 11' : '4 / 5',
      backgroundImage: `url('${bgUrl}')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}
  >
    <span
      aria-hidden="true"
      className="absolute inset-0"
      style={{
        background:
          'linear-gradient(180deg, rgba(20,20,20,0) 40%, rgba(20,20,20,0.55) 100%)',
      }}
    />
    <div className="absolute left-0 right-0 bottom-0 p-6 z-[2] text-[var(--color-cru)]">
      <span
        className="circulou-tag"
        style={{ background: tagBg, color: tagColor }}
      >
        {tagText}
      </span>
      <h3
        className="mt-3"
        style={{
          fontSize:
            variant === 'wide' ? 'var(--text-display-md)' : 'var(--text-display-sm)',
          color: 'var(--color-cru)',
        }}
      >
        {title}
      </h3>
      {description ? (
        <p
          className="mt-2 max-w-[38ch]"
          style={{ color: 'var(--color-cru)' }}
        >
          {description}
        </p>
      ) : null}
    </div>
  </Link>
);

export const HomeFeatureBanners = () => (
    <section
      aria-labelledby="banners-title"
      className="mx-auto w-full max-w-[1280px] px-6 lg:px-10"
      style={{
        paddingTop: 'var(--space-section)',
        paddingBottom: 'var(--space-section)',
      }}
    >
      <h2 id="banners-title" className="sr-only">
        Destaques da semana
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-5">
        {/* TODO rota /curadoria-do-bem */}
        <BannerTile
          href="/curadoria-do-bem"
          bgUrl={PHOTO_CURADORIA}
          tagText="★ Curadoria do Bem"
          tagBg="var(--color-ambar)"
          tagColor="var(--color-cedro)"
          title="Alfaiataria que atravessa décadas"
          description="Blazers, calças e ternos selecionados peça a peça por nossa equipe."
          variant="wide"
        />
        {/* TODO rota /last-chance */}
        <BannerTile
          href="/last-chance"
          bgUrl={PHOTO_LAST_CHANCE}
          tagText="Last Chance"
          tagBg="var(--color-cobre)"
          tagColor="var(--color-cru)"
          title="Últimas peças em estoque"
        />
        {/* TODO rota /novas-com-etiquetas */}
        <BannerTile
          href="/novas-com-etiquetas"
          bgUrl={PHOTO_NOVAS}
          tagText="Novas c/ etiqueta"
          tagBg="var(--color-oliva-soft)"
          tagColor="var(--color-oliva)"
          title="Nunca usadas, prontas pra estrear"
        />
      </div>
    </section>
  );
