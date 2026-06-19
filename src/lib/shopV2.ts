/**
 * Feature flag for the redesigned (v2) shop/catalogue experience.
 * Enable by setting VITE_SHOP_V2=true in the environment.
 */
export const SHOP_V2_ENABLED =
  String(import.meta.env.VITE_SHOP_V2 ?? '').toLowerCase() === 'true';

/**
 * Feature flag for the redesigned (v2) gifting experience.
 * Enable by setting VITE_GIFT_V2=true in the environment.
 */
export const GIFT_V2_ENABLED =
  String(import.meta.env.VITE_GIFT_V2 ?? '').toLowerCase() === 'true';
