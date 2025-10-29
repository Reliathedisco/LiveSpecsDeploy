export interface StripeProduct {
  id: string;
  priceId: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  mode: 'payment' | 'subscription';
  checkoutUrl?: string;
}

export const stripeProducts: StripeProduct[] = [
  {
    id: 'prod_TKM48IuUYr9lFU',
    priceId: 'price_1SNhMCDtzkP5chVjQrzUYht1',
    name: 'LiveSpecs Team - Monthly',
    description: 'Unlimited API specs, unlimited collaborators, GitHub sync, advanced mock server, priority support, and all Team features. Perfect for growing development teams.',
    price: 99.00,
    currency: 'usd',
    mode: 'subscription',
    checkoutUrl: 'https://buy.stripe.com/eVq5kC8vk1NnbZ24AA3wQ01'
  }
];

export function getProductByPriceId(priceId: string): StripeProduct | undefined {
  return stripeProducts.find(product => product.priceId === priceId);
}

export function formatPrice(price: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(price);
}