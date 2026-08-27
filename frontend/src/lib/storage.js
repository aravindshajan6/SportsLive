// Safe localStorage helpers (storage can throw in private mode / blocked contexts).
export const KEYS = {
  token: 'sl_token',
  user: 'sl_user',
  theme: 'sl_theme',
};

export function getItem(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : raw;
  } catch {
    return fallback;
  }
}

export function setItem(key, value) {
  try {
    if (value === null || value === undefined) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

export function getJSON(key, fallback = null) {
  const raw = getItem(key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function setJSON(key, value) {
  setItem(key, value === null || value === undefined ? null : JSON.stringify(value));
}
