import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
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
import Catalogue from "./pages/Catalogue";
import Gifting from "./pages/Gifting";
import GiftingCards from "./pages/GiftingCards";
import GiftCardDetails from "./pages/GiftCardDetails";
import GiftCardRedeem from "./pages/GiftCardRedeem";
import GiftingBundles from "./pages/GiftingBundles";
import Subscribe from "./pages/Subscribe";
import Contact from "./pages/Contact";
import FAQ from "./pages/FAQ";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import ImagePreview from "./pages/ImagePreview";
import IconPreview from "./pages/IconPreview";
import { AuthCallback } from "./pages/AuthCallback";
import NotFound from "./pages/NotFound";
import { useEffect } from "react";

const queryClient = new QueryClient();

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <Analytics />
          <BrowserRouter>
            <ScrollToTop />
            <CartDrawer />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/bundles" element={<Bundles />} />
              <Route path="/bundles/:stageId" element={<BundleOptions />} />
              <Route path="/configure/:bundleId" element={<BundleConfigurator />} />
              <Route path="/catalogue" element={<Catalogue />} />
              <Route path="/gifting" element={<Gifting />} />
              <Route path="/gifting/cards" element={<GiftingCards />} />
              <Route path="/gifting/cards/details" element={<GiftCardDetails />} />
              <Route path="/gifting/bundles" element={<GiftingBundles />} />
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
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/gift/:giftId" element={<GiftCardRedeem />} />
              <Route path="/image-preview" element={<ImagePreview />} />
              <Route path="/icon-preview" element={<IconPreview />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
