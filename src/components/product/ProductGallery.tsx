import { useState } from 'react';
import type { ProductImageInfo } from '@/types/image';

const PLACEHOLDER =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" fill="%23eef2ee"/><text x="50%" y="50%" font-family="sans-serif" font-size="20" fill="%2390a4ae" text-anchor="middle" dy=".3em">Sem imagem</text></svg>';

interface ProductGalleryProps {
  images: ProductImageInfo[];
  fallbackUrl?: string;
  productName: string;
}

interface SortableImage {
  imageUrl: string;
  sortOrder?: number;
}

export const ProductGallery = ({
  images,
  fallbackUrl,
  productName,
}: ProductGalleryProps) => {
  const sorted = [...images].sort(
    (a, b) =>
      ((a as SortableImage).sortOrder ?? 0) - ((b as SortableImage).sortOrder ?? 0),
  );
  const initial = sorted[0]?.imageUrl ?? fallbackUrl ?? PLACEHOLDER;
  const [active, setActive] = useState(initial);

  return (
    <div>
      <img
        src={active}
        alt={productName}
        className="w-full aspect-square object-cover rounded-[var(--radius)] mb-2"
        onError={e => {
          (e.currentTarget as HTMLImageElement).src = PLACEHOLDER;
        }}
      />
      {sorted.length > 1 ? (
        <div className="flex gap-2 flex-wrap">
          {sorted.map(img => (
            <button
              key={img.imageUrl}
              type="button"
              className={`p-0 border rounded ${active === img.imageUrl ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]' : 'border-gray-300'}`}
              onClick={() => setActive(img.imageUrl)}
              aria-label={`Imagem de ${productName}`}
            >
              <img
                src={img.imageUrl}
                alt=""
                className="w-16 h-16 object-cover rounded"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
};
