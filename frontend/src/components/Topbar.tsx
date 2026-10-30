import { AlertTriangle, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { minutesAgo, placeSubtitle } from "../lib/format";
import type { Place } from "../types";
import { SearchBox } from "./SearchBox";

export function Topbar({ place, onSelect, loading, error, fetchedAt, onRefresh }: {
  place: Place;
  onSelect: (p: Place) => void;
  loading: boolean;
  error: string | null;
  fetchedAt: number | null;
  onRefresh: () => void;
}) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(id);
  }, []);

  let status;
  if (error) status = <span className="pill pill-red"><AlertTriangle size={14} aria-hidden /> Sin datos: {error}</span>;
  else if (loading) status = <span className="pill pill-blue"><Loader2 size={14} className="spin" aria-hidden /> Actualizando datos</span>;
  else status = <span className="pill pill-green"><CheckCircle2 size={14} aria-hidden /> Datos consultados {minutesAgo(fetchedAt, now)}</span>;

  return (
    <header className="topbar">
      <div className="topbar-place">
        <h1>{place.name}</h1>
        <p>{placeSubtitle(place)}</p>
      </div>
      <SearchBox onSelect={onSelect} />
      <button className="btn" onClick={onRefresh} disabled={loading} aria-label="Actualizar datos">
        <RefreshCw size={16} className={loading ? "spin" : ""} aria-hidden /> <span className="hide-sm">Actualizar</span>
      </button>
      <div className="topbar-status" role="status" aria-live="polite">{status}</div>
    </header>
  );
}
