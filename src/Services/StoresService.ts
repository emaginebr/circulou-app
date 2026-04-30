import { HttpClient, graphqlUrl } from '@/Services/HttpClient';
import type { StoreInfo } from '@/types/store';
import { StoreStatusEnum } from '@/types/store';
import type { CategoryInfo } from '@/types/category';
import type { StoreReputation } from '@/types/storeReputation';

interface GraphQLResponse<T> {
  data?: T;
  errors?: { message: string }[];
}

const STORES_QUERY = /* GraphQL */ `
  query Stores {
    stores(skip: 0, take: 50) {
      items {
        storeId
        slug
        name
        logoUrl
        logo
        ownerId
        status
      }
    }
  }
`;

const STORE_BY_SLUG_QUERY = /* GraphQL */ `
  query StoreBySlug($slug: String!) {
    storeBySlug(slug: $slug) {
      storeId
      slug
      name
      logoUrl
      logo
      ownerId
      status
      categories {
        categoryId
        slug
        name
      }
    }
  }
`;

class StoresService {
  private cache: StoreInfo[] | null = null;

  async listAll(signal?: AbortSignal): Promise<StoreInfo[]> {
    if (this.cache) return this.cache;
    const url = graphqlUrl();
    if (!url) {
      this.cache = [];
      return this.cache;
    }
    const opts = signal ? { signal, skipAuth: true } : { skipAuth: true };
    const response = await HttpClient.post<
      GraphQLResponse<{ stores: { items: StoreInfo[] } }>
    >(
      url,
      { query: STORES_QUERY },
      opts,
    );
    const all = response.data?.stores?.items ?? [];
    const active = all.filter(s => isActiveStatus(s.status));
    this.cache = active;
    return active;
  }

  async getBySlug(
    slug: string,
    signal?: AbortSignal,
  ): Promise<(StoreInfo & { categories?: CategoryInfo[] }) | null> {
    const url = graphqlUrl();
    if (!url) return null;
    const opts = signal ? { signal, skipAuth: true } : { skipAuth: true };
    const response = await HttpClient.post<
      GraphQLResponse<{ storeBySlug: (StoreInfo & { categories?: CategoryInfo[] }) | null }>
    >(url, { query: STORE_BY_SLUG_QUERY, variables: { slug } }, opts);
    return response.data?.storeBySlug ?? null;
  }

  /**
   * MOCK :: LOFN-G35 — reputação da loja (rating, salesCount, joinedAt, city/UF).
   * Backend Lofn não modela. Hash determinístico do `storeId` garante visual
   * estável entre reloads.
   *
   * TODO(LOFN-G35): substituir por GET /stores/:storeId/reputation quando o
   * backend abrir.
   */
  getReputation(storeId: number): Promise<StoreReputation> {
    return Promise.resolve(buildMockReputation(storeId));
  }

  invalidate(): void {
    this.cache = null;
  }
}

// ── Mocks de reputação (LOFN-G35) ──────────────────────────────────────────

const REPUTATION_CITIES: ReadonlyArray<{ city: string; state: string }> = [
  { city: 'São Paulo', state: 'SP' },
  { city: 'Belo Horizonte', state: 'MG' },
  { city: 'Rio de Janeiro', state: 'RJ' },
  { city: 'Curitiba', state: 'PR' },
  { city: 'Porto Alegre', state: 'RS' },
  { city: 'Salvador', state: 'BA' },
  { city: 'Recife', state: 'PE' },
  { city: 'Fortaleza', state: 'CE' },
];

const hashStoreId = (storeId: number): number => {
  let h = Math.abs(storeId | 0) + 0x9e3779b1;
  h = (h ^ (h >>> 16)) * 0x85ebca6b;
  h = (h ^ (h >>> 13)) * 0xc2b2ae35;
  return Math.abs(h ^ (h >>> 16));
};

const buildMockReputation = (storeId: number): StoreReputation => {
  const hash = hashStoreId(storeId);
  // Rating em [4.5, 5.0] com 1 casa decimal.
  const ratingTenths = 45 + (hash % 6);
  const rating = Math.round((ratingTenths / 10) * 10) / 10;
  const salesCount = 200 + (hash % 1900);
  // Data de entrada — entre 6 e 36 meses atrás (estável por storeId).
  const monthsAgo = 6 + (hash % 30);
  const joined = new Date();
  joined.setUTCMonth(joined.getUTCMonth() - monthsAgo);
  joined.setUTCDate(1);
  joined.setUTCHours(0, 0, 0, 0);
  const place = REPUTATION_CITIES[hash % REPUTATION_CITIES.length]!;

  return {
    storeId,
    rating,
    salesCount,
    joinedAt: joined.toISOString(),
    city: place.city,
    state: place.state,
  };
};

const isActiveStatus = (status: StoreInfo['status']): boolean =>
  status === StoreStatusEnum.Active || (status as unknown as string) === 'Active';

export const storesService = new StoresService();
export default StoresService;
