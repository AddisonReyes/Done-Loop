import type { MonetizationPlan } from '@/features/monetization/types/plans';

export type MockPurchaseProduct = {
  id: MonetizationPlan;
  title: string;
  priceLabel: string;
};

export const PurchasesService = {
  async listProductsAsync(): Promise<MockPurchaseProduct[]> {
    return [
      { id: 'no_ads', title: 'No Ads', priceLabel: '$1.99 USD' },
      { id: 'premium', title: 'Premium', priceLabel: '$5.99 USD' },
    ];
  },

  async restorePurchasesAsync(): Promise<MonetizationPlan> {
    return 'free';
  },
};
