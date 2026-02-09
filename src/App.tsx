import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { CartDrawer } from "@/components/cart/CartDrawer";
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
import Catalogue from "./pages/Catalogue";
import Gifting from "./pages/Gifting";
import Subscribe from "./pages/Subscribe";
import Contact from "./pages/Contact";
import ImagePreview from "./pages/ImagePreview";
import IconPreview from "./pages/IconPreview";
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
      <CartProvider>
        <Toaster />
        <Sonner />
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
            <Route path="/explore" element={<Explore />} />
            <Route path="/gift-cards" element={<GiftCards />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/subscribe" element={<Subscribe />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/account" element={<Account />} />
            <Route path="/image-preview" element={<ImagePreview />} />
            <Route path="/icon-preview" element={<IconPreview />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
