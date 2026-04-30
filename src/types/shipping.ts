/**
 * Mock client-side de cotação de frete. Não bate em endpoint backend — o serviço
 * `shippingService` retorna valores determinísticos a partir do CEP digitado.
 *
 * TODO(LOFN-shipping): substituir por integração real (Correios, ME, etc.) quando
 * o backend abrir um endpoint de cotação.
 */
export type ShippingMethod = 'Sedex' | 'PAC' | 'Retirada';

export interface ShippingEta {
  min: number;
  max: number;
}

export interface ShippingQuote {
  method: ShippingMethod;
  priceCents: number;
  etaDays: ShippingEta;
}
