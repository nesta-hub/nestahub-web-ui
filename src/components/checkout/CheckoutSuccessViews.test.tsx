import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { CheckoutSuccessView } from './CheckoutSuccessView';
import { DesktopCheckoutSuccessView } from './DesktopCheckoutSuccessView';

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
