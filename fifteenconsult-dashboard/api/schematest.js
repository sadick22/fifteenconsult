/**
 * /api/schematest.js
 * Google Rich Results / Structured Data testing proxy
 * Uses Google's Rich Results Test API — free with API key
 * Also uses web fetch to check schema markup directly from page source
 */

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { url = "https://fifteenconsult.com" } = req.query;
  const apiKey = process.env.PAGESPEED_API_KEY; // reuse same key

  try {
    // Method 1: Google Rich Results Test API
    if (apiKey) {
      const apiUrl = `https://searchconsole.googleapis.com/v1/urlTestingTools/mobileFriendlyTest:run?key=${apiKey}`;
      const r = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const d = await r.json();

      if (r.ok) {
        return res.status(200).json({
          url,
          mobileFriendly: d.mobileFriendliness === "MOBILE_FRIENDLY",
          mobileFriendlyIssues: d.mobileFriendlyIssues || [],
          resourceIssues: d.testStatus?.status || "COMPLETE",
        });
      }
    }

    // Method 2: Fetch page and check for schema markup directly
    const pageRes = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; FifteenConsult-Dashboard/1.0)" }
    });
    const html = await pageRes.text();

    // Extract JSON-LD schema
    const schemaMatches = html.match(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) || [];
    const schemas = schemaMatches.map(s => {
      try {
        const json = s.replace(/<script[^>]*>/, "").replace(/<\/script>/, "").trim();
        return JSON.parse(json);
      } catch { return null; }
    }).filter(Boolean);

    // Check for key schema types
    const hasLocalBusiness = schemas.some(s => s["@type"] === "LocalBusiness" || s["@type"] === "Organization");
    const hasWebPage       = schemas.some(s => s["@type"] === "WebPage" || s["@type"] === "WebSite");
    const hasBreadcrumb    = schemas.some(s => s["@type"] === "BreadcrumbList");
    const hasFAQ           = schemas.some(s => s["@type"] === "FAQPage");

    // Check meta tags
    const hasOG         = html.includes('property="og:');
    const hasTwitterCard = html.includes('name="twitter:');
    const hasCanonical  = html.includes('rel="canonical"');
    const hasMetaDesc   = html.includes('name="description"');
    const hasViewport   = html.includes('name="viewport"');

    // Extract title and meta description
    const titleMatch   = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const descMatch    = html.match(/name="description"[^>]*content="([^"]+)"/i) ||
                         html.match(/content="([^"]+)"[^>]*name="description"/i);

    return res.status(200).json({
      url,
      schemas: {
        count:         schemas.length,
        hasLocalBusiness,
        hasWebPage,
        hasBreadcrumb,
        hasFAQ,
        types:         schemas.map(s => s["@type"]).filter(Boolean),
        missing:       [
          !hasLocalBusiness && "LocalBusiness (critical for local SEO)",
          !hasWebPage       && "WebPage/WebSite",
          !hasBreadcrumb    && "BreadcrumbList",
          !hasFAQ           && "FAQPage (good for featured snippets)",
        ].filter(Boolean),
      },
      meta: {
        title:         titleMatch?.[1] || "Not found",
        titleLength:   titleMatch?.[1]?.length || 0,
        description:   descMatch?.[1] || "MISSING — add meta description",
        hasCanonical,
        hasOG,
        hasTwitterCard,
        hasViewport,
        hasMetaDesc,
      },
      score: Math.round(
        ((hasLocalBusiness ? 20 : 0) +
        (hasMetaDesc ? 20 : 0) +
        (hasCanonical ? 15 : 0) +
        (hasOG ? 15 : 0) +
        (schemas.length > 0 ? 15 : 0) +
        (hasWebPage ? 15 : 0)) 
      ),
      recommendations: [
        !hasLocalBusiness && "🔴 Add LocalBusiness schema with Doha address, phone, and coordinates",
        !hasMetaDesc      && "🔴 Missing meta description — add to all pages immediately",
        !hasCanonical     && "🟡 Add canonical tags to prevent duplicate content issues",
        !hasOG            && "🟡 Add Open Graph tags for better social sharing previews",
        !hasFAQ           && "🟢 Add FAQPage schema to service pages for featured snippets",
      ].filter(Boolean),
    });

  } catch (err) {
    return res.status(500).json({ error: err.message, url });
  }
}
