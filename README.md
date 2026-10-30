# ClimaGuard AI

Plataforma web de monitoreo meteorológico: pronóstico, mapa con capas de datos reales, indicador **experimental**
de riesgo y comparación estadística con la climatología histórica.

> El riesgo es un indicador experimental por reglas, **no una alerta oficial**. No hay (todavía) un modelo de
> aprendizaje automático entrenado: ver "Estado de la IA".

## Arquitectura

```
frontend (React + TS + Vite)  ──/api/*──▶  backend (FastAPI)  ──▶  Open-Meteo (forecast, archive, geocoding)
  solo presenta resultados                  validación, caché, riesgo, anomalías, malla del mapa
```

| Endpoint | Descripción |
|---|---|
| `GET /api/health` | Estado del servicio |
| `GET /api/cities?q=` | Búsqueda de ciudades (geocodificación Open-Meteo) |
| `GET /api/dashboard?lat=&lon=` | Actual + 24 h + 7 días + riesgo, en una sola consulta |
| `GET /api/risk?lat=&lon=` | Indicador de riesgo con explicaciones |
| `GET /api/risk/methodology` | Reglas, umbrales y su base |
| `GET /api/anomaly?lat=&lon=` | Hoy vs ~10 años de climatología (percentil y z-score) |
| `GET /api/grid?south=&west=&north=&east=` | Malla 6x8 de puntos para las capas del mapa |
| `GET /api/weather?lat=&lon=` | Endpoint original v1 (compatibilidad) |

Documentación interactiva: `http://localhost:8000/docs`.

## Desarrollo local (Windows / PowerShell)

```powershell
# Terminal 1 - backend
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload

# Terminal 2 - frontend
cd frontend
npm install
npm run dev        # http://localhost:5173 (el proxy de Vite reenvía /api al backend)
```

## Pruebas

```powershell
cd backend; python -m unittest discover -s tests -v   # riesgo, anomalías, malla, dashboard
cd frontend; npm run typecheck; npm run build
```

## Despliegue en Render

1. **Backend** (Web Service nuevo): Root Directory `backend`, Build `pip install -r requirements.txt`,
   Start `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
   Variable de entorno `CORS_ORIGINS` = URL del frontend (p. ej. `https://su-frontend.onrender.com`).
2. **Frontend** (Static Site existente): variable `VITE_API_URL` = URL del backend (sin barra final) y volver a desplegar
   (las variables `VITE_*` se incorporan en el build).
3. Comprobar `https://su-backend.onrender.com/api/health`.

El plan gratuito de Render duerme el servicio tras inactividad: la primera consulta puede tardar ~30-50 s.

## Variables de entorno

Backend (`backend/.env.example`): `CORS_ORIGINS`, `HTTP_TIMEOUT_SECONDS`, `CACHE_TTL_SECONDS`.
Frontend (`frontend/.env.example`): `VITE_API_URL`. No se requieren API keys; no hay credenciales en el código.

## Estado de la IA (declaración honesta)

| Componente | Técnica | ¿Es aprendizaje automático? |
|---|---|---|
| Nivel de riesgo | Reglas por umbrales documentados (`backend/app/risk.py`) | No |
| Anomalías | Percentil y z-score frente a ~10 años ERA5 (`backend/app/anomaly.py`) | No (estadística) |

Siguiente paso previsto: detector de anomalías multivariable entrenado con datos históricos y evaluado con métricas
(precisión, falsos positivos) antes de presentarlo como IA.

## Datos y licencias

Open-Meteo (CC BY 4.0; gratuito para uso no comercial con límites; uso comercial requiere su plan de pago),
ERA5 vía Open-Meteo Archive, mapas base © OpenStreetMap contributors y CARTO.
Las capas del mapa son una malla de puntos de un modelo numérico, no radar ni satélite.

## Limitaciones

Umbrales genéricos (algunos experimentales, sin validar contra eventos históricos); resolución ~10-25 km; sin límite
de peticiones por usuario en el backend (conviene añadirlo antes de abrirlo al público).
