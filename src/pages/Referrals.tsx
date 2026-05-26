import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";

import { ReferralHero } from "@/components/referrals/ReferralHero";
import { PullQuote } from "@/components/referrals/PullQuote";
import { ParticipationPaths } from "@/components/referrals/ParticipationPaths";
import { SimpleSteps } from "@/components/referrals/SimpleSteps";
import { RewardsCatalogue } from "@/components/referrals/RewardsCatalogue";
import { WhatSheFinds } from "@/components/referrals/WhatSheFinds";
import { SampleMessages } from "@/components/referrals/SampleMessages";
import { ReferralFAQ } from "@/components/referrals/ReferralFAQ";
import { JoinCTA } from "@/components/referrals/JoinCTA";
import { BalanceLookupDrawer } from "@/components/referrals/BalanceLookupDrawer";
import { SignupDrawer } from "@/components/referrals/SignupDrawer";

export default function Referrals() {
  const [signupOpen, setSignupOpen] = useState(false);
  const [balanceOpen, setBalanceOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <Layout>
      {/* Fixed scroll indicator — pinned to bottom of viewport, fades out once scrolled */}
      <div
        className={`hidden md:flex fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex-col items-center gap-1 text-nesta-sage animate-bounce transition-opacity duration-500 ${scrolled ? "opacity-0 pointer-events-none" : "opacity-100"}`}
        aria-hidden
      >
        <div className="w-0.5 h-5 bg-nesta-sage rounded-full" />
        <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
          <path d="M1 1l7 7 7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div className="container max-w-6xl px-4 md:px-6 py-6 md:py-10 space-y-12 md:space-y-20">

        <ReferralHero
          onJoin={() => setSignupOpen(true)}
          onCheckBalance={() => setBalanceOpen(true)}
        />

        <PullQuote />

        <WhatSheFinds />

        <ParticipationPaths onSignup={() => setSignupOpen(true)} />

        <SimpleSteps />

        <RewardsCatalogue />

        <SampleMessages />

        <ReferralFAQ />

        <JoinCTA
          onJoin={() => setSignupOpen(true)}
          onCheckBalance={() => setBalanceOpen(true)}
        />
      </div>

      <BalanceLookupDrawer open={balanceOpen} onOpenChange={setBalanceOpen} />
      <SignupDrawer open={signupOpen} onOpenChange={setSignupOpen} />
    </Layout>
  );
}
