import { XMLParser } from "fast-xml-parser";

interface Feed {
  name: string;
  url: string;
}

export interface NewsItem {
  title: string;
  url: string;
  source: string;
  published: string;
}

const feeds: Feed[] = [
  { name: "BBC News", url: "https://feeds.bbci.co.uk/news/world/rss.xml" },
  { name: "The Guardian", url: "https://www.theguardian.com/world/rss" },
  { name: "New York Times", url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml" }
];

const parser = new XMLParser();

async function readFeed(feed: Feed): Promise<NewsItem[]> {
  const response = await fetch(feed.url);

  if (!response.ok) {
    throw new Error(`Could not load ${feed.name}`);
  }

  const xml = await response.text();
  const data = parser.parse(xml);
  const rawItems = data.rss?.channel?.item || [];
  const items = Array.isArray(rawItems) ? rawItems : [rawItems];

  return items.map(item => ({
    title: String(item.title || "Untitled"),
    url: String(item.link || ""),
    source: feed.name,
    published: item.pubDate ? new Date(item.pubDate).toISOString() : ""
  }));
}

export async function getNews(): Promise<NewsItem[]> {
  const results = await Promise.all(feeds.map(readFeed));

  return results
    .flat()
    .sort((a, b) => b.published.localeCompare(a.published))
    .slice(0, 40);
}
