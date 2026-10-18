import React from "react";
import { Helmet } from "react-helmet-async";

const SITE_NAME = "Furniva";
const DEFAULT_TITLE = "Furniva – Modern Furniture for Beautiful Homes";
const DEFAULT_DESC =
  "Discover premium handcrafted sofas, beds, dining tables, lounge chairs, and modular home storage. Designed for everyday comfort and lasting elegance.";
const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80";
const BASE_URL = "https://furniva.vercel.app";

/**
 * Reusable SEO component using react-helmet-async.
 * Standardizes metadata, Open Graph, canonical links, robots controls,
 * and Schema.org structured data across the entire e-commerce app.
 */
export default function SEO({
  title,
  description,
  canonicalUrl,
  ogType = "website",
  ogImage,
  noIndex = false,
  breadcrumbs = null,
  jsonLd = null,
  product = null,
  includeOrganization = false,
}) {
  const pageTitle = title ? (title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`) : DEFAULT_TITLE;
  const pageDescription = description || DEFAULT_DESC;
  const pageImage = ogImage || DEFAULT_IMAGE;

  // Resolve Canonical URL safely
  const resolvedCanonical = (() => {
    if (canonicalUrl) {
      if (canonicalUrl.startsWith("http://") || canonicalUrl.startsWith("https://")) {
        return canonicalUrl;
      }
      return `${BASE_URL}${canonicalUrl.startsWith("/") ? "" : "/"}${canonicalUrl}`;
    }
    if (typeof window !== "undefined") {
      return `${window.location.origin}${window.location.pathname}`;
    }
    return BASE_URL;
  })();

  // Construct BreadcrumbList Structured Data if provided
  const breadcrumbSchema =
    breadcrumbs && breadcrumbs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: breadcrumbs.map((crumb, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: crumb.name,
            item: crumb.item?.startsWith("http")
              ? crumb.item
              : `${BASE_URL}${crumb.item?.startsWith("/") ? "" : "/"}${crumb.item || ""}`,
          })),
        }
      : null;

  // Construct Product Structured Data based purely on authentic database fields
  const productSchema = (() => {
    if (!product) return null;

    const isOutOfStock = product.stock === 0;
    const images = Array.isArray(product.images)
      ? product.images
          .map((img) => (typeof img === "string" ? img : img?.url))
          .filter(Boolean)
      : [];

    const schema = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description: product.description || pageDescription,
      image: images.length > 0 ? images : [pageImage],
      sku: product.sku || product._id || product.id,
      brand: {
        "@type": "Brand",
        name: product.brand || "Furniva Atelier",
      },
      offers: {
        "@type": "Offer",
        url: resolvedCanonical,
        priceCurrency: "INR",
        price: product.price,
        itemCondition: "https://schema.org/NewCondition",
        availability: isOutOfStock
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
      },
    };

    if (product.category) {
      schema.category = product.category;
    }

    // ONLY render aggregateRating if product has real rating and review counts in the DB
    if (typeof product.rating === "number" && product.rating > 0 && product.reviews && product.reviews > 0) {
      schema.aggregateRating = {
        "@type": "AggregateRating",
        ratingValue: product.rating,
        reviewCount: product.reviews,
      };
    }

    // Enrich with actual furniture specifications if present
    const specs = product.specs || {};
    if (specs.material) schema.material = specs.material;
    if (specs.color) schema.color = specs.color;
    if (specs.width) schema.width = specs.width;
    if (specs.height) schema.height = specs.height;
    if (specs.depth) schema.depth = specs.depth;
    if (specs.weight) schema.weight = specs.weight;

    return schema;
  })();

  // Organization & WebSite structured data
  const organizationSchema = includeOrganization
    ? [
        {
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Furniva",
          url: BASE_URL,
          logo: `${BASE_URL}/favicon.svg`,
          description:
            "Furniva is an artisan furniture brand crafting timeless, durable solid wood and upholstered furniture.",
          contactPoint: {
            "@type": "ContactPoint",
            contactType: "Customer Support",
            telephone: "+91-1800-FURNIVA",
            areaServed: "IN",
            availableLanguage: ["English", "Hindi"],
          },
        },
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Furniva",
          url: BASE_URL,
          potentialAction: {
            "@type": "SearchAction",
            target: `${BASE_URL}/products?q={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
        },
      ]
    : null;

  return (
    <Helmet>
      {/* Title & Meta Description */}
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />

      {/* Robots Directive */}
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      )}

      {/* Canonical URL */}
      <link rel="canonical" href={resolvedCanonical} />

      {/* Open Graph Meta */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:url" content={resolvedCanonical} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={pageImage} />
      <meta property="og:image:alt" content={pageTitle} />

      {/* Product-specific Open Graph tags */}
      {product && (
        <>
          <meta property="product:price:amount" content={String(product.price)} />
          <meta property="product:price:currency" content="INR" />
          <meta
            property="product:availability"
            content={product.stock === 0 ? "out of stock" : "in stock"}
          />
          {product.category && <meta property="product:category" content={product.category} />}
        </>
      )}

      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={pageImage} />

      {/* Structured Data Scripts (JSON-LD) */}
      {!noIndex && breadcrumbSchema && (
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      )}

      {!noIndex && productSchema && (
        <script type="application/ld+json">{JSON.stringify(productSchema)}</script>
      )}

      {!noIndex &&
        organizationSchema &&
        organizationSchema.map((item, idx) => (
          <script key={`org-${idx}`} type="application/ld+json">
            {JSON.stringify(item)}
          </script>
        ))}

      {!noIndex &&
        jsonLd &&
        (Array.isArray(jsonLd) ? jsonLd : [jsonLd]).map((item, idx) => (
          <script key={`custom-ld-${idx}`} type="application/ld+json">
            {JSON.stringify(item)}
          </script>
        ))}
    </Helmet>
  );
}
