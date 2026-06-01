import type { MonetizationPlan } from '@/features/monetization/types/plans';

export const AdsService = {
  shouldShowAds(plan: MonetizationPlan): boolean {
    return plan === 'free';
  },

  getDevelopmentPlacementId(): string {
    return 'mock-dev-placement';
  },
};
