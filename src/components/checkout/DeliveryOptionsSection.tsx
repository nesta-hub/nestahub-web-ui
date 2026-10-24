import { CalendarDays, Loader2, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatPrice, type DeliveryChoice, type DeliveryOptions } from '@/lib/api';
import { describeInstantTiming, withDate } from '@/lib/delivery-choice';
import { cn } from '@/lib/utils';
import { DeliverySummaryCard } from './DeliverySummaryCard';

interface Props {
  options: DeliveryOptions | null;
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
  choice: DeliveryChoice | null;
  /** Null takes the choice back, which is what "Change" does. */
  onChoose: (choice: DeliveryChoice | null) => void;
}

/**
 * One delivery option, built like the Pickup and Deliver to Address cards (the same Card, the
 * same icon circle, centred), with the same three lines in every card so they are the same
 * height: the name, when it arrives (bold and coloured: for Instant how soon, for Community
 * Delivery the days the area is served), and the price. Choosing Community Delivery gives the buyer the
 * closest of those days, which the server has already worked out (see the summary row).
 */
function OptionCard({
  icon,
  title,
  when,
  price,
  selected,
  onSelect,
}: {
  icon: React.ReactNode;
  title: string;
  when: string;
  price: number;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <Card
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        'p-4 cursor-pointer transition-all hover:border-primary hover:shadow-md active:scale-[0.98]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        selected && 'border-primary bg-primary/5',
      )}
    >
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">{icon}</div>
        <div className="space-y-0.5">
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="text-xs font-semibold text-accent">{when}</p>
          <p className="text-sm font-semibold text-foreground">{formatPrice(price)}</p>
        </div>
      </div>
    </Card>
  );
}

/** Shown but not choosable: the option exists, just not at this address (yet). */
function UnavailableCard({
  icon,
  title,
  note,
  price,
}: {
  icon: React.ReactNode;
  title: string;
  /** Where the day goes on a live card: why it cannot be chosen. */
  note: string;
  price?: number;
}) {
  return (
    <Card aria-disabled="true" className="p-4 opacity-60 bg-muted/40">
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">{icon}</div>
        <div className="space-y-0.5">
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="text-xs font-semibold text-muted-foreground">{note}</p>
          {price !== undefined && <p className="text-sm font-semibold text-foreground">{formatPrice(price)}</p>}
        </div>
      </div>
    </Card>
  );
}

const INSTANT_UNAVAILABLE: Record<string, string> = {
  beyond_range: "Instant delivery doesn't reach this address.",
  no_delivery_days: 'Instant delivery is paused right now.',
};

/**
 * Once an address is chosen: the delivery options the server offers there, side by side like
 * Pickup and Deliver to Address. Instant (with how long it should take when it is today), and
 * Community Delivery (choosable inside an area that has it, greyed out "coming soon" elsewhere).
 * Nothing is pre-selected. Once one is chosen it becomes a summary row with "Change", like the
 * other steps. Every price and date shown comes from the server; nothing here works one out.
 */
export function DeliveryOptionsSection({ options, isLoading, error, onRetry, choice, onChoose }: Props) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-2" role="status">
        <Loader2 className="w-4 h-4 animate-spin" />
        Checking delivery options for your address…
      </div>
    );
  }

  if (error || !options) {
    return (
      <Card className="p-4 border-destructive bg-destructive/10" role="alert">
        <p className="text-sm text-destructive">We couldn't work out delivery for this address.</p>
        <Button variant="ghost" size="sm" onClick={onRetry} className="mt-2">
          Try again
        </Button>
      </Card>
    );
  }

  const { instant, community } = options;

  // Outside the delivery area altogether: nothing to choose from.
  if (instant.available === false && instant.reason === 'outside_area') {
    return (
      <Card className="p-4 border-destructive bg-destructive/10" role="alert">
        <p className="text-sm text-destructive">We don't deliver to this address yet.</p>
        <p className="text-xs text-muted-foreground mt-1">
          Try another address, or choose pickup instead.
        </p>
      </Card>
    );
  }

  // Chosen: just that one, as a summary row. (A choice that is no longer on offer shows the cards.)
  if (choice === 'instant' && instant.available === true) {
    return (
      <Summary
        icon={<Zap className="w-4 h-4 text-primary" />}
        title="Instant delivery"
        when={describeInstantTiming(instant.dateLabel, instant.etaMinutes, instant.date)}
        price={instant.feeKobo}
        onChange={() => onChoose(null)}
      />
    );
  }
  if (choice === 'community' && community?.status === 'available') {
    return (
      <Summary
        icon={<CalendarDays className="w-4 h-4 text-primary" />}
        title="Community Delivery"
        when={withDate(community.dateLabel, community.date)}
        price={community.feeKobo}
        onChange={() => onChoose(null)}
      />
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-base font-medium text-muted-foreground">Choose how you'd like it delivered</h3>
      <div role="radiogroup" aria-label="Delivery option" className="grid grid-cols-2 gap-3">
        {instant.available === true ? (
          <OptionCard
            icon={<Zap className="w-5 h-5" />}
            title="Instant delivery"
            when={describeInstantTiming(instant.dateLabel, instant.etaMinutes)}
            price={instant.feeKobo}
            selected={false}
            onSelect={() => onChoose('instant')}
          />
        ) : (
          <UnavailableCard
            icon={<Zap className="w-5 h-5" />}
            title="Instant delivery"
            note={INSTANT_UNAVAILABLE[instant.reason] ?? 'Not available for this address.'}
          />
        )}

        {community?.status === 'available' ? (
          <OptionCard
            icon={<CalendarDays className="w-5 h-5" />}
            title="Community Delivery"
            when={community.daysLabel}
            price={community.feeKobo}
            selected={false}
            onSelect={() => onChoose('community')}
          />
        ) : community?.status === 'coming_soon' ? (
          <UnavailableCard
            icon={<CalendarDays className="w-5 h-5" />}
            title="Community Delivery"
            note="Coming soon"
            price={community.feeKobo}
          />
        ) : null}
      </div>
    </div>
  );
}

/** The chosen option, in the same two-line row the other finished steps use (name, then the rest). */
function Summary({
  icon,
  title,
  when,
  price,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  when: string;
  price: number;
  onChange: () => void;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-base font-medium text-muted-foreground">Delivery Option</h3>
      <DeliverySummaryCard
        icon={icon}
        title={title}
        subtitle={
          <>
            <span className="font-semibold text-accent">{when}</span> ·{' '}
            <span className="font-semibold text-foreground">{formatPrice(price)}</span>
          </>
        }
        onChangeClick={onChange}
      />
    </div>
  );
}
