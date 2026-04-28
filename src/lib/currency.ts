const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export const formatBRL = (value: number): string => BRL.format(value);

export const calculateFinalPrice = (price: number, discount: number): number =>
  Math.max(0, price - discount);

export const calculateDiscountPercent = (price: number, discount: number): number => {
  if (price <= 0) return 0;
  return Math.round((discount / price) * 100);
};
