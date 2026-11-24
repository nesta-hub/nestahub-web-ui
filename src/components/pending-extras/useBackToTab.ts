import { useNavigate } from "react-router-dom";
import { getBoxToken } from "@/lib/subscriptionBoxes";

/**
 * Where she goes when she is done adding extra items (or closes the mode): her Subscription tab, by her sign-in, or by
 * the link she came in with when she has no sign-in.
 */
export function useBackToTab(accessToken: string | null): () => void {
  const navigate = useNavigate();
  return () => {
    const token = getBoxToken();
    navigate(!accessToken && token ? `/subscriptions/open/${token}` : "/subscriptions");
  };
}
