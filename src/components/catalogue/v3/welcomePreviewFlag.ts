/**
 * TEMPORARY, and only on the dev server: a way to look at the signed-in first card without
 * signing in. Open the shop with `?welcome=1`, for example `/shop?welcome=1`; it shows the card
 * for a made-up customer ("Sade", ₦10,060).
 *
 * It does nothing in a production build, and nothing for someone really signed in.
 *
 * TO REMOVE IT: delete this file, WelcomePreview.tsx and their tests, and the lines in
 * MobileShopHome.tsx that mention `WelcomePreview` and `welcomePreviewRequested`.
 */
export function welcomePreviewRequested(search: string): boolean {
  if (!import.meta.env.DEV) return false;
  return !!new URLSearchParams(search).get("welcome");
}
