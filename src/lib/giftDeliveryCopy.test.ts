import { describe, it, expect } from 'vitest';
import { giftDeliveryCopy } from './giftDeliveryCopy';
import type { ConfiguredGiftCard } from '@/pages/GiftCardDetailsV2';
import { giftCardThemes } from '@/components/gifting/GiftCardThemes';

const theme = giftCardThemes[0];

const card = (overrides: Partial<ConfiguredGiftCard>): ConfiguredGiftCard => ({
  id: 'test-id',
  theme,
  amount: 1_000_000,
  deliveryMethod: 'link',
  recipientName: 'Jane',
  ...overrides,
});

describe('giftDeliveryCopy', () => {
  describe('single card', () => {
    it('email: "directly to {name}"', () => {
      expect(giftDeliveryCopy([card({ deliveryMethod: 'email' })])).toEqual(
        'After payment, we\'ll email the gift card directly to Jane.'
      );
    });

    it('whatsapp: "on WhatsApp"', () => {
      expect(giftDeliveryCopy([card({ deliveryMethod: 'whatsapp' })])).toEqual(
        'After payment, we\'ll send the gift card to Jane on WhatsApp.'
      );
    });

    it('link: "shareable link to you"', () => {
      expect(giftDeliveryCopy([card({ deliveryMethod: 'link' })])).toEqual(
        'After payment, we\'ll email the shareable gift card link to you.'
      );
    });
  });

  describe('multiple same method', () => {
    it('all email: "each gift card to its recipient"', () => {
      expect(
        giftDeliveryCopy([
          card({ deliveryMethod: 'email', recipientName: 'Jane' }),
          card({ deliveryMethod: 'email', recipientName: 'Bob' }),
        ])
      ).toEqual('After payment, we\'ll email each gift card directly to its recipient.');
    });

    it('all whatsapp: "each gift card on WhatsApp"', () => {
      expect(
        giftDeliveryCopy([
          card({ deliveryMethod: 'whatsapp', recipientName: 'Jane' }),
          card({ deliveryMethod: 'whatsapp', recipientName: 'Bob' }),
        ])
      ).toEqual('After payment, we\'ll send each gift card to its recipient on WhatsApp.');
    });

    it('all link: "shareable links to you"', () => {
      expect(
        giftDeliveryCopy([
          card({ deliveryMethod: 'link' }),
          card({ deliveryMethod: 'link' }),
        ])
      ).toEqual('After payment, we\'ll email the shareable gift card links to you.');
    });
  });

  describe('mixed', () => {
    it('email + whatsapp: only mentions recipients, no links part', () => {
      expect(
        giftDeliveryCopy([
          card({ deliveryMethod: 'email' }),
          card({ deliveryMethod: 'whatsapp' }),
        ])
      ).toEqual(
        'After payment, we\'ll send gift cards to the recipients you chose.'
      );
    });

    it('email + link: mentions recipients and "shareable links to you"', () => {
      expect(
        giftDeliveryCopy([
          card({ deliveryMethod: 'email' }),
          card({ deliveryMethod: 'link' }),
        ])
      ).toEqual(
        'After payment, we\'ll send gift cards to the recipients you chose and email shareable links to you for the rest.'
      );
    });

    it('whatsapp + link: mentions recipients and "shareable links to you"', () => {
      expect(
        giftDeliveryCopy([
          card({ deliveryMethod: 'whatsapp' }),
          card({ deliveryMethod: 'link' }),
        ])
      ).toEqual(
        'After payment, we\'ll send gift cards to the recipients you chose and email shareable links to you for the rest.'
      );
    });

    it('all three methods: mentions recipients and links', () => {
      expect(
        giftDeliveryCopy([
          card({ deliveryMethod: 'email' }),
          card({ deliveryMethod: 'whatsapp' }),
          card({ deliveryMethod: 'link' }),
        ])
      ).toEqual(
        'After payment, we\'ll send gift cards to the recipients you chose and email shareable links to you for the rest.'
      );
    });
  });

  describe('lead parameter', () => {
    it('lead="before": "After payment"', () => {
      expect(giftDeliveryCopy([card()], 'after')).toMatch(/^After payment,/);
    });

    it('lead="after": "Once your payment is confirmed"', () => {
      expect(giftDeliveryCopy([card()], 'after')).toMatch(/^After payment,/);
    });

    it('accepts "before" for different lead text', () => {
      const result = giftDeliveryCopy([card({ deliveryMethod: 'email' })], 'before');
      expect(result).toMatch(/^Once your payment is confirmed,/);
    });
  });

  describe('empty list', () => {
    it('returns empty string', () => {
      expect(giftDeliveryCopy([])).toBe('');
    });
  });
});
