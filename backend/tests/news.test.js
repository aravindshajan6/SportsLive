'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { fixture, ISO_RE } = require('./helpers');
const news = require('../src/services/news');

function assertArticleShape(a) {
  assert.match(a.id, /^[0-9a-f]{40}$/);
  assert.ok(a.title.length > 0);
  assert.equal(typeof a.summary, 'string');
  assert.ok(a.summary.length <= 300);
  assert.match(a.link, /^https?:\/\//);
  assert.ok(a.image === null || /^https?:\/\//.test(a.image));
  assert.match(a.publishedAt, ISO_RE);
  assert.ok(a.author === null || typeof a.author === 'string');
  assert.ok(!/<[a-z][^>]*>/i.test(a.summary), 'summary has no HTML tags');
  assert.ok(!/&(amp|lt|gt|quot|#\d+);/.test(a.summary), 'summary has no entities');
}

describe('RSS normalization', () => {
  test('BBC: media:thumbnail upgraded to the 976px variant', async () => {
    const articles = await news.parseFeedXml(fixture('rss_bbc.xml'), 'bbc');
    assert.ok(articles.length > 50);
    articles.forEach(assertArticleShape);
    assert.ok(articles.every((a) => a.source === 'BBC Sport' && a.sourceKey === 'bbc'));
    const withImage = articles.filter((a) => a.image);
    assert.ok(withImage.length > 0);
    assert.ok(withImage.every((a) => /\/(976|976x549)\//.test(a.image) && !/\/(240|240x135)\//.test(a.image)));
    assert.equal(articles[0].title, "Liverpool close in on £120m deal for PSG's Barcola");
    assert.equal(articles[0].publishedAt, '2026-08-27T08:10:13.000Z');
  });

  test('Guardian: largest media:content picked, HTML stripped from summary', async () => {
    const articles = await news.parseFeedXml(fixture('rss_guardian.xml'), 'guardian');
    assert.ok(articles.length > 40);
    articles.forEach(assertArticleShape);
    const first = articles[0];
    assert.equal(first.source, 'The Guardian');
    assert.match(first.image, /width=700/); // the largest media:content variant in the feed
    assert.ok(first.summary.startsWith('Liverpool would pay'));
    assert.ok(!first.summary.includes('Continue reading'));
    assert.ok(!first.summary.includes('<'));
  });

  test('ESPN: no images, dc:creator becomes author', async () => {
    const articles = await news.parseFeedXml(fixture('rss_espn.xml'), 'espn');
    assert.ok(articles.length > 5);
    articles.forEach(assertArticleShape);
    assert.ok(articles.every((a) => a.image === null));
    assert.ok(articles.some((a) => a.author === 'Sam Tighe'));
    // "EST" pubDates are parsed rather than falling back to "now"
    assert.equal(articles[0].publishedAt, '2026-08-27T09:38:40.000Z');
  });

  test('Sky: only /football/ links survive, enclosure used for image, BST dates parsed', async () => {
    const articles = await news.parseFeedXml(fixture('rss_skysports.xml'), 'sky');
    assert.equal(articles.length, 12);
    articles.forEach(assertArticleShape);
    assert.ok(articles.every((a) => a.link.includes('/football/')));
    assert.ok(articles.every((a) => a.image && a.image.includes('365dm.com')));
    assert.ok(articles.every((a) => a.publishedAt.startsWith('2026-08-2')));
  });
});

describe('helpers', () => {
  test('parseRssDate handles zone abbreviations', () => {
    assert.equal(news.parseRssDate('Thu, 27 Aug 2026 10:00:00 BST'), '2026-08-27T09:00:00.000Z');
    assert.equal(news.parseRssDate('Thu, 27 Aug 2026 10:00:00 GMT'), '2026-08-27T10:00:00.000Z');
    assert.equal(news.parseRssDate('nope'), null);
  });
  test('stripHtml removes tags and decodes entities', () => {
    assert.equal(news.stripHtml('<p>Tom &amp; Jerry &#8217;s <b>day</b></p>'), 'Tom & Jerry ’s day');
  });
});
