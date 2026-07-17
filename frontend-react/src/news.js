const NEWS_FEEDS = [
  ["https://rss.nytimes.com/services/xml/rss/nyt/World.xml", "The New York Times"],
  ["https://www.theguardian.com/world/rss", "The Guardian"],
  ["https://feeds.bbci.co.uk/news/world/rss.xml", "BBC News"],
  ["https://www.ft.com/world?format=rss", "Financial Times"]
];

function fetchWithTimeout(url, milliseconds) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), milliseconds);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timeout));
}

function parseFeed(xmlText, source) {
  const documentNode = new DOMParser().parseFromString(xmlText, "text/xml");
  if (documentNode.querySelector("parsererror")) return [];

  return [...documentNode.getElementsByTagName("item")].slice(0, 6).flatMap(item => {
    const title = item.getElementsByTagName("title")[0]?.textContent?.replace(/\s+/g, " ").trim();
    const link = item.getElementsByTagName("link")[0]?.textContent?.trim();
    const publishedText = item.getElementsByTagName("pubDate")[0]?.textContent?.trim();
    if (!title || !/^https?:\/\//i.test(link || "")) return [];

    const publishedAt = Date.parse(publishedText || "");
    return [{
      title: title.slice(0, 300),
      url: link,
      source,
      published: Number.isNaN(publishedAt) ? null : new Date(publishedAt).toISOString()
    }];
  });
}

async function fetchFeed(feedUrl, source) {
  const mirrors = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(feedUrl)}`,
    `https://r.jina.ai/${feedUrl}`
  ];

  for (const mirror of mirrors) {
    try {
      const response = await fetchWithTimeout(mirror, 12000);
      if (!response.ok) continue;
      const items = parseFeed(await response.text(), source);
      if (items.length) return items;
    } catch {
      // Try the next mirror.
    }
  }
  return [];
}

export async function fetchNewsFallback() {
  const groups = await Promise.all(
    NEWS_FEEDS.map(([url, source]) => fetchFeed(url, source))
  );
  const seen = new Set();
  return groups
    .flat()
    .filter(item => {
      const key = item.url.split("#")[0];
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => Date.parse(b.published || 0) - Date.parse(a.published || 0))
    .slice(0, 22);
}
