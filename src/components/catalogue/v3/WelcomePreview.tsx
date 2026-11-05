import { useNavigate } from "react-router-dom";
import { WelcomeCard } from "./WelcomeCard";

/**
 * TEMPORARY, dev server only (see welcomePreviewFlag.ts, which also says how to remove it): the real
 * signed-in first card with a made-up name and balance, for looking at it without signing in.
 */
export function WelcomePreview({ onShop }: { onShop: () => void }) {
  const navigate = useNavigate();
  return <WelcomeCard name="Sade" balanceKobo={1_006_000} onOpenWallet={() => navigate("/account/wallet")} onShop={onShop} />;
}
