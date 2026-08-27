'use strict';

const crypto = require('crypto');
const Parser = require('rss-parser');
const { cache, TTL } = require('../lib/cache');
const logger = require('../lib/logger');
const env = require('../config/env');
const { HttpError } = require('../middleware/errors');

// Firefox-style UA: ESPN's WAF answers Chrome UAs with a JS challenge (HTTP 202, empty body).
const USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64; rv:129.0) Gecko/20100101 Firefox/129.0';

const FEEDS = Object.freeze({
  bbc: { key: 'bbc', name: 'BBC Sport', url: 'https://feeds.bbci.co.uk/sport/football/rss.xml' },
  guardian: { key: 'guardian', name: 'The Guardian', url: 'https://www.theguardian.com/football/rss' },
  espn: { key: 'espn', name: 'ESPN', url: 'https://www.espn.com/espn/rss/soccer/news' },
  sky: {
    key: 'sky',
    name: 'Sky Sports',
    url: 'https://www.skysports.com/rss/12040',
    // The Sky feed covers every sport; keep football only.
    filter: (item) => /\/football\//i.test(item.link || ''),
  },
});
const SOURCE_KEYS = Object.keys(FEEDS);
const SUMMARY_MAX = 300;

const parser = new Parser({
  timeout: env.UPSTREAM_TIMEOUT_MS,
  headers: { 'User-Agent': USER_AGENT, Accept: 'application/rss+xml, application/xml;q=0.9, */*;q=0.8' },
  customFields: {
    item: [
      ['media:thumbnail', 'mediaThumbnail', { keepArray: true }],
      ['media:content', 'mediaContent', { keepArray: true }],
    ],
  },
});

/* ----------------------------------------------------------------- helpers */

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', hellip: '…', ndash: '–', mdash: '—', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', pound: '£', euro: '€' };

function decodeEntities(text) {
  return String(text).replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, ent) => {
    if (ent[0] === '#') {
      const code = ent[1].toLowerCase() === 'x' ? parseInt(ent.slice(2), 16) : parseInt(ent.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : m;
    }
    return ENTITIES[ent.toLowerCase()] ?? m;
  });
}

/** HTML -> plain text (tags removed, entities decoded, whitespace collapsed). */
function stripHtml(html) {
  if (!html) return '';
  let text = String(html)
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<\/(p|li|div|br|h\d|ul|ol)>/gi, ' ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
  text = decodeEntities(text);
  // Some feeds double-encode; a second pass turns "&amp;lt;p&amp;gt;" leftovers into text, then strip again.
  if (/[<>]/.test(text)) text = text.replace(/<[^>]+>/g, ' ');
  return text.replace(/\s+/g, ' ').trim();
}

function truncate(text, max) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

const TZ_OFFSETS = { BST: '+0100', IST: '+0100', WET: '+0000', WEST: '+0100', CET: '+0100', CEST: '+0200', EET: '+0200', EEST: '+0300', AEST: '+1000', AEDT: '+1100', UTC: '+0000', GMT: '+0000', Z: '+0000', EST: '-0500', EDT: '-0400', CST: '-0600', CDT: '-0500', MST: '-0700', MDT: '-0600', PST: '-0800', PDT: '-0700' };

/** Tolerant RSS date parser (handles zone abbreviations V8 rejects, e.g. "BST"). Returns ISO or null. */
function parseRssDate(value) {
  if (!value) return null;
  const s = String(value).trim();
  let d = new Date(s);
  if (Number.isNaN(d.getTime())) {
    const fixed = s.replace(/\s([A-Z]{1,4})$/, (m, zone) => (TZ_OFFSETS[zone] ? ` ${TZ_OFFSETS[zone]}` : m));
    d = new Date(fixed);
  }
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function attrUrl(node) {
  if (!node) return null;
  if (typeof node === 'string') return node;
  const attrs = node.$ || node;
  return attrs.url || attrs.href || null;
}

function attrWidth(node) {
  const attrs = (node && node.$) || node || {};
  const w = Number(attrs.width);
  return Number.isFinite(w) ? w : 0;
}

function pickImage(item, feedKey) {
  const thumbs = Array.isArray(item.mediaThumbnail) ? item.mediaThumbnail : item.mediaThumbnail ? [item.mediaThumbnail] : [];
  const contents = Array.isArray(item.mediaContent) ? item.mediaContent : item.mediaContent ? [item.mediaContent] : [];
  let url = null;
  if (thumbs.length) {
    url = attrUrl([...thumbs].sort((a, b) => attrWidth(b) - attrWidth(a))[0]);
  }
  if (!url && contents.length) {
    const images = contents.filter((c) => {
      const attrs = c.$ || c;
      return !attrs.type || /^image\//i.test(attrs.type) || attrs.medium === 'image';
    });
    const best = [...(images.length ? images : contents)].sort((a, b) => attrWidth(b) - attrWidth(a))[0];
    url = attrUrl(best);
  }
  if (!url && item.enclosure && item.enclosure.url) {
    const type = item.enclosure.type || '';
    if (!type || /^image\//i.test(type)) url = item.enclosure.url;
  }
  if (!url) return null;
  url = String(url).trim();
  if (!/^https?:\/\//i.test(url)) return null;
  if (feedKey === 'bbc') {
    // 240px thumbnails -> 976px ("/ace/standard/240/..." and the 16:9 "/images/ic/240x135/..." variant)
    url = url
      .replace(/\/standard\/\d+\//, '/standard/976/')
      .replace(/\/images\/ic\/\d+x\d+\//, '/images/ic/976x549/')
      .replace(/\/240\//, '/976/');
  }
  return url;
}

function sha1(value) {
  return crypto.createHash('sha1').update(String(value)).digest('hex');
}

function cleanTitle(value) {
  return stripHtml(value || '').trim();
}

function normalizeItem(item, feed) {
  const link = String(item.link || '').trim();
  const title = cleanTitle(item.title);
  if (!link || !title) return null;
  if (feed.filter && !feed.filter(item)) return null;
  const rawSummary = item.contentSnippet || item.content || item.summary || item['content:encoded'] || '';
  const summary = truncate(stripHtml(rawSummary).replace(/\s*Continue reading\.{0,3}\s*$/i, '').trim(), SUMMARY_MAX);
  const author = stripHtml(item.creator || item.author || item['dc:creator'] || '') || null;
  return {
    id: sha1(link),
    title,
    summary,
    link,
    image: pickImage(item, feed.key),
    source: feed.name,
    sourceKey: feed.key,
    publishedAt: parseRssDate(item.isoDate || item.pubDate) || new Date().toISOString(),
    author,
  };
}

/** Parsed rss-parser output -> Article[] for one feed. */
function normalizeFeed(parsed, feed) {
  const items = Array.isArray(parsed && parsed.items) ? parsed.items : [];
  return items.map((item) => normalizeItem(item, feed)).filter(Boolean);
}

/** Convenience for tests: raw XML -> Article[]. */
async function parseFeedXml(xml, feedKey) {
  const parsed = await parser.parseString(xml);
  return normalizeFeed(parsed, FEEDS[feedKey]);
}

async function fetchFeed(feed) {
  const parsed = await parser.parseURL(feed.url);
  const articles = normalizeFeed(parsed, feed);
  logger.debug(`Fetched ${articles.length} articles from ${feed.name}`);
  return articles;
}

function titleKey(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function dedupeByTitle(articles) {
  const seen = new Set();
  return articles.filter((a) => {
    const key = titleKey(a.title);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Aggregate news. Feeds are fetched in parallel (each cached 10 min by URL);
 * a failing feed is logged and skipped. 502 only when every requested feed fails.
 */
async function getNews({ source = 'all', limit = 40 } = {}) {
  const keys = source === 'all' ? SOURCE_KEYS : [source];
  const results = await Promise.allSettled(
    keys.map((key) => cache.wrap(FEEDS[key].url, TTL.NEWS, () => fetchFeed(FEEDS[key]))),
  );
  const failed = [];
  let articles = [];
  results.forEach((result, i) => {
    if (result.status === 'fulfilled') articles = articles.concat(result.value);
    else {
      failed.push(keys[i]);
      logger.warn(`News feed failed: ${FEEDS[keys[i]].name}`, result.reason && result.reason.message);
    }
  });
  if (failed.length === keys.length) {
    throw new HttpError(502, 'News feeds are unavailable', { code: 'UPSTREAM', details: { failed } });
  }
  articles = dedupeByTitle(articles).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  // When mixing sources, interleave them (newest-first within each source) so a feed that
  // stamps every item with "now" (ESPN does) can't crowd the others out of the first page.
  if (keys.length > 1) articles = interleaveBySource(articles, keys);
  articles = articles.slice(0, limit);
  return {
    articles,
    sources: SOURCE_KEYS.map((key) => ({ key, name: FEEDS[key].name })),
    failed,
    fetchedAt: new Date().toISOString(),
  };
}

/** Round-robin merge of per-source queues (each queue keeps its own order). */
function interleaveBySource(articles, keys) {
  const queues = keys.map((key) => articles.filter((a) => a.sourceKey === key));
  const out = [];
  let remaining = articles.length;
  while (remaining > 0) {
    for (const q of queues) {
      if (q.length) {
        out.push(q.shift());
        remaining -= 1;
      }
    }
  }
  return out;
}

module.exports = { interleaveBySource, FEEDS, SOURCE_KEYS, parser, stripHtml, parseRssDate, pickImage, normalizeItem, normalizeFeed, parseFeedXml, fetchFeed, getNews };
