import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { getWalletSummary } from "@/lib/api";
import { formatKobo } from "@/utils/wallet";
import { cn } from "@/lib/utils";
import { OfferArt } from "./OfferArt";
import { MOBILE_OFFERS } from "./offers";
import { firstNameOf } from "./welcomeChips";

/** The Nesta Hub advert this card stands in for: it keeps that advert's colour, baby photo and pill colour. */
const SHOP = MOBILE_OFFERS[0];

interface Props {
  /** The customer's first name; null greets them without one. */
  name: string | null;
  /** Kobo; null while the balance is still loading. */
  balanceKobo: number | null;
  onOpenWallet: () => void;
  /** "Shop now": show every category, and scroll down to them. */
  onShop: () => void;
}

/**
 * The first card on the shop for a signed-in customer. It is the Nesta Hub advert (its blue and its
 * baby photo) with the pill saying "WELCOME BACK, SADE", the wallet and its balance in big letters
 * where the title was, and a "Shop now" button. It fills whatever slide holds it (the carousel
 * supplies the size and background).
 */
export function WelcomeCard({ name, balanceKobo, onOpenWallet, onShop }: Props) {
  const balance = balanceKobo === null ? null : formatKobo(balanceKobo);

  return (
    <div className="relative h-full overflow-hidden text-shop-ink">
      <OfferArt id={SHOP.id} />
      <div className="relative flex max-w-[196px] flex-col items-start gap-1.5 pl-5 pt-[18px]">
        <span
          className="inline-block max-w-full truncate rounded-full bg-white/70 px-[9px] py-[3px] text-[9.5px] font-extrabold leading-3 tracking-[0.14em]"
          style={{ color: SHOP.badgeColor }}
        >
          {name ? `WELCOME BACK, ${name.toUpperCase()}` : "WELCOME BACK"}
        </span>
        <button
          type="button"
          onClick={onOpenWallet}
          aria-label={balance === null ? "Open wallet" : `Open wallet, balance ${balance}`}
          className="mt-2 block max-w-full text-left"
        >
          <span className="block text-xs font-extrabold leading-4">Wallet</span>
          {balance === null ? (
            <span aria-hidden="true" className="mt-1 block h-6 w-24 animate-pulse rounded-md bg-white/60" />
          ) : (
            // A very large balance steps down a size so it never runs under the photo.
            <span className={cn("block truncate font-extrabold leading-7 tracking-[-0.03em]", balance.length > 9 ? "text-xl" : "text-2xl")}>
              {balance}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={onShop}
          className="mt-1 inline-flex h-[34px] items-center gap-2 rounded-full bg-shop-ink pl-3.5 pr-[5px] text-[12.5px] font-bold leading-4 text-shop-cream"
        >
          Shop now
          <span aria-hidden="true" className="flex h-6 w-6 items-center justify-center rounded-full bg-shop-cream text-shop-ink">
            <ArrowRight className="h-[13px] w-[13px]" strokeWidth={2.4} />
          </span>
        </button>
      </div>
    </div>
  );
}

/** The welcome card wired to the signed-in customer's own name and wallet. */
export function SignedInWelcome({ onShop }: { onShop: () => void }) {
  const { session, user } = useAuth();
  const navigate = useNavigate();
  const token = session?.access_token;

  // The same query the wallet pill uses, so the balance is shared and never fetched twice.
  const { data: summary } = useQuery({
    queryKey: ["wallet-summary", token],
    queryFn: () => getWalletSummary(token!),
    enabled: !!token,
    staleTime: 30_000,
  });

  const meta = session?.user?.user_metadata as { name?: string; full_name?: string } | undefined;
  const name = firstNameOf(user?.name ?? meta?.name ?? meta?.full_name);

  return (
    <WelcomeCard
      name={name}
      balanceKobo={summary ? summary.balance : null}
      onOpenWallet={() => navigate("/account/wallet")}
      onShop={onShop}
    />
  );
}
