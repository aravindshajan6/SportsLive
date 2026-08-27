import axios from 'axios';
import { KEYS, getItem } from './storage.js';

/** Dispatched on window when the API rejects the stored token (401). */
export const UNAUTHORIZED_EVENT = 'sl:unauthorized';

// VITE_API_URL: absolute URL of the API, or "/" to use the same origin (Docker/nginx proxy).
const RAW_API_URL = import.meta.env.VITE_API_URL;
function resolveApiUrl(raw) {
  if (raw === undefined || raw === '') return 'http://localhost:4000';
  if (raw.startsWith('/') || /^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`; // bare host (e.g. Render's fromService "host" property)
}
export const API_URL = resolveApiUrl(RAW_API_URL).replace(/\/+$/, '');

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = getItem(KEYS.token);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const data = error.response?.data;
    const apiError = data?.error;
    const message =
      apiError?.message ||
      (error.code === 'ECONNABORTED' ? 'The request timed out. Please try again.' : null) ||
      (!error.response ? 'Cannot reach the Sportscast server. It may be waking up — try again in a moment.' : null) ||
      error.message ||
      'Something went wrong';
    const err = new Error(message);
    err.status = error.response?.status ?? null;
    err.code = apiError?.code ?? error.code ?? null;
    err.details = apiError?.details ?? null;
    err.isNetwork = !error.response;
    // A rejected/expired token on an authenticated request → tell AuthContext to sign out.
    if (err.status === 401 && error.config?.headers?.Authorization && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT, { detail: err }));
    }
    return Promise.reject(err);
  },
);

// ---- typed helpers -------------------------------------------------------
const get = (url, config) => api.get(url, config).then((r) => r.data);
const post = (url, body, config) => api.post(url, body, config).then((r) => r.data);
const put = (url, body, config) => api.put(url, body, config).then((r) => r.data);

export const matchesApi = {
  live: (signal) => get('/matches/live', { signal }),
  byDate: (date, signal) => get('/matches', { params: date ? { date } : {}, signal }),
  detail: (id, signal) => get(`/matches/${id}`, { signal }),
  lineups: (id, signal) => get(`/matches/${id}/lineups`, { signal }),
  statistics: (id, signal) => get(`/matches/${id}/statistics`, { signal }),
  incidents: (id, signal) => get(`/matches/${id}/incidents`, { signal }),
  h2h: (id, signal) => get(`/matches/${id}/h2h`, { signal }),
  comments: (id, signal) => get(`/matches/${id}/comments`, { signal }),
  addComment: (id, text) => post(`/matches/${id}/comments`, { text }),
};

export const newsApi = {
  list: (source = 'all', limit = 40, signal) => get('/news', { params: { source, limit }, signal }),
};

export const authApi = {
  signup: (payload) => post('/auth/signup', payload),
  login: (payload) => post('/auth/login', payload),
  me: (signal) => get('/auth/me', { signal }),
  updateMe: (payload) => put('/users/me', payload),
  myComments: (signal) => get('/users/me/comments', { signal }),
};

export const contactApi = {
  send: (payload) => post('/contact', payload),
};

export const healthApi = {
  check: (signal) => get('/health', { signal }),
};
