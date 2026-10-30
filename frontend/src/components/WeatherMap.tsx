import L from "leaflet";
import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { AlertTriangle, Layers, Loader2, RefreshCw } from "lucide-react";
import { useField } from "../hooks/useField";
import { useGrid } from "../hooks/useGrid";
import { compass, dateTime, fmt } from "../lib/format";
import { LAYERS, colorAt, layerById, textOn } from "../lib/scales";
import type { LayerDef, LayerId } from "../lib/scales";
import type { Bounds, DashboardData, GridPoint, Place } from "../types";

// El globo 3D (three.js) se descarga solo cuando se activa.
const GlobeMap = lazy(() => import("./GlobeMap"));

const TILES = {
  dark: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
  street: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
};

function FlyToPlace({ place }: { place: Place }) {
  const map = useMap();
  useEffect(() => {
    if (place.origin === "click") return; // el usuario ya está mirando ese punto
    map.flyTo([place.latitude, place.longitude], Math.max(map.getZoom(), 5), { duration: 1 });
  }, [place, map]);
  return null;
}

function MapEvents({ onPick, onView, onZoom }: { onPick: (lat: number, lon: number) => void; onView: (b: Bounds) => void; onZoom: (z: number) => void }) {
  const map = useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
    moveend() {
      report();
    },
    zoom() {
      onZoom(map.getZoom());
    },
  });
  function report() {
    const b = map.getBounds();
    onView({ south: b.getSouth(), west: b.getWest(), north: b.getNorth(), east: b.getEast() });
  }
  useEffect(() => {
    map.invalidateSize();
    onZoom(map.getZoom());
    report();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

/** Muestra primero las ciudades más importantes y omite las que quedarían encimadas en pantalla. */
function CityPills({ def, points }: { def: LayerDef; points: GridPoint[] }) {
  const map = useMap();
  const [tick, setTick] = useState(0);
  useMapEvents({ zoomend: () => setTick((t) => t + 1), moveend: () => setTick((t) => t + 1) });
  const shown = useMemo(() => {
    const ordered = [...points].sort((a, b) => (a.rank ?? 9) - (b.rank ?? 9) || (a.name ?? "").localeCompare(b.name ?? ""));
    const taken: { x: number; y: number }[] = [];
    const out: GridPoint[] = [];
    for (const p of ordered) {
      const pt = map.latLngToContainerPoint([p.latitude, p.longitude]);
      if (taken.some((t) => Math.abs(t.x - pt.x) < 96 && Math.abs(t.y - pt.y) < 40)) continue;
      taken.push({ x: pt.x, y: pt.y });
      out.push(p);
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, map, tick]);
  return (
    <>
      {shown.map((p) => (
        <Marker key={`${p.latitude},${p.longitude}`} position={[p.latitude, p.longitude]} icon={pillIcon(def, p)} keyboard={false}>
          <Popup>
            <strong>{p.name ? `${p.name} · ` : ""}{def.label}: {p[def.field].toFixed(1)} {def.unit}</strong>
            <div>Temperatura {fmt(p.temperature)} °C</div>
            <div>Precipitación {fmt(p.precipitation)} mm</div>
            <div>Viento {fmt(p.wind_speed)} km/h {compass(p.wind_direction)}</div>
            <small>{p.name ? "Ciudad" : "Punto de malla"} del modelo · {p.latitude.toFixed(2)}°, {p.longitude.toFixed(2)}°</small>
          </Popup>
        </Marker>
      ))}
    </>
  );
}

/* Capas satelitales de la NASA (GIBS, WMTS Web Mercator). */
type NasaId = "off" | "modis" | "imerg";
function nasaLayer(id: Exclude<NasaId, "off">) {
  const base = "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best";
  const day = new Date(Date.now() - 36 * 3600 * 1000).toISOString().slice(0, 10);
  if (id === "modis")
    return { url: `${base}/VIIRS_SNPP_CorrectedReflectance_TrueColor/default/${day}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`, maxNativeZoom: 9, opacity: 0.9,
      attribution: "Imagery &copy; NASA EOSDIS GIBS / MODIS Terra" };
  const t = new Date(Date.now() - 8 * 3600 * 1000);
  t.setUTCMinutes(t.getUTCMinutes() < 30 ? 0 : 30, 0, 0);
  const stamp = t.toISOString().slice(0, 19) + "Z";
  return { url: `${base}/IMERG_Precipitation_Rate/default/${stamp}/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png`, maxNativeZoom: 6, opacity: 0.75,
    attribution: "Precipitation &copy; NASA GPM IMERG via GIBS" };
}

const selectedIcon = L.divIcon({
  className: "sel-marker",
  html: '<span class="sel-pulse"></span><span class="sel-dot"></span>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const esc = (t: string) => t.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));

function pillIcon(def: LayerDef, p: GridPoint): L.DivIcon {
  const value = p[def.field];
  const bg = colorAt(def, value);
  const fg = textOn(bg);
  const text = value.toFixed(def.digits);
  const label = p.name ? `<span class="pill-name">${esc(p.name)}</span>` : "";
  if (def.id === "wind") {
    const rot = ((p.wind_direction ?? 0) + 180) % 360;
    const html =
      `<div class="pill-unit"><div class="pill" style="background:${bg};color:${fg}">` +
      `<svg width="14" height="14" viewBox="0 0 24 24" style="transform:rotate(${rot}deg)" aria-hidden="true">` +
      `<path d="M12 2 L19 20 L12 16 L5 20 Z" fill="${fg}"/></svg>${text}</div>${label}</div>`;
    return L.divIcon({ className: "pill-wrap", html, iconSize: [110, 40], iconAnchor: [55, 12] });
  }
  return L.divIcon({
    className: "pill-wrap",
    html: `<div class="pill-unit"><div class="pill" style="background:${bg};color:${fg}">${text}</div>${label}</div>`,
    iconSize: [110, 40],
    iconAnchor: [55, 12],
  });
}

function Legend({ def }: { def: LayerDef }) {
  const gradient = `linear-gradient(90deg, ${def.stops.map((s) => s.c).join(", ")})`;
  return (
    <div className="legend" aria-label={`Leyenda de ${def.label}`}>
      <strong>{def.label} ({def.unit})</strong>
      <div className="legend-bar" style={{ background: gradient }} />
      <div className="legend-ticks">{def.stops.map((s) => <span key={s.v}>{s.v}</span>)}</div>
    </div>
  );
}

export function WeatherMap({ place, dashboard, layer, onLayer, onPick, height = 460 }: {
  place: Place;
  dashboard: DashboardData | null;
  layer: LayerId;
  onLayer: (l: LayerId) => void;
  onPick: (lat: number, lon: number) => void;
  height?: number;
}) {
  const [basemap, setBasemap] = useState<"dark" | "street">("dark");
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const [zoom, setZoom] = useState(5);
  const [view, setView] = useState<"flat" | "globe">("flat");
  const [nasa, setNasa] = useState<NasaId>("off");
  const onGlobeView = useCallback((b: Bounds) => setBounds(b), []);
  const nasaDef = useMemo(() => (nasa === "off" ? null : nasaLayer(nasa)), [nasa]);
  // Las etiquetas crecen al acercar y se reducen al alejar (zoom 5 = tamaño normal).
  const pillScale = Math.min(1.6, Math.max(0.75, 0.6 + (zoom - 2) * 0.13));
  const def = layerById(layer);
  const grid = useGrid(bounds, layer !== "none");
  const field = useField(view === "globe" && layer !== "none");
  const points = useMemo(() => (grid.data?.points ?? []), [grid.data]);

  return (
    <div className="mapbox">
      <div className="map-toolbar">
        <div className="tabs" role="group" aria-label="Capa meteorológica">
          <button className={layer === "none" ? "is-active" : ""} aria-pressed={layer === "none"} onClick={() => onLayer("none")}>Sin capa</button>
          {LAYERS.map((l) => (
            <button key={l.id} className={layer === l.id ? "is-active" : ""} aria-pressed={layer === l.id} onClick={() => onLayer(l.id)}>
              {l.label}
            </button>
          ))}
        </div>
        <div className="tabs" role="group" aria-label="Capa satelital NASA">
          <button className={nasa === "off" ? "is-active" : ""} aria-pressed={nasa === "off"} onClick={() => setNasa("off")}>Sin satélite</button>
          <button className={nasa === "modis" ? "is-active" : ""} aria-pressed={nasa === "modis"} onClick={() => setNasa("modis")}>NASA · Imagen</button>
          <button className={nasa === "imerg" ? "is-active" : ""} aria-pressed={nasa === "imerg"} onClick={() => setNasa("imerg")}>NASA · Lluvia</button>
        </div>
        <div className="tabs" role="group" aria-label="Vista">
          <button className={view === "flat" ? "is-active" : ""} aria-pressed={view === "flat"} onClick={() => setView("flat")}>Mapa plano</button>
          <button className={view === "globe" ? "is-active" : ""} aria-pressed={view === "globe"} onClick={() => setView("globe")}>Globo 3D</button>
        </div>
        {view === "flat" && (
          <div className="tabs" role="group" aria-label="Mapa base">
            <button className={basemap === "dark" ? "is-active" : ""} aria-pressed={basemap === "dark"} onClick={() => setBasemap("dark")}>Oscuro</button>
            <button className={basemap === "street" ? "is-active" : ""} aria-pressed={basemap === "street"} onClick={() => setBasemap("street")}>Calles</button>
          </div>
        )}
      </div>

      <div className="map-frame" style={{ height, ["--pill-scale" as string]: pillScale }}>
        {view === "globe" ? (
          <Suspense fallback={<div className="map-chip"><Loader2 size={14} className="spin" aria-hidden /> Cargando globo 3D</div>}>
            <GlobeMap place={place} points={points} def={def ?? null} field={view === "globe" && layer !== "none" ? field.data : null} nasaUrl={nasaDef?.url ?? null} nasaMaxLevel={nasaDef?.maxNativeZoom ?? 9}
              onPick={onPick} onView={onGlobeView} height={height} />
          </Suspense>
        ) : (
        <MapContainer center={[place.latitude, place.longitude]} zoom={5} minZoom={2} worldCopyJump scrollWheelZoom style={{ height: "100%", width: "100%" }}>
          <TileLayer key={basemap} url={TILES[basemap]} attribution="Tiles &copy; Esri &mdash; OpenStreetMap contributors" />
          {nasaDef && <TileLayer key={nasa} url={nasaDef.url} maxNativeZoom={nasaDef.maxNativeZoom} opacity={nasaDef.opacity} attribution={nasaDef.attribution} zIndex={5} />}
          <FlyToPlace place={place} />
          <MapEvents onPick={onPick} onView={setBounds} onZoom={setZoom} />

          {def && <CityPills def={def} points={points} />}

          <Marker position={[place.latitude, place.longitude]} icon={selectedIcon} zIndexOffset={1000}>
            <Popup>
              <strong>{place.name}</strong>
              {dashboard ? (
                <>
                  <div>Temperatura {fmt(dashboard.current.temperature)} °C</div>
                  <div>Viento {fmt(dashboard.current.wind_speed)} km/h</div>
                  <div>Riesgo experimental: {dashboard.risk.level_name}</div>
                </>
              ) : <div>Cargando datos...</div>}
            </Popup>
          </Marker>
        </MapContainer>
        )}

        {def && <Legend def={def} />}
        {view === "globe" && field.loading && <div className="map-chip"><Loader2 size={14} className="spin" aria-hidden /> Calculando campo global</div>}
        {grid.loading && !(view === "globe" && field.loading) && <div className="map-chip"><Loader2 size={14} className="spin" aria-hidden /> Cargando capa</div>}
        <div className="map-hint">{view === "globe" ? "Arrastre para girar · rueda para acercar · clic para elegir un punto" : "Haga clic en el mapa para consultar ese punto"}</div>
      </div>

      <div className="map-info" role="status">
        {def ? (
          <>
            <Layers size={14} aria-hidden />
            <span>
              {def.description}{" "}
              {grid.data && <>Datos de {dateTime(grid.data.data_time_utc)} UTC · Open-Meteo · {grid.data.note}</>}
            </span>
            {view === "globe" && field.error && (
              <span className="map-error"><AlertTriangle size={14} aria-hidden /> {field.error}
                <button className="btn btn-ghost" onClick={field.retry}><RefreshCw size={13} aria-hidden /> Reintentar</button>
              </span>
            )}
            {grid.error && (
              <span className="map-error"><AlertTriangle size={14} aria-hidden /> {grid.error}
                <button className="btn btn-ghost" onClick={grid.retry}><RefreshCw size={13} aria-hidden /> Reintentar</button>
              </span>
            )}
          </>
        ) : (
          <><Layers size={14} aria-hidden /><span>Elija una capa para ver valores reales del modelo sobre el mapa.</span></>
        )}
      </div>
    </div>
  );
}
