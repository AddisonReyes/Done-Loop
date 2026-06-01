import type { MonetizationPlan, PremiumFeature } from '@/features/monetization/types/plans';

const premiumFeatures = new Set<PremiumFeature>([
  'full_history',
  'advanced_stats',
  'more_filters',
  'visual_customization',
  'data_export',
  'backups',
]);

export const EntitlementsService = {
  canUseFeature(plan: MonetizationPlan, feature: PremiumFeature): boolean {
    if (plan === 'premium') {
      return premiumFeatures.has(feature);
    }

    return false;
  },

  shouldShowAds(plan: MonetizationPlan): boolean {
    return plan === 'free';
  },
};
