/**
 * MOCK :: LOFN-G30/G31/G32/G33 — atributos estruturados (condition, brand, color,
 * material, composition, gender, model, sizes, measurements). O backend Lofn ainda
 * não modela. Tipos consumidos pelo `ProductAttributes` e pelos `ProductStateBadges`.
 */
export interface ProductAttribute {
  label: string;
  value: string;
}

export type ProductAttributesGroupTitle = 'Geral' | 'Medidas' | 'Cuidados';

export interface ProductAttributesGroup {
  title: ProductAttributesGroupTitle;
  items: ProductAttribute[];
}

export type ProductCondition =
  | 'new-with-tag'
  | 'semi-new'
  | 'great'
  | 'signs-of-use';

export interface ProductAttributes {
  productId: number;
  /** MOCK :: LOFN-G31 — condição da peça (não existe no backend ainda). */
  condition: ProductCondition;
  /** MOCK :: LOFN-G32 — tamanho BR (string para acomodar "39", "P", "EU40"). */
  sizeBr: string | null;
  groups: ProductAttributesGroup[];
}
