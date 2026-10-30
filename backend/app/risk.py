"""Motor de riesgo meteorológico EXPERIMENTAL de ClimaGuard AI.

- Reglas por umbrales, documentadas en docs/RISK_METHODOLOGY.md.
- NO es inteligencia artificial: es un sistema de reglas determinista.
- NO es una alerta oficial. Las alertas oficiales las emite la autoridad meteorológica de cada país.

Módulo puro (solo biblioteca estándar): se puede probar sin red ni FastAPI.
"""
from __future__ import annotations

from dataclasses import asdict, dataclass
from enum import IntEnum
from typing import Any, Optional

METHODOLOGY_VERSION = "1.0.0-experimental"

DISCLAIMER = (
    "Indicador experimental calculado con reglas por umbrales sobre datos de Open-Meteo. "
    "No es una alerta oficial ni sustituye a la autoridad meteorológica de su país."
)


class Level(IntEnum):
    BAJO = 0
    MODERADO = 1
    ALTO = 2
    CRITICO = 3


LEVEL_META = {
    Level.BAJO: ("Bajo", "green"),
    Level.MODERADO: ("Moderado", "yellow"),
    Level.ALTO: ("Alto", "orange"),
    Level.CRITICO: ("Crítico", "red"),
}


@dataclass(frozen=True)
class Rule:
    id: str
    label: str
    unit: str
    direction: str  # "ge": el riesgo sube cuando el valor sube; "le": cuando baja
    moderate: float
    high: float
    critical: float
    basis: str  # De dónde sale el umbral (para que sea verificable)


RULES: dict[str, Rule] = {r.id: r for r in [
    Rule("calor", "Estrés térmico", "°C", "ge", 32.0, 39.0, 51.0,
         "Categorías del Heat Index del NWS (precaución extrema ≥32,2 °C; peligro ≥39,4 °C; "
         "peligro extremo ≥51,1 °C), aplicadas a la sensación térmica de Open-Meteo (fórmula distinta: aproximado)."),
    Rule("frio", "Frío extremo", "°C", "le", -5.0, -15.0, -30.0,
         "Umbrales experimentales sobre la sensación térmica; pendiente de calibrar con referencias de wind chill."),
    Rule("lluvia_intensidad", "Intensidad de lluvia", "mm/h", "ge", 2.5, 7.6, 50.0,
         "Clasificación de intensidad de la AMS/WMO: moderada ≥2,5 mm/h, fuerte >7,6 mm/h, violenta ≥50 mm/h."),
    Rule("lluvia_acumulada", "Lluvia acumulada (24 h)", "mm", "ge", 25.0, 50.0, 100.0,
         "Umbrales genéricos experimentales. No consideran la climatología local (limitación conocida)."),
    Rule("viento_rachas", "Rachas de viento", "km/h", "ge", 50.0, 75.0, 100.0,
         "Escala Beaufort 7 (viento fuerte ≈50 km/h) y 9–10 (temporal), usada sobre rachas: experimental."),
    Rule("cambio_temperatura", "Cambio brusco de temperatura (6 h)", "°C", "ge", 8.0, 12.0, 16.0,
         "Umbrales experimentales sobre la variación máxima de temperatura en ventanas de 6 horas."),
    Rule("caida_presion", "Caída de presión (3 h)", "hPa", "ge", 3.6, 6.0, 10.0,
         "Tendencia barométrica: 'cae rápidamente' 3,6–6,0 hPa/3 h y 'muy rápidamente' >6,0 hPa/3 h "
         "(convención del Met Office); el nivel crítico es experimental."),
]}


def classify(value: float, rule: Rule) -> Level:
    ge = rule.direction == "ge"
    if (value >= rule.critical) if ge else (value <= rule.critical):
        return Level.CRITICO
    if (value >= rule.high) if ge else (value <= rule.high):
        return Level.ALTO
    if (value >= rule.moderate) if ge else (value <= rule.moderate):
        return Level.MODERADO
    return Level.BAJO


@dataclass
class FactorResult:
    id: str
    label: str
    evaluated: bool
    level: int
    level_name: str
    color: str
    value: Optional[float]
    unit: str
    when: Optional[str]
    thresholds: dict[str, float]
    explanation: str


@dataclass
class RiskAssessment:
    level: int
    level_name: str
    color: str
    summary: str
    drivers: list[str]
    factors: list[FactorResult]
    horizon_hours: int
    evaluated_factors: int
    kind: str
    methodology_version: str
    disclaimer: str

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def rules_as_dict() -> list[dict[str, Any]]:
    """Reglas serializables: el frontend las muestra sin duplicar la lógica."""
    return [asdict(r) for r in RULES.values()]


# ---------- utilidades de series ----------

def _clean(times: list[str], values: list[Any]) -> list[tuple[str, float]]:
    out = []
    for t, v in zip(times, values):
        if isinstance(v, (int, float)) and not isinstance(v, bool):
            out.append((t, float(v)))
    return out


def _from_now(series: list[tuple[str, float]], now: Optional[str]) -> list[tuple[str, float]]:
    if not now:
        return series
    hour = now[:13]
    return [(t, v) for t, v in series if t[:13] >= hour]


def _max_swing(series: list[tuple[str, float]], window: int, drop_only: bool) -> Optional[tuple[str, float]]:
    """Mayor variación dentro de `window` horas. Devuelve (hora final, magnitud)."""
    best: Optional[tuple[str, float]] = None
    for i, (_, v_i) in enumerate(series):
        for j in range(i + 1, min(i + window + 1, len(series))):
            t_j, v_j = series[j]
            delta = (v_i - v_j) if drop_only else abs(v_j - v_i)
            if delta > 0 and (best is None or delta > best[1]):
                best = (t_j, delta)
    if best is None and len(series) >= 2:
        best = (series[-1][0], 0.0)  # serie estable: se evaluó y no hay variación
    return best


def _round(v: float) -> float:
    return round(v, 1)


def _build(rule: Rule, value: Optional[float], when: Optional[str], text_low: str, text_hit: str) -> FactorResult:
    thresholds = {"moderado": rule.moderate, "alto": rule.high, "critico": rule.critical}
    if value is None:
        return FactorResult(rule.id, rule.label, False, 0, LEVEL_META[Level.BAJO][0],
                            LEVEL_META[Level.BAJO][1], None, rule.unit, None, thresholds,
                            "No evaluado: el servicio de datos no devolvió esta variable.")
    level = classify(value, rule)
    name, color = LEVEL_META[level]
    hour = (when or "")[11:16]
    at = f" (hacia las {hour})" if hour else ""
    text = (text_low if level == Level.BAJO else text_hit).format(v=_round(value), u=rule.unit, at=at)
    return FactorResult(rule.id, rule.label, True, int(level), name, color, _round(value),
                        rule.unit, when, thresholds, text)


def assess_from_open_meteo(payload: dict[str, Any]) -> RiskAssessment:
    """Calcula el indicador a partir de una respuesta de Open-Meteo (current + hourly)."""
    current = payload.get("current") or {}
    hourly = payload.get("hourly") or {}
    times: list[str] = hourly.get("time") or []
    now = current.get("time")

    def series(name: str) -> list[tuple[str, float]]:
        return _clean(times, hourly.get(name) or [])

    apparent_all = series("apparent_temperature")
    temp_all = series("temperature_2m")
    pressure_all = series("surface_pressure")

    apparent = _from_now(apparent_all, now)
    precip = _from_now(series("precipitation"), now)
    gusts = _from_now(series("wind_gusts_10m"), now)

    # Incluir el valor actual de Open-Meteo en las series "ahora"
    if now:
        for key, target in (("apparent_temperature", apparent), ("precipitation", precip),
                            ("wind_gusts_10m", gusts)):
            v = current.get(key)
            if isinstance(v, (int, float)) and not isinstance(v, bool):
                target.append((now, float(v)))

    factors: list[FactorResult] = []

    def peak(s: list[tuple[str, float]], low: bool = False) -> tuple[Optional[float], Optional[str]]:
        if not s:
            return None, None
        t, v = (min if low else max)(s, key=lambda x: x[1])
        return v, t

    v, t = peak(apparent)
    factors.append(_build(RULES["calor"], v, t,
        "Sensación térmica máxima de {v} {u}{at}: sin estrés térmico destacado.",
        "Sensación térmica de hasta {v} {u}{at}. Evite esfuerzos al sol, hidrátese y busque sombra."))

    v, t = peak(apparent, low=True)
    factors.append(_build(RULES["frio"], v, t,
        "Sensación térmica mínima de {v} {u}{at}: sin frío extremo.",
        "Sensación térmica de hasta {v} {u}{at}. Abríguese y limite la exposición prolongada."))

    v, t = peak(precip)
    factors.append(_build(RULES["lluvia_intensidad"], v, t,
        "Intensidad máxima de {v} {u}{at}: sin lluvia intensa prevista.",
        "Lluvia de hasta {v} {u}{at}. Puede reducir la visibilidad y generar acumulación de agua."))

    total = sum(x for _, x in precip[:24]) if precip else None
    factors.append(_build(RULES["lluvia_acumulada"], total, None,
        "Acumulado previsto de {v} {u} en 24 h: sin acumulados destacados.",
        "Acumulado previsto de {v} {u} en 24 h. Atención a zonas bajas y cauces."))

    v, t = peak(gusts)
    factors.append(_build(RULES["viento_rachas"], v, t,
        "Rachas máximas de {v} {u}{at}: sin viento fuerte previsto.",
        "Rachas de hasta {v} {u}{at}. Asegure objetos sueltos y evite zonas expuestas."))

    now_series = _from_now(temp_all, now)
    swing = _max_swing(now_series, 6, drop_only=False)
    factors.append(_build(RULES["cambio_temperatura"], swing[1] if swing else None, swing[0] if swing else None,
        "Variación máxima de {v} {u} en 6 h: sin cambios bruscos.",
        "Variación de {v} {u} en 6 h{at}. Los cambios bruscos aumentan el estrés fisiológico y de infraestructura."))

    drop = _max_swing(pressure_all, 3, drop_only=True)
    factors.append(_build(RULES["caida_presion"], drop[1] if drop else None, drop[0] if drop else None,
        "Caída máxima de presión de {v} {u} en 3 h: tendencia estable.",
        "La presión cae {v} {u} en 3 h{at}: suele anticipar cambios de tiempo o inestabilidad."))

    evaluated = [f for f in factors if f.evaluated]
    top = max((f.level for f in evaluated), default=0)
    name, color = LEVEL_META[Level(top)]
    drivers = [f.label for f in evaluated if f.level == top and top > 0]

    if not evaluated:
        summary = "Sin datos suficientes para estimar el riesgo."
    elif top == 0:
        summary = "Ningún factor supera los umbrales en las próximas 24 horas."
    else:
        summary = f"Nivel {name.lower()} por: {', '.join(drivers)}."

    return RiskAssessment(
        level=top, level_name=name, color=color, summary=summary, drivers=drivers, factors=factors,
        horizon_hours=24, evaluated_factors=len(evaluated), kind="experimental_indicator",
        methodology_version=METHODOLOGY_VERSION, disclaimer=DISCLAIMER,
    )
