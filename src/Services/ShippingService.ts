import { LofnApiError } from '@/Services/HttpClient';
import type { ShippingQuote } from '@/types/shipping';

const CEP_REGEX = /^\d{5}-?\d{3}$/;

/**
 * MOCK :: LOFN-shipping — cotação de frete simulada client-side.
 * Retorna 1-2 quotes determinísticas (Sedex + PAC) a partir do CEP.
 * Não bate em backend; latência simulada para feedback visual realista.
 *
 * TODO: trocar por integração real (Correios/ME) quando o backend expor
 * POST /shipping/quote.
 */
class ShippingService {
  async calculate(cep: string, _productIds: number[]): Promise<ShippingQuote[]> {
    if (!CEP_REGEX.test(cep.trim())) {
      throw new LofnApiError(400, 'Bad Request', { cep }, 'CEP inválido');
    }

    const digits = cep.replace(/\D/g, '');
    const seed = digits.split('').reduce((acc, ch) => acc + Number(ch), 0);

    // MOCK :: LOFN-shipping — preços derivados do hash do CEP, faixa 14-29 reais.
    const sedexCents = 1490 + ((seed * 37) % 1500);
    const pacCents = Math.max(990, sedexCents - 600 - ((seed * 13) % 400));

    // Latência sintética curta — mantém UX honesta sem travar testes.
    await new Promise(resolve => setTimeout(resolve, 320));

    return [
      {
        method: 'Sedex',
        priceCents: Math.round(sedexCents / 10) * 10,
        etaDays: { min: 3, max: 5 },
      },
      {
        method: 'PAC',
        priceCents: Math.round(pacCents / 10) * 10,
        etaDays: { min: 6, max: 10 },
      },
    ];
  }
}

export const shippingService = new ShippingService();
export default ShippingService;
