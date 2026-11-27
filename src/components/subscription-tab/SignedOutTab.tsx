import { ArrowLeft, ArrowRight } from "lucide-react";
import { SignInForm } from "@/components/auth/SignInForm";
import { SubscribeIntroCard } from "./EmptyTab";

/**
 * The Subscribe tab for someone not signed in: all about what Subscribe does, with one button to log in. The button
 * opens the full sign-in page (`signingIn`); after signing in she comes back to her own tab.
 */
export function SignedOutTab({ signingIn, onLogin, onBack }: { signingIn: boolean; onLogin: () => void; onBack: () => void }) {
  if (signingIn) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="px-3 pt-3">
          <button
            type="button"
            aria-label="Back"
            onClick={onBack}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-shop-ink shadow-[0_8px_18px_-10px_rgba(51,38,28,0.35),0_1px_4px_rgba(51,38,28,0.06)]"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
          </button>
        </div>
        <SignInForm
          title="Sign in to start subscribing"
          description="Pick what you buy again and again, and we remind you before you run out"
          containerClassName="flex-1 flex flex-col items-center justify-center px-6 py-16"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl pb-28 md:pb-16">
      <div className="px-5 pb-2 pt-6">
        <h1 className="font-display text-2xl font-bold leading-tight tracking-[-0.01em] text-foreground">Subscriptions</h1>
      </div>
      <div className="px-5 pt-4">
        <SubscribeIntroCard
          action={
            // White on the sage card, like the strip that holds the steps for a signed-in customer; the brand brown in the words and arrow.
            <button
              type="button"
              onClick={onLogin}
              className="flex h-14 w-full items-center justify-between rounded-[28px] bg-white pl-6 pr-2 text-[15px] font-bold text-shop-brown shadow-[0_6px_16px_-10px_rgba(51,38,28,0.45)]"
            >
              <span>Log in to get started</span>
              <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-full bg-shop-brown text-shop-cream">
                <ArrowRight className="h-[17px] w-[17px]" strokeWidth={2.4} />
              </span>
            </button>
          }
        />
      </div>
    </div>
  );
}
