export type LayerId = "none" | "temperature" | "precipitation" | "wind";
export type LayerField = "temperature" | "precipitation" | "wind_speed";

export interface Stop {
  v: number;
  c: string;
}

export interface LayerDef {
  id: Exclude<LayerId, "none">;
  label: string;
  unit: string;
  field: LayerField;
  stops: Stop[];
  description: string;
  digits: number;
}

export const LAYERS: LayerDef[] = [
  {
    id: "temperature", label: "Temperatura", unit: "°C", field: "temperature", digits: 0,
    description: "Temperatura del aire a 2 m, valor actual del modelo en cada punto de la malla.",
    stops: [
      { v: -20, c: "#7c3aed" }, { v: -10, c: "#3b82f6" }, { v: 0, c: "#22d3ee" }, { v: 10, c: "#34d399" },
      { v: 20, c: "#facc15" }, { v: 30, c: "#fb923c" }, { v: 40, c: "#ef4444" }, { v: 50, c: "#991b1b" },
    ],
  },
  {
    id: "precipitation", label: "Precipitación", unit: "mm/h", field: "precipitation", digits: 1,
    description: "Precipitación de la última hora según el modelo; no es una medición de radar.",
    stops: [
      { v: 0, c: "#1e3a5f" }, { v: 0.1, c: "#38bdf8" }, { v: 1, c: "#3b82f6" }, { v: 2.5, c: "#6366f1" },
      { v: 7.6, c: "#a855f7" }, { v: 20, c: "#ec4899" }, { v: 50, c: "#ef4444" },
    ],
  },
  {
    id: "wind", label: "Viento", unit: "km/h", field: "wind_speed", digits: 0,
    description: "Velocidad del viento a 10 m. La flecha indica hacia dónde sopla.",
    stops: [
      { v: 0, c: "#1e3a5f" }, { v: 10, c: "#22d3ee" }, { v: 20, c: "#34d399" }, { v: 40, c: "#facc15" },
      { v: 60, c: "#fb923c" }, { v: 90, c: "#ef4444" }, { v: 120, c: "#a855f7" },
    ],
  },
];

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function colorAt(def: LayerDef, value: number): string {
  const s = def.stops;
  if (value <= s[0].v) return s[0].c;
  if (value >= s[s.length - 1].v) return s[s.length - 1].c;
  for (let i = 1; i < s.length; i++) {
    if (value <= s[i].v) {
      const t = (value - s[i - 1].v) / (s[i].v - s[i - 1].v);
      const a = hexToRgb(s[i - 1].c);
      const b = hexToRgb(s[i].c);
      const mix = a.map((x, k) => Math.round(x + (b[k] - x) * t));
      return `rgb(${mix[0]},${mix[1]},${mix[2]})`;
    }
  }
  return s[s.length - 1].c;
}

/** Elige texto claro u oscuro según la luminosidad del fondo. */
export function textOn(color: string): string {
  const m = color.match(/\d+/g);
  const rgb = color.startsWith("#") ? hexToRgb(color) : m ? m.slice(0, 3).map(Number) : [0, 0, 0];
  const lum = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  return lum > 150 ? "#0b1624" : "#ffffff";
}

export const layerById = (id: LayerId): LayerDef | undefined => LAYERS.find((l) => l.id === id);
