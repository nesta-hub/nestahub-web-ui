import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { CheckoutSuccessView } from './CheckoutSuccessView';
import { DesktopCheckoutSuccessView } from './DesktopCheckoutSuccessView';
import { PaymentOutcomeView } from '@/components/gifting/PaymentOutcomeView';

/** After ordering, the buyer is told how and when their order is being delivered. */

const SUMMARY = 'Community Delivery · Gbagada · Sat 24 Oct 2026 · ₦500';

describe('mobile success screen', () => {
  const show = (deliverySummary?: string | null) =>
    render(
      <MemoryRouter>
        <CheckoutSuccessView orderId="NST1" deliverySummary={deliverySummary} />
      </MemoryRouter>,
    );

  it('says how and when the order is being delivered', () => {
    show(SUMMARY);

    expect(screen.getByTestId('delivery-summary')).toHaveTextContent(`Delivery: ${SUMMARY}`);
  });

  it.each([undefined, null, ''])('shows no delivery line when there is nothing to say (%p), as for pickup', (value) => {
    show(value);

    expect(screen.queryByTestId('delivery-summary')).toBeNull();
    expect(screen.getByText('NST1')).toBeInTheDocument();
  });
});

describe('desktop success screen', () => {
  const show = (deliverySummary?: string | null) =>
    render(
      <DesktopCheckoutSuccessView
        orderId="NST1"
        message="We're verifying your payment."
        onViewOrder={vi.fn()}
        onReturnToShop={vi.fn()}
        deliverySummary={deliverySummary}
      />,
    );

  it('says how and when the order is being delivered', () => {
    show(SUMMARY);

    expect(screen.getByTestId('delivery-summary')).toHaveTextContent(`Delivery: ${SUMMARY}`);
  });

  it.each([undefined, null, ''])('shows no delivery line when there is nothing to say (%p)', (value) => {
    show(value);

    expect(screen.queryByTestId('delivery-summary')).toBeNull();
  });
});

/** Under the message, a screen can carry the offer to subscribe. Without one, the screen is exactly as it was. */
describe('the content slot under the message', () => {
  it('mobile success shows what it is given, and nothing extra when it is given nothing', () => {
    const { rerender } = render(
      <MemoryRouter>
        <CheckoutSuccessView orderId="NST1" afterContent={<p>offer here</p>} />
      </MemoryRouter>,
    );
    expect(screen.getByText('offer here')).toBeInTheDocument();
    rerender(
      <MemoryRouter>
        <CheckoutSuccessView orderId="NST1" />
      </MemoryRouter>,
    );
    expect(screen.queryByText('offer here')).toBeNull();
  });

  it('desktop success shows what it is given, above the buttons, and nothing extra when it is given nothing', () => {
    const props = { orderId: 'NST1', message: 'm', onViewOrder: vi.fn(), onReturnToShop: vi.fn() };
    const { rerender } = render(<DesktopCheckoutSuccessView {...props} afterContent={<p>offer here</p>} />);
    expect(screen.getByText('offer here')).toBeInTheDocument();
    const offer = screen.getByText('offer here');
    const button = screen.getByRole('button', { name: 'View Order Status' });
    expect(offer.compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    rerender(<DesktopCheckoutSuccessView {...props} />);
    expect(screen.queryByText('offer here')).toBeNull();
  });

  it('the payment outcome screen (mobile and desktop) shows what it is given, and nothing extra otherwise', () => {
    const copy = { view: 'confirmed', heading: 'Payment confirmed', body: 'Thanks', ctas: [] } as unknown as Parameters<typeof PaymentOutcomeView>[0]['copy'];
    for (const variant of ['mobile', 'desktop'] as const) {
      const { unmount } = render(<PaymentOutcomeView copy={copy} giftCards={[]} onAction={vi.fn()} variant={variant} afterContent={<p>offer here</p>} />);
      expect(screen.getByText('offer here')).toBeInTheDocument();
      unmount();
      render(<PaymentOutcomeView copy={copy} giftCards={[]} onAction={vi.fn()} variant={variant} />).unmount();
      expect(screen.queryByText('offer here')).toBeNull();
    }
  });
});
