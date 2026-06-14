import axios from 'axios';
import { load } from 'cheerio';
import type { RawDocument } from '../types.js';

function stripHtmlTags(value: string): string {
  return value.replace(/<[^>]+>/g, '').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim();
}

function parsePubDate(pubDate: string): string {
  const d = new Date(pubDate);
  return isNaN(d.getTime()) ? new Date().toISOString().slice(0, 10) : d.toISOString().slice(0, 10);
}

export async function fetchGoogleNewsRss(query: string, limit = 10): Promise<RawDocument[]> {
  const url =
    `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ko&gl=KR&ceid=KR:ko`;
  const response = await axios.get<string>(url, {
    timeout: 15_000,
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PolarisNavigator/1.0)' },
  });

  const $ = load(response.data, { xml: true });
  const items: RawDocument[] = [];

  $('item').each((_i, el) => {
    if (items.length >= limit) return false;
    const title = stripHtmlTags($(el).find('title').text());
    const link = $(el).find('link').text().trim();
    const pubDate = $(el).find('pubDate').text();
    const description = stripHtmlTags($(el).find('description').text());
    if (!title || !link) return;
    items.push({
      source: 'google_rss',
      title,
      date: parsePubDate(pubDate),
      url: link,
      text: description,
      metadata: { query },
    });
  });

  return items;
}
