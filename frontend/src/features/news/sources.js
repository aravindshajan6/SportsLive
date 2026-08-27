// Source metadata shared by the news components (brand colours for badges + image fallbacks).
export const SOURCE_ORDER = ['bbc', 'guardian', 'espn', 'sky'];

export const SOURCES = {
  bbc: {
    key: 'bbc',
    name: 'BBC Sport',
    mono: 'BBC',
    gradient: 'linear-gradient(135deg, #1a1a1a 0%, #3a3000 45%, #ffd230 100%)',
    fg: '#fff5c2',
    color: '#ffd230',
    colorLight: '#8a6100',
  },
  guardian: {
    key: 'guardian',
    name: 'The Guardian',
    mono: 'G',
    gradient: 'linear-gradient(135deg, #041f4a 0%, #052962 45%, #2d8fe0 100%)',
    fg: '#e6f1ff',
    color: '#5aa8f5',
    colorLight: '#0b4fa8',
  },
  espn: {
    key: 'espn',
    name: 'ESPN',
    mono: 'ESPN',
    gradient: 'linear-gradient(135deg, #4a0000 0%, #b30000 50%, #ff4d4d 100%)',
    fg: '#ffe9e9',
    color: '#ff6b6b',
    colorLight: '#b91c1c',
  },
  sky: {
    key: 'sky',
    name: 'Sky Sports',
    mono: 'SKY',
    gradient: 'linear-gradient(135deg, #061a4d 0%, #0052cc 50%, #00c2ff 100%)',
    fg: '#e6f7ff',
    color: '#38bdf8',
    colorLight: '#0369a1',
  },
};

const FALLBACK = {
  key: 'other',
  name: 'Football news',
  mono: 'NEWS',
  gradient: 'var(--brand-grad)',
  fg: '#ffffff',
  color: '#7c6cff',
  colorLight: '#5b4bff',
};

export function sourceMeta(article) {
  if (!article) return FALLBACK;
  const byKey = SOURCES[article.sourceKey];
  if (byKey) return byKey;
  const byName = Object.values(SOURCES).find((s) => s.name === article.source);
  return byName ?? { ...FALLBACK, name: article.source || FALLBACK.name };
}

/** Inline style exposing the source colours as CSS variables. */
export function sourceVars(meta) {
  return {
    '--src': meta.color,
    '--src-light': meta.colorLight,
    '--src-grad': meta.gradient,
    '--src-fg': meta.fg,
  };
}
