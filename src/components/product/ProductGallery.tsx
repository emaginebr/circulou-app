import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import type { ProductImageInfo } from '@/types/image';

const PLACEHOLDER =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500"><rect width="400" height="500" fill="%23efe3c7"/><text x="50%" y="50%" font-family="sans-serif" font-size="20" fill="%238a7e6f" text-anchor="middle" dy=".3em">Sem imagem</text></svg>';

interface ProductGalleryProps {
  images: ProductImageInfo[];
  fallbackUrl?: string;
  productName: string;
  /** Quando true, aplica overlay editorial e desabilita zoom hint. */
  soldOut?: boolean;
}

interface SortableImage {
  imageUrl: string;
  sortOrder?: number;
}

interface NormalizedImage {
  imageUrl: string;
  sortOrder: number;
}

const padCounter = (n: number, total: number): string => {
  const width = String(total).length;
  return String(n).padStart(width, '0');
};

export const ProductGallery = ({
  images,
  fallbackUrl,
  productName,
  soldOut = false,
}: ProductGalleryProps) => {
  const list = useMemo<NormalizedImage[]>(() => {
    const sorted = [...images]
      .map<NormalizedImage>(img => ({
        imageUrl: img.imageUrl,
        sortOrder: (img as SortableImage).sortOrder ?? 0,
      }))
      .filter(img => Boolean(img.imageUrl))
      .sort((a, b) => a.sortOrder - b.sortOrder);
    if (sorted.length > 0) return sorted;
    if (fallbackUrl) return [{ imageUrl: fallbackUrl, sortOrder: 0 }];
    return [{ imageUrl: PLACEHOLDER, sortOrder: 0 }];
  }, [images, fallbackUrl]);

  const [active, setActive] = useState(0);

  useEffect(() => {
    if (active >= list.length) setActive(0);
  }, [list.length, active]);

  const total = list.length;
  const current = list[active] ?? list[0]!;
  const isSingle = total <= 1;

  const goPrev = () => setActive(i => Math.max(0, i - 1));
  const goNext = () => setActive(i => Math.min(total - 1, i + 1));

  const handleKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goPrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      goNext();
    }
  };

  return (
    <section
      className="grid gap-4 items-start lg:grid-cols-[88px_minmax(0,1fr)] grid-cols-1"
      aria-roledescription="carousel"
      aria-label={`Galeria de fotos de ${productName}`}
      style={{ minWidth: 0 }}
    >
      {/* Thumbs — vertical em ≥1024 px, horizontal abaixo. order:2 em mobile. */}
      {!isSingle ? (
        <ul
          role="tablist"
          aria-label="Miniaturas de foto"
          className="list-none p-0 m-0 flex gap-2 lg:flex-col flex-row overflow-auto order-2 lg:order-1"
          style={{
            maxHeight: 640,
            scrollbarWidth: 'thin',
            scrollbarColor: 'var(--color-line) transparent',
          }}
        >
          {list.map((img, i) => {
            const isCurrent = i === active;
            return (
              <li key={`${img.imageUrl}-${i}`} role="presentation" className="shrink-0">
                <button
                  type="button"
                  role="tab"
                  aria-current={isCurrent ? 'true' : 'false'}
                  aria-controls="pdp-gallery-main"
                  aria-label={`Foto ${i + 1} de ${total}`}
                  onClick={() => setActive(i)}
                  className="block p-0 cursor-pointer transition-transform"
                  style={{
                    width: 88,
                    height: 110,
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                    border: `1.5px solid ${isCurrent ? 'var(--color-cobre)' : 'var(--color-line)'}`,
                    boxShadow: isCurrent ? '0 0 0 2px rgba(174,83,26,0.25)' : 'none',
                    background: 'var(--color-areia-soft)',
                  }}
                >
                  <img
                    src={img.imageUrl}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    className="w-full h-full object-cover"
                    onError={e => {
                      (e.currentTarget as HTMLImageElement).src = PLACEHOLDER;
                    }}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {/* Foto principal */}
      <div
        id="pdp-gallery-main"
        role="tabpanel"
        aria-roledescription="slide"
        aria-label={`Foto ${active + 1} de ${total}: ${productName}`}
        tabIndex={0}
        onKeyDown={handleKey}
        className={`relative overflow-hidden order-1 lg:order-2 ${isSingle ? 'lg:col-span-2' : ''}`}
        style={{
          aspectRatio: '4 / 5',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--color-areia-soft)',
          boxShadow: 'var(--shadow)',
          cursor: soldOut ? 'default' : 'zoom-in',
        }}
      >
        <img
          src={current.imageUrl}
          alt={productName}
          className="w-full h-full object-cover"
          onError={e => {
            (e.currentTarget as HTMLImageElement).src = PLACEHOLDER;
          }}
        />

        {soldOut ? (
          <div
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: 'rgba(20,20,20,0.55)' }}
          >
            <span
              className="px-4 py-2"
              style={{
                background: 'var(--color-cobre)',
                color: 'var(--color-cru)',
                borderRadius: 999,
                fontFamily: 'var(--font-mono)',
                fontSize: '0.78rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Esta peça já circulou
            </span>
          </div>
        ) : null}

        {!isSingle ? (
          <>
            <span
              aria-hidden="true"
              className="absolute"
              style={{
                top: '0.85rem',
                left: '0.85rem',
                padding: '0.3rem 0.7rem',
                background: 'rgba(20,20,20,0.55)',
                color: 'var(--color-cru)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                letterSpacing: '0.1em',
                borderRadius: 999,
                backdropFilter: 'blur(4px)',
              }}
            >
              {padCounter(active + 1, total)} / {padCounter(total, total)}
            </span>

            <button
              type="button"
              aria-label="Foto anterior"
              onClick={goPrev}
              disabled={active === 0}
              className="absolute -translate-y-1/2"
              style={{
                top: '50%',
                left: '0.85rem',
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'rgba(245,236,229,0.92)',
                border: '1.5px solid var(--color-line)',
                color: 'var(--color-cedro)',
                fontSize: '1.25rem',
                cursor: active === 0 ? 'not-allowed' : 'pointer',
                opacity: active === 0 ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Próxima foto"
              onClick={goNext}
              disabled={active === total - 1}
              className="absolute -translate-y-1/2"
              style={{
                top: '50%',
                right: '0.85rem',
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'rgba(245,236,229,0.92)',
                border: '1.5px solid var(--color-line)',
                color: 'var(--color-cedro)',
                fontSize: '1.25rem',
                cursor: active === total - 1 ? 'not-allowed' : 'pointer',
                opacity: active === total - 1 ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ›
            </button>

            <div
              aria-hidden="true"
              className="absolute flex gap-1.5 -translate-x-1/2"
              style={{
                bottom: '0.85rem',
                left: '50%',
                padding: '0.35rem 0.6rem',
                background: 'rgba(20,20,20,0.32)',
                borderRadius: 999,
              }}
            >
              {list.map((_, i) => (
                <span
                  key={i}
                  aria-current={i === active ? 'true' : undefined}
                  style={{
                    width: i === active ? 18 : 7,
                    height: 7,
                    borderRadius: 999,
                    background:
                      i === active ? 'var(--color-ambar)' : 'rgba(245,236,229,0.55)',
                    transition: 'width 160ms ease, background 160ms ease',
                  }}
                />
              ))}
            </div>

            {!soldOut ? (
              <span
                aria-hidden="true"
                className="absolute hidden lg:inline-block"
                style={{
                  bottom: '0.85rem',
                  right: '0.85rem',
                  padding: '0.35rem 0.7rem',
                  background: 'rgba(245,236,229,0.92)',
                  color: 'var(--color-cedro)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.7rem',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  borderRadius: 999,
                }}
              >
                ⤢ clique para ampliar
              </span>
            ) : null}
          </>
        ) : null}
      </div>
    </section>
  );
};
