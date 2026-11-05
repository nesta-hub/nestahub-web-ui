import type { ConfiguredGiftCard } from '@/pages/GiftCardDetailsV2';

type Lead = 'before' | 'after';

/**
 * The review-step and success-screen text for a set of gift cards.
 * Returns a sentence that says what will happen after payment.
 *
 * "After payment, we'll email the gift card directly to Jane."
 * "Once your payment is confirmed, we'll send each gift card to its recipient on WhatsApp."
 */
export function giftDeliveryCopy(cards: ConfiguredGiftCard[], lead: Lead = 'after'): string {
  if (cards.length === 0) return '';

  const leadText = lead === 'after' ? 'After payment,' : 'Once your payment is confirmed,';
  const allEmail = cards.every((c) => c.deliveryMethod === 'email');
  const allWhatsApp = cards.every((c) => c.deliveryMethod === 'whatsapp');
  const allLink = cards.every((c) => c.deliveryMethod === 'link');
  const hasLink = cards.some((c) => c.deliveryMethod === 'link');

  if (cards.length === 1) {
    const card = cards[0];
    if (card.deliveryMethod === 'email') {
      return `${leadText} we'll email the gift card directly to ${card.recipientName}.`;
    }
    if (card.deliveryMethod === 'whatsapp') {
      return `${leadText} we'll send the gift card to ${card.recipientName} on WhatsApp.`;
    }
    // link
    return `${leadText} we'll email the shareable gift card link to you.`;
  }

  // Multiple cards
  if (allEmail) {
    return `${leadText} we'll email each gift card directly to its recipient.`;
  }
  if (allWhatsApp) {
    return `${leadText} we'll send each gift card to its recipient on WhatsApp.`;
  }
  if (allLink) {
    return `${leadText} we'll email the shareable gift card links to you.`;
  }

  // Mixed: always mention the "we'll deliver to recipients" part, and the email links part if any
  const linkPart = hasLink ? ' and email shareable links to you for the rest' : '';
  return `${leadText} we'll send gift cards to the recipients you chose${linkPart}.`;
}
