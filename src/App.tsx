import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { WalletProvider } from "@/contexts/WalletContext";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Analytics } from "@vercel/analytics/react";
import Index from "./pages/Index";
import Shop from "./pages/Shop";
import Bundles from "./pages/Bundles";
import BundleOptions from "./pages/BundleOptions";
import BundleConfigurator from "./pages/BundleConfigurator";
import Explore from "./pages/Explore";
import GiftCards from "./pages/GiftCards";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Account from "./pages/Account";
import Orders from "./pages/Orders";
import Subscriptions from "./pages/Subscriptions";
import SubscriptionReorder from "./pages/SubscriptionReorder";
import CatalogueV2 from "./pages/CatalogueV2";
import ProductPage from "./pages/ProductPage";
import GiftCardRedeem from "./pages/GiftCardRedeem";
import GiftingBundlesV2 from "./pages/GiftingBundlesV2";
import GiftingV2 from "./pages/GiftingV2";
import GiftingCardsV2 from "./pages/GiftingCardsV2";
import GiftCardDetailsV2 from "./pages/GiftCardDetailsV2";
import GiftBundleDetail from "./pages/GiftBundleDetail";
import CustomGiftBuilder from "./pages/CustomGiftBuilder";
import Subscribe from "./pages/Subscribe";
import Contact from "./pages/Contact";
import FAQ from "./pages/FAQ";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import ImagePreview from "./pages/ImagePreview";
import IconPreview from "./pages/IconPreview";
import { AuthCallback } from "./pages/AuthCallback";
import NotFound from "./pages/NotFound";
import Wallet from "./pages/Wallet";
import Referrals from "./pages/Referrals";
import AccountReferrals from "./pages/AccountReferrals";
import ReferralActivity from "./pages/ReferralActivity";
import { useEffect } from "react";
import { setReferralCookie } from "./utils/wallet";

const queryClient = new QueryClient();

// The redesigned (v2) catalogue and gifting flows are now the live experience.
// The legacy pages (./pages/Catalogue, Gifting, GiftingCards, GiftCardDetails,
// GiftingBundles) are kept in the tree for reference but are no longer routed.
const CataloguePage = CatalogueV2;
const GiftingPage = GiftingV2;
const GiftingCardsPage = GiftingCardsV2;
const GiftCardDetailsPage = GiftCardDetailsV2;
const GiftingBundlesPage = GiftingBundlesV2;

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);
  return null;
}

function ReferralCapture() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) setReferralCookie(ref);
  }, []);
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <WalletProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <Analytics />
          <BrowserRouter>
            <ScrollToTop />
            <ReferralCapture />
            <CartDrawer />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/shop" element={<CataloguePage />} />
              <Route path="/bundles" element={<Bundles />} />
              <Route path="/bundles/:stageId" element={<BundleOptions />} />
              <Route path="/configure/:bundleId" element={<BundleConfigurator />} />
              <Route path="/catalogue" element={<CataloguePage />} />
              <Route path="/catalogue/:slug" element={<ProductPage />} />
              <Route path="/gifting" element={<GiftingPage />} />
              <Route path="/gifting/cards" element={<GiftingCardsPage />} />
              <Route path="/gifting/cards/details" element={<GiftCardDetailsPage />} />
              <Route path="/gifting/bundles" element={<GiftingBundlesPage />} />
              <Route path="/gifting/bundles/:packageId" element={<GiftBundleDetail />} />
              <Route path="/gifting/build" element={<CustomGiftBuilder />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/gift-cards" element={<GiftCards />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/subscribe" element={<Subscribe />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/account" element={<Account />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/subscriptions" element={<Subscriptions />} />
              <Route path="/subscriptions/reorder" element={<SubscriptionReorder />} />
              <Route path="/account/wallet" element={<Wallet />} />
              <Route path="/referrals" element={<Referrals />} />
              <Route path="/share" element={<Referrals />} />
              <Route path="/referrals/activity" element={<ReferralActivity />} />
              <Route path="/share/activity" element={<ReferralActivity />} />
              <Route path="/account/referrals" element={<AccountReferrals />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/gift/:giftId" element={<GiftCardRedeem />} />
              <Route path="/image-preview" element={<ImagePreview />} />
              <Route path="/icon-preview" element={<IconPreview />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
        </WalletProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
