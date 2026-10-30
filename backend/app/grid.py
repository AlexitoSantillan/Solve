"""Malla de puntos para las capas del mapa (módulo puro)."""
from __future__ import annotations

import math
from typing import Any

ROWS = 6
COLS = 8
MAX_POINTS = 100
_STEPS = [0.5, 1, 2, 5, 10, 20, 30, 45]


def _nice_step(span: float, parts: int) -> float:
    need = span / parts
    for s in _STEPS:
        if s >= need:
            return s
    return _STEPS[-1]


def snap_grid(south: float, west: float, north: float, east: float) -> tuple[float, float, float, float, float]:
    """Ajusta el recuadro a una cuadrícula 'bonita' y devuelve también el paso (grados) entre puntos.

    El paso es el mismo en latitud y longitud y solo cambia por niveles discretos al hacer zoom,
    de modo que los puntos quedan anclados a lugares fijos del mapa.
    """
    south, north = max(-85.0, min(south, north)), min(85.0, max(south, north))
    west, east = max(-180.0, min(west, east)), min(180.0, max(west, east))
    step = max(_nice_step(max(north - south, 0.5), ROWS), _nice_step(max(east - west, 0.5), COLS))
    s = max(-85.0, math.floor(south / step) * step)
    n = min(85.0, math.ceil(north / step) * step)
    w = max(-180.0, math.floor(west / step) * step)
    e = min(180.0, math.ceil(east / step) * step)
    if n - s < step:
        n = min(85.0, s + step)
    if e - w < step:
        e = min(180.0, w + step)
    return s, w, n, e, step


def snap_bbox(south: float, west: float, north: float, east: float) -> tuple[float, float, float, float]:
    return snap_grid(south, west, north, east)[:4]


def lattice_points(south: float, west: float, north: float, east: float, step: float) -> list[tuple[float, float]]:
    """Puntos en los nodos de una retícula global (múltiplos de `step`).

    Un mismo lugar (p. ej. 10° S, 75° O) produce siempre el mismo punto, sin importar cómo se desplace el mapa.
    Los pasos 0,5 / 1 / 2 y 5 / 10 / 20 están anidados: al acercar, los puntos previos se conservan y aparecen otros intermedios.
    """
    k0, k1 = math.ceil(south / step - 1e-9), math.floor(north / step + 1e-9)
    j0, j1 = math.ceil(west / step - 1e-9), math.floor(east / step + 1e-9)
    pts = [(round(k * step, 4), round(j * step, 4))
           for k in range(k0, k1 + 1) for j in range(j0, j1 + 1)
           if abs(k * step) <= 85 and abs(j * step) < 180]
    if len(pts) > MAX_POINTS:
        raise ValueError("Demasiados puntos")
    return pts


def build_points(south: float, west: float, north: float, east: float,
                 rows: int = ROWS, cols: int = COLS) -> list[tuple[float, float]]:
    if rows * cols > MAX_POINTS:
        raise ValueError("Demasiados puntos")
    pts = []
    for r in range(rows):
        lat = south + (north - south) * (r + 0.5) / rows
        for c in range(cols):
            lon = west + (east - west) * (c + 0.5) / cols
            pts.append((round(lat, 3), round(lon, 3)))
    return pts


def parse_grid(raw: Any, points: list[tuple[float, float]], meta: list[dict[str, Any]] | None = None) -> list[dict[str, Any]]:
    """Open-Meteo devuelve una lista (varias ubicaciones) o un objeto (una sola)."""
    items = raw if isinstance(raw, list) else [raw]
    out = []
    for i, ((lat, lon), item) in enumerate(zip(points, items)):
        cur = (item or {}).get("current") or {}
        temp, rain, wind = cur.get("temperature_2m"), cur.get("precipitation"), cur.get("wind_speed_10m")
        if not all(isinstance(x, (int, float)) for x in (temp, rain, wind)):
            continue
        out.append({
            "latitude": item.get("latitude", lat), "longitude": item.get("longitude", lon),
            "temperature": temp, "precipitation": rain, "wind_speed": wind,
            "wind_direction": cur.get("wind_direction_10m"), "time": cur.get("time"),
            **((meta[i] if meta and i < len(meta) else {})),
        })
    return out


# ---------- campo global para colorear el globo ----------
# 15 filas x 30 columnas = 450 puntos (cada 12°). Se mantiene por debajo de los límites gratuitos de Open-Meteo.
FIELD_STEP = 12
FIELD_LATS = list(range(-84, 85, FIELD_STEP))
FIELD_LONS = list(range(-180, 180, FIELD_STEP))
FIELD_CHUNK = 100


def field_points() -> list[tuple[float, float]]:
    return [(float(la), float(lo)) for la in FIELD_LATS for lo in FIELD_LONS]


def field_matrices(items: list[Any]) -> dict[str, list[list[Any]]]:
    """Convierte las respuestas (en el mismo orden que `field_points`) en matrices filas x columnas.

    Un punto sin dato queda en None; el frontend lo ignora al interpolar.
    """
    cols = len(FIELD_LONS)
    out: dict[str, list[list[Any]]] = {"temperature": [], "precipitation": [], "wind_speed": []}
    for r in range(len(FIELD_LATS)):
        rows: dict[str, list[Any]] = {k: [] for k in out}
        for c in range(cols):
            i = r * cols + c
            cur = ((items[i] if i < len(items) else None) or {}).get("current") or {}
            for key, field in (("temperature", "temperature_2m"), ("precipitation", "precipitation"),
                               ("wind_speed", "wind_speed_10m")):
                v = cur.get(field)
                rows[key].append(round(float(v), 1) if isinstance(v, (int, float)) and not isinstance(v, bool) else None)
        for k in out:
            out[k].append(rows[k])
    return out
