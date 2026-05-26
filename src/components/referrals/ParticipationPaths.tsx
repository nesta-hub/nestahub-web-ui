import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Send, KeyRound } from "lucide-react";

interface Props {
  onSignup: () => void;
}

const newSteps = [
  "Register below with your name, email & WhatsApp number",
  "We send you a personal sharing code and link",
  "Talk to a nursing mum about nesta hub and share your code or link",
  "She uses it to register",
  "You earn points as she completes orders",
];

const customerSteps = [
  "Open your Account page",
  "Find your personal sharing code and link",
  "Talk to nursing mums in your circle and share it them",
  "They use it to register",
  "Your points grow quietly as they order",
];

function KraftCard({
  index,
  badge,
  title,
  subtitle,
  steps,
  Icon,
  children,
}: {
  index: string;
  badge: string;
  title: string;
  subtitle: string;
  steps: string[];
  Icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="relative rounded-2xl bg-nesta-cream border border-nesta-brown/15 p-6 md:p-7 shadow-[0_2px_0_hsl(var(--foreground)/0.03),0_18px_40px_-24px_hsl(var(--foreground)/0.2)] flex flex-col">
      {/* Torn / perforated top edge */}
      <svg
        className="absolute -top-[7px] left-0 right-0 w-full h-3 text-nesta-cream"
        viewBox="0 0 100 6"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d="M0 6 L0 3 Q2.5 0 5 3 T10 3 T15 3 T20 3 T25 3 T30 3 T35 3 T40 3 T45 3 T50 3 T55 3 T60 3 T65 3 T70 3 T75 3 T80 3 T85 3 T90 3 T95 3 T100 3 L100 6 Z"
          fill="currentColor"
        />
      </svg>

      <div className="flex items-start justify-between mb-5">
        <p className="font-display text-[11px] uppercase tracking-[0.25em] text-nesta-brown/70">
          {index} <span className="mx-1 text-nesta-brown/30">/</span> {badge}
        </p>
        <Icon className="w-5 h-5 text-nesta-sage" />
      </div>

      <h3 className="text-lg md:text-xl font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>

      <ol className="mt-5 space-y-3 flex-1">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-3 text-sm text-foreground">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-card text-nesta-brown text-xs font-semibold flex items-center justify-center ring-1 ring-nesta-brown/15">
              {i + 1}
            </span>
            <span className="pt-0.5">{s}</span>
          </li>
        ))}
      </ol>

      {children}
    </div>
  );
}

export function ParticipationPaths({ onSignup }: Props) {
  return (
    <section className="space-y-6">
      <div className="max-w-2xl">
        <p className="text-xs font-medium text-nesta-sage uppercase tracking-widest mb-2">How to participate</p>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground">Two simple paths</h2>
        <p className="mt-2 text-muted-foreground">
          Open to everyone, whether you've ordered with us or just love what we do.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 md:gap-8 pt-2">
        <KraftCard
          index="01"
          badge="New"
          title="New to Nestahub"
          subtitle="No account needed. Get a sharing link in a minute."
          steps={newSteps}
          Icon={Send}
        >
          <Button
            onClick={onSignup}
            className="mt-6 bg-nesta-brown text-primary-foreground hover:bg-nesta-brown/90 self-start"
          >
            Register to start
            <ArrowRight className="w-4 h-4" />
          </Button>
        </KraftCard>

        <KraftCard
          index="02"
          badge="Existing"
          title="Already a customer"
          subtitle="Your sharing link is waiting in your account."
          steps={customerSteps}
          Icon={KeyRound}
        >
          <Button
            asChild
            variant="outline"
            className="mt-6 self-start border-nesta-sage/50 text-nesta-sage hover:bg-nesta-sage/10 hover:text-nesta-sage"
          >
            <Link to="/account">
              Go to my account
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </KraftCard>
      </div>
    </section>
  );
}
