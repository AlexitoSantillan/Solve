"""Transforma la respuesta cruda de Open-Meteo en la forma que consume el dashboard (módulo puro)."""
from __future__ import annotations

from typing import Any, Optional


def _num(v: Any) -> Optional[float]:
    return float(v) if isinstance(v, (int, float)) and not isinstance(v, bool) else None


def _col(block: dict[str, Any], name: str, i: int) -> Optional[float]:
    arr = block.get(name) or []
    return _num(arr[i]) if i < len(arr) else None


def hourly_next_hours(raw: dict[str, Any], hours: int = 24) -> list[dict[str, Any]]:
    hourly = raw.get("hourly") or {}
    now = (raw.get("current") or {}).get("time")
    rows = []
    for i, t in enumerate(hourly.get("time") or []):
        if now and t[:13] < now[:13]:
            continue
        rows.append({
            "time": t,
            "temperature": _col(hourly, "temperature_2m", i),
            "apparent": _col(hourly, "apparent_temperature", i),
            "precipitation": _col(hourly, "precipitation", i),
            "precipitation_probability": _col(hourly, "precipitation_probability", i),
            "wind_speed": _col(hourly, "wind_speed_10m", i),
            "wind_gusts": _col(hourly, "wind_gusts_10m", i),
            "pressure": _col(hourly, "surface_pressure", i),
            "humidity": _col(hourly, "relative_humidity_2m", i),
        })
        if len(rows) >= hours:
            break
    return rows


def daily_rows(raw: dict[str, Any]) -> list[dict[str, Any]]:
    daily = raw.get("daily") or {}
    rows = []
    for i, d in enumerate(daily.get("time") or []):
        code = _col(daily, "weather_code", i)
        rows.append({
            "date": d,
            "weather_code": int(code) if code is not None else None,
            "temp_max": _col(daily, "temperature_2m_max", i),
            "temp_min": _col(daily, "temperature_2m_min", i),
            "precipitation_sum": _col(daily, "precipitation_sum", i),
            "precipitation_probability_max": _col(daily, "precipitation_probability_max", i),
            "wind_speed_max": _col(daily, "wind_speed_10m_max", i),
            "uv_index_max": _col(daily, "uv_index_max", i),
        })
    return rows


def current_block(raw: dict[str, Any]) -> dict[str, Any]:
    c = raw.get("current") or {}
    code = _num(c.get("weather_code"))
    return {
        "time": c.get("time"),
        "temperature": _num(c.get("temperature_2m")),
        "apparent": _num(c.get("apparent_temperature")),
        "humidity": _num(c.get("relative_humidity_2m")),
        "precipitation": _num(c.get("precipitation")),
        "wind_speed": _num(c.get("wind_speed_10m")),
        "wind_direction": _num(c.get("wind_direction_10m")),
        "wind_gusts": _num(c.get("wind_gusts_10m")),
        "pressure": _num(c.get("surface_pressure")),
        "cloud_cover": _num(c.get("cloud_cover")),
        "weather_code": int(code) if code is not None else None,
        "is_day": bool(c.get("is_day", 1)),
    }
