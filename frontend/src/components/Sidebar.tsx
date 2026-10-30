import { CloudSun, Info, LayoutDashboard, Map, MapPin, ShieldAlert, Target, Users } from "lucide-react";
import type { ReactNode } from "react";
import type { Route } from "../hooks/useRoute";
import type { Place } from "../types";

const NAV: { route: Route; label: string; icon: ReactNode }[] = [
  { route: "/", label: "Dashboard", icon: <LayoutDashboard size={18} aria-hidden /> },
  { route: "/comunidades", label: "Comunidades", icon: <Users size={18} aria-hidden /> },
  { route: "/mapa", label: "Mapa", icon: <Map size={18} aria-hidden /> },
  { route: "/riesgo", label: "Riesgo", icon: <ShieldAlert size={18} aria-hidden /> },
  { route: "/impacto", label: "Impacto", icon: <Target size={18} aria-hidden /> },
  { route: "/acerca", label: "Acerca de", icon: <Info size={18} aria-hidden /> },
];

export function Sidebar({ route, onNavigate, favorites, onPick, active }: {
  route: Route;
  onNavigate: (r: Route) => void;
  favorites: Place[];
  onPick: (p: Place) => void;
  active: Place;
}) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <CloudSun size={26} aria-hidden />
        <span>ClimaGuard <strong>AI</strong></span>
      </div>

      <nav aria-label="Principal" className="nav">
        {NAV.map((n) => (
          <button key={n.route} className={`nav-link ${route === n.route ? "is-active" : ""}`}
            aria-current={route === n.route ? "page" : undefined} onClick={() => onNavigate(n.route)}>
            {n.icon}<span>{n.label}</span>
          </button>
        ))}
      </nav>

      <div className="side-section">
        <div className="side-caption">Ubicaciones rápidas</div>
        {favorites.map((f) => {
          const on = Math.abs(f.latitude - active.latitude) < 1e-6 && Math.abs(f.longitude - active.longitude) < 1e-6;
          return (
            <button key={f.name} className={`fav ${on ? "is-active" : ""}`} onClick={() => onPick({ ...f, origin: "search" })}>
              <MapPin size={14} aria-hidden /> {f.name}
            </button>
          );
        })}
      </div>

      <p className="side-foot">Prototipo académico<br />Indicador experimental, no oficial</p>
    </aside>
  );
}
