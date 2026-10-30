import { useCallback, useEffect, useRef, useState } from "react";
import { getDashboard, isAbort } from "../lib/api";
import type { DashboardData, Place } from "../types";

interface State {
  key: string;
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  fetchedAt: number | null;
}

const REFRESH_MS = 10 * 60 * 1000;

export function useDashboard(place: Place) {
  const key = `${place.latitude},${place.longitude}`;
  const [state, setState] = useState<State>({ key, data: null, loading: true, error: null, fetchedAt: null });
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(() => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    // Si cambió el lugar, no se muestran datos de otro lugar mientras carga.
    setState((s) => ({ ...s, key, data: s.key === key ? s.data : null, loading: true, error: null }));
    getDashboard(place.latitude, place.longitude, ctrl.signal)
      .then((data) => {
        if (ctrl.signal.aborted) return;
        setState({ key, data, loading: false, error: null, fetchedAt: Date.now() });
      })
      .catch((e: unknown) => {
        if (isAbort(e) || ctrl.signal.aborted) return;
        setState((s) => ({ ...s, loading: false, error: e instanceof Error ? e.message : "Error desconocido" }));
      });
  }, [key, place.latitude, place.longitude]);

  useEffect(() => {
    load();
    const id = window.setInterval(load, REFRESH_MS);
    return () => {
      window.clearInterval(id);
      abortRef.current?.abort();
    };
  }, [load]);

  return { data: state.data, loading: state.loading, error: state.error, fetchedAt: state.fetchedAt, refresh: load };
}
