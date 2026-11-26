import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { CheckoutSuccessView } from './CheckoutSuccessView';
import { DesktopCheckoutSuccessView } from './DesktopCheckoutSuccessView';
import { PaymentOutcomeView } from '@/components/gifting/PaymentOutcomeView';
import { resolveOutcomeCopy } from '@/lib/giftOutcomeCopy';

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

describe('mobile success screen in the Subscribe design (switch on, a shop order)', () => {
  const show = (props: Partial<Parameters<typeof CheckoutSuccessView>[0]> = {}) =>
    render(
      <MemoryRouter>
        <CheckoutSuccessView orderId="NSTCSKIH3" paymentOption="pay-on-delivery" deliverySummary={SUMMARY} subscribeDesign {...props} />
      </MemoryRouter>,
    );

  it('says "Order placed", the order ID, and the delivery, under a tick', () => {
    show();
    expect(screen.getByRole('heading', { name: 'Order placed' })).toBeInTheDocument();
    expect(screen.getByText('NSTCSKIH3').closest('p')).toHaveTextContent('Order ID NSTCSKIH3');
    expect(screen.getByTestId('delivery-summary')).toHaveTextContent(`Delivery: ${SUMMARY}`);
    expect(screen.queryByText('Order Placed!')).toBeNull();
  });

  it('puts the Subscribe panel inside the same card as the note about the order', () => {
    show({ afterContent: <p>the subscribe panel</p> });
    const card = screen.getByRole('region', { name: 'What happens next' });
    expect(card).toHaveTextContent("Your order has been placed. We'll prepare it and get it to you. Pay when it arrives.");
    expect(card).toContainElement(screen.getByText('the subscribe panel'));
  });

  it('is just the note when there is nothing to offer', () => {
    show();
    expect(screen.getByRole('region', { name: 'What happens next' })).toHaveTextContent(/^Your order has been placed/);
  });

  it('ends with View Order Status and Return to Shop, in the Nesta Hub brown', () => {
    show();
    expect(screen.getByRole('button', { name: 'View Order Status' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Return to Shop' })).toHaveClass('bg-shop-cta');
  });

  it('switch off (no subscribeDesign): the screen is exactly as before', () => {
    show({ subscribeDesign: false });
    expect(screen.getByText('Order Placed!')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'What happens next' })).toBeNull();
  });
});

describe('bank-transfer result in the Subscribe design (switch on, a shop order)', () => {
  const confirmed = resolveOutcomeCopy({ authState: 'user', deliveryMethod: 'link', confirmed: true, orderKind: 'other', buyerEmail: 'ada@example.com' });
  const pending = resolveOutcomeCopy({ authState: 'user', deliveryMethod: 'link', confirmed: false, orderKind: 'other', buyerEmail: 'ada@example.com' });
  const show = (copy = confirmed, afterContent?: React.ReactNode, design: boolean = true) => {
    const onAction = vi.fn();
    render(
      <PaymentOutcomeView
        copy={copy}
        giftCards={[]}
        onAction={onAction}
        afterContent={afterContent}
        subscribeDesign={design ? { orderId: 'NSTCSKIH3', deliverySummary: SUMMARY } : undefined}
      />,
    );
    return onAction;
  };

  it('confirmed: the same heading and words, with the order ID and delivery, and the Subscribe panel inside the card', () => {
    show(confirmed, <p>the subscribe panel</p>);
    expect(screen.getByRole('heading', { name: 'Payment Confirmed' })).toBeInTheDocument();
    expect(screen.getByText('NSTCSKIH3').closest('p')).toHaveTextContent('Order ID NSTCSKIH3');
    expect(screen.getByTestId('delivery-summary')).toHaveTextContent(`Delivery: ${SUMMARY}`);
    const card = screen.getByRole('region', { name: 'What happens next' });
    expect(card).toHaveTextContent("We've received your payment and your order is being processed.");
    expect(card).toContainElement(screen.getByText('the subscribe panel'));
  });

  it('not confirmed yet: says so, with where we will write, and the same buttons', () => {
    const onAction = show(pending);
    expect(screen.getByRole('heading', { name: "We couldn't confirm your payment just yet" })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'What happens next' })).toHaveTextContent("We don't want to keep you waiting.");
    expect(screen.getByRole('region', { name: 'What happens next' })).toHaveTextContent('ada@example.com');
    screen.getByRole('button', { name: 'View Order Status' }).click();
    expect(onAction).toHaveBeenCalledWith('order-history');
    expect(screen.getByRole('button', { name: 'Return to Shop' })).toHaveClass('bg-shop-cta');
  });

  it('switch off (no subscribeDesign): the screen is exactly as before', () => {
    show(confirmed, null, false);
    expect(screen.queryByRole('region', { name: 'What happens next' })).toBeNull();
    expect(screen.queryByText('NSTCSKIH3')).toBeNull();
  });
});
