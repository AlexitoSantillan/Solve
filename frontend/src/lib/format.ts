import type { Place } from "../types";

export function fmt(v: number | null | undefined, digits = 1): string {
  return typeof v === "number" && Number.isFinite(v) ? v.toFixed(digits) : "--";
}

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const DAYS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

/** "2026-10-29T14:00" -> "14:00" */
export const hhmm = (iso: string | null | undefined): string => (iso && iso.length >= 16 ? iso.slice(11, 16) : "--");

/** "2026-10-29T14:00" -> "29 oct, 14:00" (hora local del lugar, tal como la entrega la API) */
export function dateTime(iso: string | null | undefined): string {
  if (!iso || iso.length < 16) return "--";
  const m = Number(iso.slice(5, 7)) - 1;
  return `${Number(iso.slice(8, 10))} ${MONTHS[m] ?? ""}, ${iso.slice(11, 16)}`;
}

export function dayLabel(date: string): { weekday: string; day: string } {
  const d = new Date(`${date}T12:00:00`);
  return { weekday: DAYS[d.getDay()] ?? "", day: String(d.getDate()) };
}

export function minutesAgo(ts: number | null, now: number): string {
  if (!ts) return "--";
  const m = Math.max(0, Math.round((now - ts) / 60000));
  if (m < 1) return "hace menos de 1 min";
  return m === 1 ? "hace 1 min" : `hace ${m} min`;
}

const COMPASS = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];
export const compass = (deg: number | null | undefined): string =>
  typeof deg === "number" ? COMPASS[Math.round(deg / 45) % 8] : "--";

export function placeTitle(p: Place): string {
  return p.name;
}

export function placeSubtitle(p: Place): string {
  if (p.origin === "click") return `${p.latitude.toFixed(3)}°, ${p.longitude.toFixed(3)}°`;
  return [p.region, p.country].filter(Boolean).join(", ");
}

const KEY = "climaguard.place";

export function loadPlace(fallback: Place): Place {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fallback;
    const p = JSON.parse(raw) as Place;
    if (typeof p.latitude === "number" && typeof p.longitude === "number" && typeof p.name === "string") {
      return { ...p, origin: "default" };
    }
  } catch {
    /* almacenamiento no disponible */
  }
  return fallback;
}

export function savePlace(p: Place): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* ignorar */
  }
}
