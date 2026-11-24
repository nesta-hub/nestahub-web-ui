import { useMemo, useRef, useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Search } from "lucide-react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { SignInForm } from "@/components/auth/SignInForm";
import { Layout } from "@/components/layout";
import { CatalogTile } from "@/components/subscribe-more/CatalogTile";
import { CategoryChips } from "@/components/subscribe-more/CategoryChips";
import type { EnrolOutcome } from "@/components/subscribe-more/SubscribeSheet";
import { SubscribeProductPage } from "@/components/subscribe-more/SubscribeProductPage";
import { describeEnrolFailure, groupCatalog, matchesSearch } from "@/components/subscribe-more/helpers";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscribeStatus } from "@/hooks/useSubscribeEnabled";
import { subscriptionBoxesApi, type Catalog, type CatalogItem, type EnrolInput } from "@/lib/subscriptionBoxes";

/** The address's `?product=` names the product whose page is open, so the phone's back button closes it. */
const PRODUCT_PARAM = "product";

function ListSkeleton() {
  return (
    <div className="animate-pulse" aria-label="Loading the list">
      {[0, 1].map((n) => (
        <div key={n}>
          <div className="mx-5 mb-3 mt-6 h-[25px] w-28 rounded-full bg-[#E7E2DB]" />
          <div className="flex gap-3 overflow-hidden px-5 pb-1.5 pt-0.5">
            {[0, 1, 2].map((m) => (
              <div key={m} className="h-[148px] w-[148px] shrink-0 rounded-[22px] bg-[#E7E2DB]" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Everything she can subscribe to, a row for each category, with a search box and category pills. Only shown to someone who is signed in. */
function AddScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { user, session } = useAuth();
  const accessToken = session?.access_token ?? null;

  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  // Items the server told us she already subscribes to, which the list we hold does not know yet.
  const [learnedSubscribed, setLearnedSubscribed] = useState<ReadonlySet<string>>(new Set());

  const { data, isLoading, error, refetch, isPlaceholderData } = useQuery({
    queryKey: ["subscribe-catalog", user?.id ?? "me", categoryId ?? "all"],
    queryFn: () => subscriptionBoxesApi.catalog(accessToken, categoryId ?? undefined),
    retry: false,
    // The pills stay put while another category loads.
    placeholderData: keepPreviousData,
  });

  // The pills are kept when a category fails to load, so she can still pick another.
  const categories = useRef<Catalog["categories"]>([]);
  if (data) categories.current = data.categories;

  const items = useMemo(
    () => (data?.items ?? []).map((item): CatalogItem => (learnedSubscribed.has(item.variantId) && !item.subscribed ? { ...item, subscribed: true } : item)),
    [data, learnedSubscribed],
  );
  const sections = groupCatalog(
    items.filter((item) => matchesSearch(item, search)),
    categories.current,
  );

  const productId = params.get(PRODUCT_PARAM);
  const productItems = useMemo(() => (productId ? items.filter((item) => item.productId === productId) : []), [items, productId]);

  const openProduct = (id: string) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.set(PRODUCT_PARAM, id);
        return next;
      },
      { state: { fromList: true } },
    );
  const closeProduct = () => {
    if ((location.state as { fromList?: boolean } | null)?.fromList) return navigate(-1);
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.delete(PRODUCT_PARAM);
        return next;
      },
      { replace: true },
    );
  };

  const subscribe = async (item: CatalogItem, input: EnrolInput): Promise<EnrolOutcome> => {
    try {
      await subscriptionBoxesApi.enrol(accessToken, input);
    } catch (failure) {
      const { message, alreadySubscribed } = describeEnrolFailure(failure);
      if (alreadySubscribed) setLearnedSubscribed((current) => new Set(current).add(item.variantId));
      return { ok: false, message };
    }
    void queryClient.invalidateQueries({ queryKey: ["subscription-tab"] });
    void queryClient.invalidateQueries({ queryKey: ["subscribe-catalog"] });
    toast.success(`You're subscribed to ${item.productName}`);
    navigate("/subscriptions", { replace: true });
    return { ok: true };
  };

  return (
    <div className="mx-auto w-full max-w-xl pb-28 md:pb-16">
      <header className="box-border flex h-16 items-center gap-3 pl-3 pr-5 pt-3">
        <Link
          to="/subscriptions"
          aria-label="Back"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-shop-ink shadow-[0_8px_18px_-10px_rgba(51,38,28,0.35),0_1px_4px_rgba(51,38,28,0.06)]"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
        </Link>
        <h1 className="m-0 min-w-0 flex-1 text-[18px] font-extrabold leading-6 tracking-[-0.01em] text-shop-ink">Subscription</h1>
      </header>

      <p className="px-5 pt-3 text-[13px] leading-[18px] text-shop-muted">Only items that can be subscribed to are listed here.</p>

      <label className="mx-5 mt-3.5 box-border flex h-12 items-center gap-[11px] rounded-[24px] bg-white px-[18px] shadow-[0_10px_24px_-14px_rgba(51,38,28,0.4),0_1px_4px_rgba(51,38,28,0.06)] focus-within:ring-2 focus-within:ring-shop-brown/30">
        <Search className="h-[18px] w-[18px] shrink-0 text-shop-ink" strokeWidth={2} aria-hidden="true" />
        <input
          type="search"
          aria-label="Search subscribable items"
          placeholder="Search subscribable items"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="h-full min-w-0 flex-1 bg-transparent text-[14px] text-shop-ink placeholder:text-shop-muted focus:outline-none"
        />
      </label>

      <div className="mt-3.5">
        <CategoryChips categories={categories.current} value={categoryId} onChange={setCategoryId} />
      </div>

      {isLoading ? (
        <ListSkeleton />
      ) : error ? (
        <div className="mx-5 mt-6 rounded-[24px] bg-white p-6 text-center shadow-sm">
          <p className="text-[15px] font-bold text-shop-ink">We could not load the list.</p>
          <button type="button" onClick={() => void refetch()} className="mt-4 h-11 rounded-full bg-shop-cta px-6 text-[14px] font-extrabold text-shop-cream hover:bg-shop-cta-hover">
            Try again
          </button>
        </div>
      ) : sections.length === 0 ? (
        <p className="mx-5 mt-6 rounded-[24px] bg-white p-6 text-center text-[15px] font-bold text-shop-muted shadow-sm">Nothing to show</p>
      ) : (
        <div aria-busy={isPlaceholderData} className={`transition-opacity ${isPlaceholderData ? "opacity-50" : ""}`}>
          {sections.map((section) => (
            <section key={section.id} aria-labelledby={`subscribe-section-${section.id}`} className="flex flex-col">
              <h2 id={`subscribe-section-${section.id}`} className="mx-5 mb-3 mt-6 text-[19px] font-extrabold leading-[25px] tracking-[-0.02em] text-shop-ink">
                {section.name}
              </h2>
              {/* The trailing space keeps the last tile off the edge once she scrolls to it. */}
              <ul
                aria-label={section.name}
                className="m-0 flex list-none snap-x snap-proximity scroll-px-5 gap-3 overflow-x-auto px-5 pb-1.5 pt-0.5 after:block after:w-2 after:shrink-0 after:content-['']"
              >
                {section.products.map((product) => (
                  <CatalogTile key={product.productId} product={product} onOpen={() => openProduct(product.productId)} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {productItems.length > 0 && (
        <SubscribeProductPage key={productId} items={productItems} onBack={closeProduct} onSubscribe={subscribe} onAddedToCart={closeProduct} />
      )}
    </div>
  );
}

/**
 * "Subscribe to something else": everything she can subscribe to, without buying it first. Route: /subscriptions/add.
 * The same gate as the Subscription tab: the old page for anyone who does not have the new experience.
 */
const SubscribeToMore = () => {
  const { user, loading } = useAuth();
  const status = useSubscribeStatus();

  if (loading || status === "loading") {
    return (
      <Layout showNav={false}>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </Layout>
    );
  }

  if (status === "off") return <Navigate to="/subscriptions" replace />;

  if (!user) {
    return (
      <Layout>
        <SignInForm
          title="Sign in to subscribe"
          description="Pick what you buy again and again"
          containerClassName="flex-1 flex flex-col items-center justify-center px-6 py-16"
        />
      </Layout>
    );
  }

  return (
    <Layout>
      <AddScreen />
    </Layout>
  );
};

export default SubscribeToMore;
