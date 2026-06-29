// Shared key + helper for the in-progress custom-gift build draft.
// The draft is a *temporary* convenience: it persists while the customer is
// building and across checkout↔back navigation, and is cleared once their
// order is successfully placed (see Checkout) so a returning customer starts fresh.
export const GIFT_DRAFT_KEY = "customGiftDraft";

export function clearCustomGiftDraft() {
  try {
    sessionStorage.removeItem(GIFT_DRAFT_KEY);
  } catch {
    /* storage unavailable — non-fatal */
  }
}
