import { useCallback, useEffect, useRef, useState } from "react";
import { getGrid, isAbort } from "../lib/api";
import type { Bounds, GridData } from "../types";

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function normalizeBounds(b: Bounds): Bounds {
  const r = (v: number) => Math.round(v * 10) / 10;
  return {
    south: r(clamp(b.south, -85, 85)),
    north: r(clamp(b.north, -85, 85)),
    west: r(clamp(b.west, -180, 180)),
    east: r(clamp(b.east, -180, 180)),
  };
}

/** Descarga la malla de la capa activa (con espera para no saturar la API al mover el mapa). */
export function useGrid(bounds: Bounds | null, enabled: boolean) {
  const [state, setState] = useState<{ data: GridData | null; loading: boolean; error: string | null }>({
    data: null, loading: false, error: null,
  });
  const [nonce, setNonce] = useState(0);
  const ref = useRef<AbortController | null>(null);
  const sig = bounds ? JSON.stringify(normalizeBounds(bounds)) : "";

  useEffect(() => {
    if (!enabled || !sig) return;
    const b = JSON.parse(sig) as Bounds;
    const timer = window.setTimeout(() => {
      ref.current?.abort();
      const ctrl = new AbortController();
      ref.current = ctrl;
      setState((s) => ({ ...s, loading: true, error: null }));
      getGrid(b, ctrl.signal)
        .then((data) => !ctrl.signal.aborted && setState({ data, loading: false, error: null }))
        .catch((e: unknown) => {
          if (isAbort(e) || ctrl.signal.aborted) return;
          setState((s) => ({ ...s, loading: false, error: e instanceof Error ? e.message : "Error desconocido" }));
        });
    }, 700);
    return () => {
      window.clearTimeout(timer);
      ref.current?.abort();
    };
  }, [sig, enabled, nonce]);

  const retry = useCallback(() => setNonce((n) => n + 1), []);
  return { ...state, retry };
}
