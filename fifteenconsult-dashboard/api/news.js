/**
 * /api/news.js
 * Free RSS news feed aggregator for Nadia
 * No API key needed — pulls from public RSS feeds
 * Sources: Marketing Week, Campaign Middle East, TechCabal, Gulf Business
 */

const FEEDS = [
  {
    name: "Marketing Week",
    url: "https://www.marketingweek.com/feed/",
    category: "Marketing",
  },
  {
    name: "Campaign Middle East",
    url: "https://campaignme.com/feed/",
    category: "GCC Marketing",
  },
  {
    name: "TechCabal",
    url: "https://techcabal.com/feed/",
    category: "West Africa Tech",
  },
  {
    name: "Gulf Business",
    url: "https://gulfbusiness.com/feed/",
    category: "GCC Business",
  },
  {
    name: "Arabian Business",
    url: "https://www.arabianbusiness.com/rss",
    category: "GCC Business",
  },
];

async function fetchRSS(feed) {
  try {
    const r = await fetch(feed.url, {
      headers: { "User-Agent": "FifteenConsult-Dashboard/1.0" },
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) return [];

    const xml  = await r.text();
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];

    return items.slice(0, 3).map(match => {
      const item  = match[1];
      const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1]
                 || item.match(/<title>(.*?)<\/title>/)?.[1]
                 || "Untitled";
      const link  = item.match(/<link>(.*?)<\/link>/)?.[1]
                 || item.match(/<guid>(.*?)<\/guid>/)?.[1]
                 || "#";
      const date  = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || "";
      const desc  = (item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/s)?.[1]
                 || item.match(/<description>(.*?)<\/description>/s)?.[1]
                 || "").replace(/<[^>]+>/g, "").trim().slice(0, 120);

      return {
        title:    title.replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").trim(),
        link:     link.trim(),
        date:     date.trim(),
        excerpt:  desc,
        source:   feed.name,
        category: feed.category,
      };
    });
  } catch { return []; }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const results = await Promise.allSettled(FEEDS.map(fetchRSS));
    const articles = results
      .flatMap((r, i) => r.status === "fulfilled" ? r.value : [])
      .filter(a => a.title && a.title !== "Untitled");

    // Group by category
    const byCategory = {};
    articles.forEach(a => {
      if (!byCategory[a.category]) byCategory[a.category] = [];
      byCategory[a.category].push(a);
    });

    return res.status(200).json({
      total:       articles.length,
      fetchedAt:   new Date().toISOString(),
      byCategory,
      articles:    articles.slice(0, 15),
      sources:     FEEDS.map(f => f.name),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
