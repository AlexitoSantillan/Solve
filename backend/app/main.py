from __future__ import annotations

from datetime import date, datetime, timezone

import httpx
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from .anomaly import HALF_WINDOW_DAYS, anomaly_report
from .config import get_settings
from .dashboard import current_block, daily_rows, hourly_next_hours
from .cities import cities_in_bbox
from .grid import lattice_points, parse_grid, snap_grid
from .grid import FIELD_LATS, FIELD_LONS, FIELD_STEP
from .open_meteo import fetch_archive, fetch_field, fetch_forecast, fetch_grid
from .risk import DISCLAIMER, METHODOLOGY_VERSION, assess_from_open_meteo, rules_as_dict

settings = get_settings()

app = FastAPI(
    title="ClimaGuard AI API",
    version="2.0.0",
    description="Datos meteorológicos de Open-Meteo, indicador experimental de riesgo y anomalías climatológicas.",
)
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origins, allow_methods=["GET"], allow_headers=["*"])

SOURCE = {"name": "Open-Meteo", "url": "https://open-meteo.com", "license": "CC BY 4.0"}
Lat = Query(ge=-90, le=90, description="Latitud en grados decimales")
Lon = Query(ge=-180, le=180, description="Longitud en grados decimales")


@app.get("/api/health")
def health():
    return {"status": "ok", "api_version": app.version, "methodology_version": METHODOLOGY_VERSION}


@app.get("/api/cities")
async def cities(q: str = Query(min_length=2, max_length=100)):
    try:
        async with httpx.AsyncClient(timeout=settings.http_timeout) as client:
            response = await client.get(
                settings.geocoding_url, params={"name": q, "count": 8, "language": "es", "format": "json"})
            response.raise_for_status()
            return response.json().get("results", [])
    except httpx.HTTPError:
        raise HTTPException(502, "No se pudo consultar el buscador de ciudades")


@app.get("/api/weather")
async def weather(lat: float = Lat, lon: float = Lon):
    """Endpoint original (v1), conservado por compatibilidad."""
    params = {
        "latitude": lat, "longitude": lon, "timezone": "auto", "forecast_hours": 24, "forecast_days": 5,
        "current": "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,weather_code",
        "hourly": "temperature_2m,precipitation_probability,precipitation",
        "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code",
    }
    try:
        async with httpx.AsyncClient(timeout=settings.http_timeout) as client:
            response = await client.get(settings.forecast_url, params=params)
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError:
        raise HTTPException(502, "No se pudo consultar el pronóstico meteorológico")


@app.get("/api/dashboard")
async def dashboard(lat: float = Lat, lon: float = Lon):
    """Una sola consulta con condiciones actuales, próximas 24 h, 7 días y el indicador de riesgo."""
    raw = await fetch_forecast(lat, lon, settings)
    return {
        "location": {"latitude": raw.get("latitude"), "longitude": raw.get("longitude"),
                     "timezone": raw.get("timezone"), "elevation": raw.get("elevation")},
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source": SOURCE,
        "current": current_block(raw),
        "hourly": hourly_next_hours(raw, 24),
        "daily": daily_rows(raw),
        "risk": assess_from_open_meteo(raw).to_dict(),
    }


@app.get("/api/risk")
async def risk(lat: float = Lat, lon: float = Lon):
    """Indicador experimental de riesgo meteorológico (NO es una alerta oficial)."""
    raw = await fetch_forecast(lat, lon, settings)
    return {
        "location": {"latitude": raw.get("latitude"), "longitude": raw.get("longitude"),
                     "timezone": raw.get("timezone")},
        "data_time": (raw.get("current") or {}).get("time"),
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source": SOURCE,
        "assessment": assess_from_open_meteo(raw).to_dict(),
    }


@app.get("/api/risk/methodology")
def risk_methodology():
    return {"version": METHODOLOGY_VERSION, "disclaimer": DISCLAIMER, "rules": rules_as_dict()}


@app.get("/api/anomaly")
async def anomaly(lat: float = Lat, lon: float = Lon):
    """Compara el pronóstico de hoy con ~10 años de climatología del mismo punto (estadística, no ML)."""
    raw = await fetch_forecast(lat, lon, settings)
    rows = daily_rows(raw)
    if not rows:
        raise HTTPException(502, "Open-Meteo no devolvió el pronóstico diario")
    archive = await fetch_archive(lat, lon, settings)
    target = date.fromisoformat(rows[0]["date"])
    report = anomaly_report(rows[0], archive.get("daily") or {}, target)
    return {
        "location": {"latitude": raw.get("latitude"), "longitude": raw.get("longitude")},
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "report": report,
        "method": {
            "kind": "statistical_climatology",
            "is_machine_learning": False,
            "description": (f"Percentil y z-score del valor de hoy frente a los mismos días del año (±{HALF_WINDOW_DAYS} días) "
                            "de los últimos ~10 años."),
            "reference_data": "Open-Meteo Historical Weather API (reanálisis ERA5)",
            "limitations": [
                "El pronóstico de hoy y el reanálisis histórico provienen de modelos distintos: puede haber un sesgo pequeño.",
                "Resolución espacial de ~10-25 km: no captura microclimas urbanos ni de montaña.",
                "Una ventana de 10 años es corta para eventos verdaderamente raros.",
                "No predice eventos; solo indica cuán inusual es el valor previsto para la época.",
            ],
        },
        "source": SOURCE,
    }


@app.get("/api/grid")
async def grid(south: float = Query(ge=-90, le=90), west: float = Query(ge=-180, le=180),
               north: float = Query(ge=-90, le=90), east: float = Query(ge=-180, le=180)):
    """Valores actuales en una malla de puntos de Open-Meteo para las capas del mapa."""
    s, w, n, e, step = snap_grid(south, west, north, east)
    cities = cities_in_bbox(s, w, n, e)
    if cities:
        points = [(c[1], c[2]) for c in cities]
        meta = [{"name": c[0], "rank": c[3]} for c in cities]
        mode = "cities"
    else:  # vista sin ciudades (p. ej. océano abierto): retícula fija
        points, meta, mode = lattice_points(s, w, n, e, step), None, "lattice"
    raw = await fetch_grid(points, f"{mode}:{s}:{w}:{n}:{e}:{step}", settings)
    parsed = parse_grid(raw, points, meta)
    times = [p["time"] for p in parsed if p.get("time")]
    return {
        "bbox": {"south": s, "west": w, "north": n, "east": e},
        "points": parsed,
        "data_time_utc": max(times) if times else None,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source": SOURCE,
        "mode": mode,
        "note": ("Valores del modelo en ciudades fijas (más al acercar el mapa)." if mode == "cities" else f"Sin ciudades en la vista: puntos fijos cada {step}°.") + " No es radar ni imagen satelital.",
    }


@app.get("/api/globe-field")
async def globe_field():
    """Campo global de valores actuales (cada 12°) que el globo interpola para colorear la Tierra."""
    data = await fetch_field(settings)
    return {
        "lat0": FIELD_LATS[0], "lon0": FIELD_LONS[0], "step": FIELD_STEP,
        "rows": len(FIELD_LATS), "cols": len(FIELD_LONS),
        **data,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source": SOURCE,
        "note": "Valores del modelo cada 12° interpolados para visualización. No es radar ni imagen satelital.",
    }
