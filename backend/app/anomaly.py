"""Anomalías climatológicas: compara hoy con la historia del mismo punto y época del año.

IMPORTANTE (honestidad técnica): esto es ESTADÍSTICA descriptiva (percentiles y z-score contra una
climatología de ~10 años de reanálisis ERA5 vía Open-Meteo Archive). NO es aprendizaje automático y no
hay modelo entrenado. Módulo puro (solo biblioteca estándar).
"""
from __future__ import annotations

import statistics
from datetime import date
from typing import Any, Optional

HALF_WINDOW_DAYS = 7
MIN_SAMPLE = 30

VARIABLES = {
    # clave: (campo en Open-Meteo, etiqueta, unidad, ignorar si el valor es menor a esto)
    "temp_max": ("temperature_2m_max", "Temperatura máxima", "°C", None),
    "temp_min": ("temperature_2m_min", "Temperatura mínima", "°C", None),
    "precipitation": ("precipitation_sum", "Precipitación diaria", "mm", 1.0),
    "wind": ("wind_speed_10m_max", "Viento máximo", "km/h", None),
}


def _doy(d: date) -> int:
    return min(d.timetuple().tm_yday, 365)


def _circular_distance(a: int, b: int) -> int:
    diff = abs(a - b)
    return min(diff, 365 - diff)


def window_sample(dates: list[str], values: list[Any], target: date, half_window: int = HALF_WINDOW_DAYS) -> list[float]:
    """Valores históricos cuyo día del año está a ±half_window días del día objetivo."""
    t = _doy(target)
    out: list[float] = []
    for ds, v in zip(dates, values):
        if not isinstance(v, (int, float)) or isinstance(v, bool):
            continue
        try:
            d = date.fromisoformat(ds)
        except ValueError:
            continue
        if _circular_distance(_doy(d), t) <= half_window:
            out.append(float(v))
    return out


def compare(value: float, sample: list[float], ignore_below: Optional[float] = None) -> dict[str, Any]:
    n = len(sample)
    if n < MIN_SAMPLE:
        return {"available": False, "reason": f"Historial insuficiente ({n} datos)"}
    mean = statistics.fmean(sample)
    std = statistics.pstdev(sample)
    percentile = 100.0 * sum(1 for x in sample if x <= value) / n
    z = (value - mean) / std if std > 1e-9 else None
    if ignore_below is not None and value < ignore_below:
        status, direction = "Dentro de lo normal", "normal"
    elif percentile >= 99:
        status, direction = "Extremadamente alto para la época", "alto"
    elif percentile >= 95:
        status, direction = "Inusualmente alto para la época", "alto"
    elif percentile <= 1:
        status, direction = "Extremadamente bajo para la época", "bajo"
    elif percentile <= 5:
        status, direction = "Inusualmente bajo para la época", "bajo"
    else:
        status, direction = "Dentro de lo normal", "normal"
    return {
        "available": True, "value": round(value, 1), "percentile": round(percentile, 1),
        "mean": round(mean, 1), "std": round(std, 2), "z_score": round(z, 2) if z is not None else None,
        "samples": n, "status": status, "direction": direction,
    }


def anomaly_report(today: dict[str, Any], archive_daily: dict[str, Any], target: date) -> dict[str, Any]:
    """`today`: fila diaria de hoy (claves de dashboard.daily_rows). `archive_daily`: bloque 'daily' del archivo."""
    dates = archive_daily.get("time") or []
    mapping = {"temp_max": "temp_max", "temp_min": "temp_min", "precipitation": "precipitation_sum", "wind": "wind_speed_max"}
    items = []
    for key, (om_field, label, unit, ignore_below) in VARIABLES.items():
        value = today.get(mapping[key])
        entry: dict[str, Any] = {"id": key, "label": label, "unit": unit}
        if not isinstance(value, (int, float)):
            entry.update({"available": False, "reason": "Sin valor previsto para hoy"})
        else:
            sample = window_sample(dates, archive_daily.get(om_field) or [], target)
            entry.update(compare(float(value), sample, ignore_below))
        items.append(entry)
    flagged = [i["label"] for i in items if i.get("available") and i.get("direction") in ("alto", "bajo")]
    return {"date": target.isoformat(), "variables": items, "flagged": flagged,
            "window_days": HALF_WINDOW_DAYS}
