import Globe from "react-globe.gl";
import type { GlobeMethods } from "react-globe.gl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { composeEarth, loadBase } from "../lib/field";
import { colorAt, textOn } from "../lib/scales";
import type { LayerDef } from "../lib/scales";
import type { Bounds, FieldData, GridPoint, Place } from "../types";

const EARTH = "https://unpkg.com/three-globe@2.45.6/example/img/earth-blue-marble.jpg";
const BUMP = "https://unpkg.com/three-globe@2.45.6/example/img/earth-topology.png";
const SKY = "https://unpkg.com/three-globe@2.45.6/example/img/night-sky.png";

interface Item {
  kind: "city" | "selected";
  lat: number;
  lng: number;
  point?: GridPoint;
}

const esc = (t: string) => t.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));

/** Zona visible del globo (radio angular según la altura de la cámara) para pedir las ciudades al backend. */
function viewBounds(lat: number, lng: number, altitude: number): Bounds {
  const radius = (Math.acos(1 / (1 + altitude)) * 180) / Math.PI;
  const lngSpan = Math.abs(lat) + radius > 85 ? 180 : Math.min(180, radius / Math.max(0.2, Math.cos((lat * Math.PI) / 180)));
  return {
    south: Math.max(-85, lat - radius), north: Math.min(85, lat + radius),
    west: Math.max(-180, lng - lngSpan), east: Math.min(180, lng + lngSpan),
  };
}

/** ¿El punto está en el hemisferio visible? (coseno de la distancia angular al centro de la vista) */
function facing(lat: number, lng: number, cLat: number, cLng: number): boolean {
  const r = Math.PI / 180;
  return Math.sin(lat * r) * Math.sin(cLat * r) + Math.cos(lat * r) * Math.cos(cLat * r) * Math.cos((lng - cLng) * r) > 0.2;
}

export default function GlobeMap({ place, points, def, field, nasaUrl, nasaMaxLevel, onPick, onView, height }: {
  place: Place;
  points: GridPoint[];
  def: LayerDef | null;
  /** Campo global para colorear la Tierra; null = la Tierra tal como se ve desde el espacio. */
  field: FieldData | null;
  /** Plantilla con {z}/{y}/{x}; null = sin capa satelital. */
  nasaUrl: string | null;
  nasaMaxLevel: number;
  onPick: (lat: number, lon: number) => void;
  onView: (b: Bounds) => void;
  height: number;
}) {
  const ref = useRef<GlobeMethods | undefined>(undefined);
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(900);
  const [pov, setPov] = useState({ lat: place.latitude, lng: place.longitude, altitude: 2.2 });
  const timer = useRef<number | undefined>(undefined);
  const [earth, setEarth] = useState(EARTH);

  // Sin capa: textura original. Con capa: la misma textura con el campo de color encima.
  useEffect(() => {
    let off = false;
    if (!field || !def) { setEarth(EARTH); return; }
    loadBase(EARTH)
      .then((img) => { if (!off) setEarth(composeEarth(img, field, def)); })
      .catch(() => { if (!off) setEarth(EARTH); });
    return () => { off = true; };
  }, [field, def]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  // Vista inicial y vuelo al cambiar de lugar (no si el usuario hizo clic en el propio globo).
  useEffect(() => {
    const g = ref.current;
    if (!g) return;
    g.pointOfView({ lat: place.latitude, lng: place.longitude, altitude: place.origin === "click" ? g.pointOfView().altitude : 1.4 }, place.origin === "click" ? 0 : 1000);
  }, [place]);

  const handleZoom = useCallback((p: { lat: number; lng: number; altitude: number }) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setPov(p);
      onView(viewBounds(p.lat, p.lng, p.altitude));
    }, 250);
  }, [onView]);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  // Más cerca = más ciudades; además se omiten las que quedarían encimadas en pantalla.
  const items = useMemo<Item[]>(() => {
    const maxRank = pov.altitude > 1.5 ? 1 : pov.altitude > 0.6 ? 2 : 3;
    const g = ref.current;
    const taken: { x: number; y: number }[] = [];
    const out: Item[] = [{ kind: "selected", lat: place.latitude, lng: place.longitude }];
    const ordered = [...points].sort((a, b) => (a.rank ?? 9) - (b.rank ?? 9) || (a.name ?? "").localeCompare(b.name ?? ""));
    for (const p of ordered) {
      if ((p.rank ?? 3) > maxRank || !facing(p.latitude, p.longitude, pov.lat, pov.lng)) continue;
      if (g) {
        const s = g.getScreenCoords(p.latitude, p.longitude);
        if (taken.some((t) => Math.abs(t.x - s.x) < 84 && Math.abs(t.y - s.y) < 38)) continue;
        taken.push(s);
      }
      out.push({ kind: "city", lat: p.latitude, lng: p.longitude, point: p });
    }
    return out;
  }, [points, pov, place]);

  const element = useCallback((d: object) => {
    const it = d as Item;
    const el = document.createElement("div");
    if (it.kind === "selected") {
      el.className = "globe-sel";
      el.innerHTML = '<span class="sel-pulse"></span><span class="sel-dot"></span>';
      return el;
    }
    const p = it.point!;
    el.className = "globe-pill";
    if (def) {
      const bg = colorAt(def, p[def.field]);
      el.innerHTML = `<div class="pill" style="background:${bg};color:${textOn(bg)}">${p[def.field].toFixed(def.digits)}</div>` +
        (p.name ? `<span class="pill-name">${esc(p.name)}</span>` : "");
    } else {
      el.innerHTML = `<span class="globe-dot"></span>${p.name ? `<span class="pill-name">${esc(p.name)}</span>` : ""}`;
    }
    el.title = p.name ?? "";
    el.onclick = (e) => { e.stopPropagation(); onPick(p.latitude, p.longitude); };
    return el;
  }, [def, onPick]);

  const tileProps = useMemo(() => {
    if (!nasaUrl) return {};
    return {
      globeTileEngineUrl: (x: number, y: number, l: number) =>
        nasaUrl.replace("{z}", String(l)).replace("{y}", String(y)).replace("{x}", String(x)),
      globeTileEngineMaxLevel: nasaMaxLevel,
    };
  }, [nasaUrl, nasaMaxLevel]);

  return (
    <div ref={box} className="globe-box" style={{ height }}>
      <Globe
        ref={ref}
        width={width}
        height={height}
        backgroundColor="rgba(0,0,0,0)"
        backgroundImageUrl={SKY}
        globeImageUrl={earth}
        bumpImageUrl={BUMP}
        atmosphereColor="#5fd4ff"
        atmosphereAltitude={0.18}
        onGlobeClick={({ lat, lng }) => onPick(lat, lng)}
        onZoom={handleZoom}
        htmlElementsData={items}
        htmlLat="lat"
        htmlLng="lng"
        htmlAltitude={0.01}
        htmlElement={element}
        {...(tileProps as object)}
      />
    </div>
  );
}
