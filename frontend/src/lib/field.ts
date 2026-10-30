import { colorAt } from "./scales";
import type { LayerDef } from "./scales";
import type { FieldData } from "../types";

const W = 2048;
const H = 1024;
const FW = 360; // resolución del campo (1° por píxel); se escala suavemente a la textura
const FH = 180;

let baseCache: Promise<HTMLImageElement> | null = null;

/** Carga (una vez) la textura de la Tierra vista desde el espacio. */
export function loadBase(url: string): Promise<HTMLImageElement> {
  if (!baseCache) {
    baseCache = new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => {
        baseCache = null;
        reject(new Error("No se pudo cargar la textura de la Tierra"));
      };
      img.src = url;
    });
  }
  return baseCache;
}

type Matrix = (number | null)[][];

/** Interpolación bilineal sobre la retícula (con vuelta en longitud). Ignora los puntos sin dato. */
function sample(m: Matrix, f: FieldData, lat: number, lon: number): number | null {
  const fr = Math.min(f.rows - 1, Math.max(0, (lat - f.lat0) / f.step));
  let fc = (lon - f.lon0) / f.step;
  fc = ((fc % f.cols) + f.cols) % f.cols;
  const r0 = Math.floor(fr), r1 = Math.min(f.rows - 1, r0 + 1);
  const c0 = Math.floor(fc), c1 = (c0 + 1) % f.cols;
  const tr = fr - r0, tc = fc - c0;
  let sum = 0, wsum = 0;
  const add = (v: number | null | undefined, w: number) => {
    if (typeof v === "number") { sum += v * w; wsum += w; }
  };
  add(m[r0]?.[c0], (1 - tr) * (1 - tc));
  add(m[r0]?.[c1], (1 - tr) * tc);
  add(m[r1]?.[c0], tr * (1 - tc));
  add(m[r1]?.[c1], tr * tc);
  return wsum > 0 ? sum / wsum : null;
}

function lut(def: LayerDef): { lo: number; hi: number; rgb: Uint8ClampedArray } {
  const lo = def.stops[0].v, hi = def.stops[def.stops.length - 1].v;
  const rgb = new Uint8ClampedArray(256 * 3);
  for (let i = 0; i < 256; i++) {
    const m = colorAt(def, lo + ((hi - lo) * i) / 255).match(/\d+/g) ?? ["0", "0", "0"];
    rgb[i * 3] = +m[0]; rgb[i * 3 + 1] = +m[1]; rgb[i * 3 + 2] = +m[2];
  }
  return { lo, hi, rgb };
}

/** Dibuja el campo de color sobre la textura de la Tierra y devuelve la imagen resultante (data URL). */
export function composeEarth(base: HTMLImageElement, field: FieldData, def: LayerDef): string {
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(base, 0, 0, W, H);

  const matrix = field[def.field] as Matrix;
  const { lo, hi, rgb } = lut(def);
  const small = document.createElement("canvas");
  small.width = FW; small.height = FH;
  const sctx = small.getContext("2d")!;
  const img = sctx.createImageData(FW, FH);
  for (let y = 0; y < FH; y++) {
    const lat = 90 - ((y + 0.5) * 180) / FH;
    for (let x = 0; x < FW; x++) {
      const lon = -180 + ((x + 0.5) * 360) / FW;
      const v = sample(matrix, field, lat, lon);
      if (v === null) continue;
      const k = Math.round(((Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo)) * 255) * 3;
      const o = (y * FW + x) * 4;
      img.data[o] = rgb[k]; img.data[o + 1] = rgb[k + 1]; img.data[o + 2] = rgb[k + 2];
      // La lluvia solo se colorea donde llueve; viento y temperatura cubren todo el planeta.
      const alpha = def.id === "precipitation" ? Math.min(1, Math.max(0, (v - 0.05) / 0.6)) * 0.85
        : def.id === "wind" ? 0.3 + 0.45 * Math.min(1, v / 40) : 0.62;
      img.data[o + 3] = Math.round(alpha * 255);
    }
  }
  sctx.putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(small, 0, 0, W, H);
  return canvas.toDataURL("image/jpeg", 0.9);
}
