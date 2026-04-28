import { HttpClient, graphqlUrl } from '@/Services/HttpClient';
import type { StoreInfo } from '@/types/store';
import { StoreStatusEnum } from '@/types/store';
import type { CategoryInfo } from '@/types/category';

interface GraphQLResponse<T> {
  data?: T;
  errors?: { message: string }[];
}

const STORES_QUERY = /* GraphQL */ `
  query Stores {
    stores {
      storeId
      slug
      name
      logoUrl
      logo
      ownerId
      status
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
    const response = await HttpClient.post<GraphQLResponse<{ stores: StoreInfo[] }>>(
      url,
      { query: STORES_QUERY },
      opts,
    );
    const all = response.data?.stores ?? [];
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

  invalidate(): void {
    this.cache = null;
  }
}

const isActiveStatus = (status: StoreInfo['status']): boolean =>
  status === StoreStatusEnum.Active || (status as unknown as string) === 'Active';

export const storesService = new StoresService();
export default StoresService;
