"""Cliente de Open-Meteo con caché en memoria (TTL) y errores controlados."""
from __future__ import annotations

import time
from datetime import date, timedelta
from typing import Any

import httpx
from fastapi import HTTPException

from .config import Settings
from .grid import FIELD_CHUNK, field_matrices, field_points

ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"

DASHBOARD_PARAMS = {
    "timezone": "auto",
    "past_hours": 3,
    "forecast_hours": 24,
    "forecast_days": 7,
    "current": "temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,wind_speed_10m,"
               "wind_direction_10m,wind_gusts_10m,surface_pressure,cloud_cover,weather_code,is_day",
    "hourly": "temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,precipitation_probability,"
              "wind_speed_10m,wind_gusts_10m,surface_pressure",
    "daily": "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,"
             "precipitation_probability_max,wind_speed_10m_max,uv_index_max",
}

_MAX_ENTRIES = 400
_cache: dict[str, tuple[float, Any]] = {}


def _cache_get(key: str, ttl: int) -> Any:
    hit = _cache.get(key)
    if hit and time.monotonic() - hit[0] < ttl:
        return hit[1]
    return None


def _cache_set(key: str, value: Any) -> None:
    if len(_cache) >= _MAX_ENTRIES:
        oldest = min(_cache, key=lambda k: _cache[k][0])
        _cache.pop(oldest, None)
    _cache[key] = (time.monotonic(), value)


async def _get_json(url: str, params: dict[str, Any], timeout: float) -> Any:
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
    except httpx.TimeoutException:
        raise HTTPException(504, "Open-Meteo tardó demasiado en responder")
    except (httpx.HTTPError, ValueError):
        raise HTTPException(502, "No se pudo consultar Open-Meteo")
    if isinstance(data, dict) and data.get("error"):
        raise HTTPException(502, f"Open-Meteo: {data.get('reason', 'error desconocido')}")
    return data


async def fetch_forecast(lat: float, lon: float, settings: Settings) -> dict[str, Any]:
    key = f"fc:{round(lat, 2)}:{round(lon, 2)}"
    cached = _cache_get(key, settings.cache_ttl_seconds)
    if cached is not None:
        return cached
    data = await _get_json(settings.forecast_url, {**DASHBOARD_PARAMS, "latitude": lat, "longitude": lon},
                           settings.http_timeout)
    _cache_set(key, data)
    return data


async def fetch_archive(lat: float, lon: float, settings: Settings) -> dict[str, Any]:
    """~10 años de datos diarios (ERA5) hasta hace 7 días (el reanálisis tiene unos días de retraso)."""
    key = f"ar:{round(lat, 2)}:{round(lon, 2)}"
    cached = _cache_get(key, 24 * 3600)
    if cached is not None:
        return cached
    end = date.today() - timedelta(days=7)
    start = date(end.year - 10, end.month, min(end.day, 28))
    params = {
        "latitude": lat, "longitude": lon, "start_date": start.isoformat(), "end_date": end.isoformat(),
        "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max",
        "timezone": "auto",
    }
    data = await _get_json(ARCHIVE_URL, params, max(settings.http_timeout, 30.0))
    _cache_set(key, data)
    return data


async def fetch_grid(points: list[tuple[float, float]], bbox_key: str, settings: Settings) -> Any:
    key = f"gr:{bbox_key}"
    cached = _cache_get(key, 900)
    if cached is not None:
        return cached
    params = {
        "latitude": ",".join(str(p[0]) for p in points),
        "longitude": ",".join(str(p[1]) for p in points),
        "current": "temperature_2m,precipitation,wind_speed_10m,wind_direction_10m",
        "timezone": "UTC",
    }
    data = await _get_json(settings.forecast_url, params, max(settings.http_timeout, 25.0))
    _cache_set(key, data)
    return data


async def fetch_field(settings: Settings) -> dict[str, Any]:
    """Campo global (temperatura, lluvia, viento) para el globo. Caché de 1 hora: son ~450 puntos."""
    cached = _cache_get("field:v1", 3600)
    if cached is not None:
        return cached
    pts = field_points()
    items: list[Any] = []
    for i in range(0, len(pts), FIELD_CHUNK):  # en serie: respeta los límites por minuto
        chunk = pts[i:i + FIELD_CHUNK]
        params = {
            "latitude": ",".join(str(p[0]) for p in chunk),
            "longitude": ",".join(str(p[1]) for p in chunk),
            "current": "temperature_2m,precipitation,wind_speed_10m",
            "timezone": "UTC",
        }
        raw = await _get_json(settings.forecast_url, params, max(settings.http_timeout, 25.0))
        items.extend(raw if isinstance(raw, list) else [raw])
    data = field_matrices(items)
    _cache_set("field:v1", data)
    return data
