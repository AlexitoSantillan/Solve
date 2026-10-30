"""Configuración centralizada. Todo se lee de variables de entorno (sin credenciales en el código)."""
from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache

_DEFAULT_ORIGINS = "http://localhost:5173,http://127.0.0.1:5173"


def _csv(value: str) -> list[str]:
    return [item.strip().rstrip("/") for item in value.split(",") if item.strip()]


@dataclass(frozen=True)
class Settings:
    cors_origins: list[str]
    forecast_url: str
    geocoding_url: str
    http_timeout: float
    cache_ttl_seconds: int


@lru_cache
def get_settings() -> Settings:
    return Settings(
        # En Render: CORS_ORIGINS=https://tu-frontend.onrender.com
        cors_origins=_csv(os.getenv("CORS_ORIGINS", _DEFAULT_ORIGINS)),
        forecast_url=os.getenv("OPEN_METEO_FORECAST_URL", "https://api.open-meteo.com/v1/forecast"),
        geocoding_url=os.getenv("OPEN_METEO_GEOCODING_URL", "https://geocoding-api.open-meteo.com/v1/search"),
        http_timeout=float(os.getenv("HTTP_TIMEOUT_SECONDS", "15")),
        cache_ttl_seconds=int(os.getenv("CACHE_TTL_SECONDS", "600")),
    )
