import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * Generic data hook.
 * @param {(signal: AbortSignal) => Promise<any>} fetcher  — must accept an AbortSignal
 * @param {object} options
 * @param {any[]}   options.deps          re-run when these change
 * @param {boolean} options.enabled       set false to skip fetching (e.g. lazy tabs)
 * @param {number}  options.pollMs        poll interval (only while the tab is visible)
 * @param {any}     options.initialData
 * @returns {{ data, error, loading, refreshing, refetch, updatedAt, setData }}
 */
export function useFetch(fetcher, { deps = [], enabled = true, pollMs = 0, initialData = null } = {}) {
  const [tick, setTick] = useState(0);
  const depsKey = useMemo(() => JSON.stringify(deps), [deps]);
  const requestKey = `${depsKey}#${tick}`;

  // Everything the request produces is stored together with the key it belongs to,
  // so "loading" is derived instead of being set inside the effect.
  const [result, setResult] = useState({ key: null, data: initialData, error: null, updatedAt: null });
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!enabled) return undefined;
    const controller = new AbortController();
    fetcherRef
      .current(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        setResult({ key: requestKey, data, error: null, updatedAt: Date.now() });
      })
      .catch((err) => {
        if (controller.signal.aborted || err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return;
        setResult((prev) => ({ key: requestKey, data: prev.data, error: err, updatedAt: prev.updatedAt }));
      });
    return () => controller.abort();
  }, [enabled, requestKey]);

  // Polling (visible tab only).
  useEffect(() => {
    if (!enabled || !pollMs) return undefined;
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') refetch();
    }, pollMs);
    const onVisible = () => {
      if (document.visibilityState === 'visible') refetch();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [enabled, pollMs, refetch]);

  const inFlight = enabled && result.key !== requestKey;
  const hasData = result.data !== null && result.data !== undefined;
  const setData = useCallback((updater) => {
    setResult((prev) => ({
      ...prev,
      data: typeof updater === 'function' ? updater(prev.data) : updater,
    }));
  }, []);

  return {
    data: result.data,
    // only surface an error for the *current* request (stale errors are cleared on refetch)
    error: inFlight ? null : result.error,
    loading: inFlight && !hasData,
    refreshing: inFlight && hasData,
    refetch,
    updatedAt: result.updatedAt,
    setData,
  };
}
