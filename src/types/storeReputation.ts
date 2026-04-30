/**
 * MOCK :: LOFN-G35 — reputação da loja (rating, salesCount, joinedAt, location).
 * O backend Lofn ainda não modela. Consumido pelo `ProductSellerCompact`.
 *
 * TODO(LOFN-G35): substituir pelo endpoint oficial de reputação quando o backend
 * abrir (GET /stores/:storeId/reputation).
 */
export interface StoreReputation {
  storeId: number;
  /** 0..5, uma casa decimal */
  rating: number;
  salesCount: number;
  /** ISO date — quando a loja entrou no marketplace */
  joinedAt: string;
  city: string;
  state: string;
}
