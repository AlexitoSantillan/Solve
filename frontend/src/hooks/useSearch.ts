import { useEffect, useState } from "react";
import { isAbort, searchPlaces } from "../lib/api";
import type { Place } from "../types";

export function useSearch(query: string) {
  const [state, setState] = useState<{ results: Place[]; loading: boolean; error: string | null; searched: boolean }>({
    results: [], loading: false, error: null, searched: false,
  });

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setState({ results: [], loading: false, error: null, searched: false });
      return;
    }
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => {
      setState((s) => ({ ...s, loading: true, error: null }));
      searchPlaces(q, ctrl.signal)
        .then((results) => setState({ results, loading: false, error: null, searched: true }))
        .catch((e: unknown) => {
          if (isAbort(e)) return;
          setState({ results: [], loading: false, error: e instanceof Error ? e.message : "Error de búsqueda", searched: true });
        });
    }, 300);
    return () => {
      window.clearTimeout(timer);
      ctrl.abort();
    };
  }, [query]);

  return state;
}
