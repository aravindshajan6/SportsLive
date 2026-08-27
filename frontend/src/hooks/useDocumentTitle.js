import { useEffect } from 'react';

const BASE = 'Sportscast';

export function useDocumentTitle(title) {
  useEffect(() => {
    const prev = document.title;
    document.title = title ? `${title} · ${BASE}` : `${BASE} — Live football scores & news`;
    return () => {
      document.title = prev;
    };
  }, [title]);
}
