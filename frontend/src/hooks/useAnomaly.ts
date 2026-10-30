import { useCallback, useEffect, useRef, useState } from "react";
import { getAnomaly, getMethodology, isAbort } from "../lib/api";
import type { AnomalyData, Methodology, Place } from "../types";

interface Async<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useAnomaly(place: Place) {
  const key = `${place.latitude},${place.longitude}`;
  const [state, setState] = useState<Async<AnomalyData> & { key: string }>({ key, data: null, loading: true, error: null });
  const ref = useRef<AbortController | null>(null);

  const load = useCallback(() => {
    ref.current?.abort();
    const ctrl = new AbortController();
    ref.current = ctrl;
    setState((s) => ({ key, data: s.key === key ? s.data : null, loading: true, error: null }));
    getAnomaly(place.latitude, place.longitude, ctrl.signal)
      .then((data) => !ctrl.signal.aborted && setState({ key, data, loading: false, error: null }))
      .catch((e: unknown) => {
        if (isAbort(e) || ctrl.signal.aborted) return;
        setState((s) => ({ ...s, loading: false, error: e instanceof Error ? e.message : "Error desconocido" }));
      });
  }, [key, place.latitude, place.longitude]);

  useEffect(() => {
    load();
    return () => ref.current?.abort();
  }, [load]);

  return { data: state.data, loading: state.loading, error: state.error, retry: load };
}

export function useMethodology() {
  const [state, setState] = useState<Async<Methodology>>({ data: null, loading: true, error: null });
  useEffect(() => {
    const ctrl = new AbortController();
    getMethodology(ctrl.signal)
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((e: unknown) => {
        if (isAbort(e)) return;
        setState({ data: null, loading: false, error: e instanceof Error ? e.message : "Error desconocido" });
      });
    return () => ctrl.abort();
  }, []);
  return state;
}
