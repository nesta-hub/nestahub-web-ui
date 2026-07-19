import { useParams, Navigate } from 'react-router-dom';

/**
 * Public, shareable product URL: /catalogue/:slug
 *
 * This path is what social crawlers (WhatsApp/OG) and shared links hit, and it
 * maps to the Vercel OG function at api/catalogue/[slug].js. The live catalogue
 * page (CatalogueV2) opens the product drawer from a `?product=<slug>` query
 * param, so we bridge the path form to that param. Using the URL — not transient
 * location.state — means a cold/direct load (opening from WhatsApp, refresh)
 * deterministically opens the product.
 */
const ProductPage = () => {
  const { slug } = useParams<{ slug: string }>();

  if (!slug) {
    return <Navigate to="/catalogue" replace />;
  }

  return <Navigate to={`/catalogue?product=${encodeURIComponent(slug)}`} replace />;
};

export default ProductPage;
