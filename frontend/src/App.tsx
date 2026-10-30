import { useCallback, useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { useDashboard } from "./hooks/useDashboard";
import { useRoute } from "./hooks/useRoute";
import { loadPlace, savePlace } from "./lib/format";
import type { LayerId } from "./lib/scales";
import { AboutPage } from "./pages/AboutPage";
import { CommunitiesPage } from "./pages/CommunitiesPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ImpactPage } from "./pages/ImpactPage";
import { MapPage } from "./pages/MapPage";
import { RiskPage } from "./pages/RiskPage";
import type { Place } from "./types";

const DEFAULT_PLACE: Place = { name: "Cusco", region: "Cusco", country: "Perú", latitude: -13.532, longitude: -71.9675, origin: "default" };

const FAVORITES: Place[] = [
  DEFAULT_PLACE,
  { name: "Puno", region: "Puno", country: "Perú", latitude: -15.8402, longitude: -70.0219 },
  { name: "Huancavelica", region: "Huancavelica", country: "Perú", latitude: -12.7861, longitude: -74.9764 },
  { name: "Piura", region: "Piura", country: "Perú", latitude: -5.1945, longitude: -80.6328 },
  { name: "Lima", region: "Lima", country: "Perú", latitude: -12.0464, longitude: -77.0428 },
  { name: "Iquitos", region: "Loreto", country: "Perú", latitude: -3.7491, longitude: -73.2538 },
];

export default function App() {
  const [route, navigate] = useRoute();
  const [place, setPlaceState] = useState<Place>(() => loadPlace(DEFAULT_PLACE));
  const [layer, setLayer] = useState<LayerId>("none");
  const dash = useDashboard(place);

  const setPlace = useCallback((p: Place) => {
    setPlaceState(p);
    savePlace(p);
  }, []);

  const pick = useCallback((lat: number, lon: number) => {
    const wrap = ((lon + 540) % 360) - 180; // el mapa puede repetirse horizontalmente
    setPlace({
      name: "Punto seleccionado",
      latitude: Math.round(Math.max(-90, Math.min(90, lat)) * 1000) / 1000,
      longitude: Math.round(wrap * 1000) / 1000,
      origin: "click",
    });
  }, [setPlace]);

  const common = { place, data: dash.data, error: dash.error, onRetry: dash.refresh };

  return (
    <div className="app">
      <Sidebar route={route} onNavigate={navigate} favorites={FAVORITES} onPick={setPlace} active={place} />
      <div className="content">
        <Topbar place={place} onSelect={setPlace} loading={dash.loading} error={dash.error}
          fetchedAt={dash.fetchedAt} onRefresh={dash.refresh} />
        <main>
          {route === "/" && <DashboardPage {...common} loading={dash.loading} layer={layer} onLayer={setLayer} onPick={pick} onNavigate={navigate} />}
          {route === "/comunidades" && <CommunitiesPage place={place} data={dash.data} />}
          {route === "/impacto" && <ImpactPage />}
          {route === "/mapa" && <MapPage {...common} layer={layer} onLayer={setLayer} onPick={pick} />}
          {route === "/riesgo" && <RiskPage {...common} />}
          {route === "/acerca" && <AboutPage />}
        </main>
        <footer className="footer">ClimaGuard AI · Prototipo académico · Escenarios y comunidades de demostración · Datos en vivo: Open-Meteo (CC BY 4.0)</footer>
      </div>
    </div>
  );
}
