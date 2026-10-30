import { useCallback, useEffect, useRef, useState } from "react";
import { getField, isAbort } from "../lib/api";
import type { FieldData } from "../types";

let memo: FieldData | null = null; // se descarga una vez por sesión de navegación

/** Campo global para colorear el globo. Solo se pide cuando el globo está activo con una capa elegida. */
export function useField(enabled: boolean) {
  const [state, setState] = useState<{ data: FieldData | null; loading: boolean; error: string | null }>({
    data: memo, loading: false, error: null,
  });
  const [nonce, setNonce] = useState(0);
  const ref = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!enabled || memo) return;
    const ctrl = new AbortController();
    ref.current = ctrl;
    setState((s) => ({ ...s, loading: true, error: null }));
    getField(ctrl.signal)
      .then((data) => {
        memo = data;
        if (!ctrl.signal.aborted) setState({ data, loading: false, error: null });
      })
      .catch((e: unknown) => {
        if (isAbort(e) || ctrl.signal.aborted) return;
        setState((s) => ({ ...s, loading: false, error: e instanceof Error ? e.message : "Error desconocido" }));
      });
    return () => ctrl.abort();
  }, [enabled, nonce]);

  const retry = useCallback(() => setNonce((n) => n + 1), []);
  return { ...state, retry };
}
