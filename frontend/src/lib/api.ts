import type { AnomalyData, Bounds, DashboardData, FieldData, GridData, Methodology, Place } from "../types";

export const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");

export class ApiError extends Error {}

export function isAbort(e: unknown): boolean {
  return e instanceof DOMException && e.name === "AbortError";
}

async function request<T>(
  path: string,
  params: Record<string, string | number>,
  signal?: AbortSignal,
  timeoutMs = 30000
): Promise<T> {
  const qs = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]));
  const url = `${API_BASE}${path}${qs.toString() ? "?" + qs.toString() : ""}`;
  const ctrl = new AbortController();
  const forward = () => ctrl.abort();
  signal?.addEventListener("abort", forward);
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    ctrl.abort();
  }, timeoutMs);

  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) {
      let detail = "";
      try {
        const body = (await res.json()) as { detail?: unknown };
        if (typeof body.detail === "string") detail = body.detail;
      } catch {
        /* cuerpo no JSON */
      }
      if (res.status === 422) throw new ApiError("Parámetros no válidos para la consulta.");
      throw new ApiError(detail || `El servidor respondió con error ${res.status}.`);
    }
    return (await res.json()) as T;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    if (signal?.aborted) throw e; // cancelación pedida por la propia app
    if (timedOut) throw new ApiError("El servidor tardó demasiado en responder. Intente de nuevo.");
    throw new ApiError("No se pudo conectar con el servidor de ClimaGuard AI.");
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", forward);
  }
}

interface RawCity {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
}

export async function searchPlaces(q: string, signal?: AbortSignal): Promise<Place[]> {
  const raw = await request<RawCity[]>("/api/cities", { q }, signal, 15000);
  return raw.map((r) => ({
    name: r.name,
    region: r.admin1,
    country: r.country,
    latitude: r.latitude,
    longitude: r.longitude,
    origin: "search" as const,
  }));
}

export const getDashboard = (lat: number, lon: number, signal?: AbortSignal) =>
  request<DashboardData>("/api/dashboard", { lat, lon }, signal);

export const getAnomaly = (lat: number, lon: number, signal?: AbortSignal) =>
  request<AnomalyData>("/api/anomaly", { lat, lon }, signal, 45000);

export const getMethodology = (signal?: AbortSignal) =>
  request<Methodology>("/api/risk/methodology", {}, signal, 15000);

export const getGrid = (b: Bounds, signal?: AbortSignal) =>
  request<GridData>("/api/grid", { south: b.south, west: b.west, north: b.north, east: b.east }, signal, 40000);

export const getField = (signal?: AbortSignal) => request<FieldData>("/api/globe-field", {}, signal, 90000);
