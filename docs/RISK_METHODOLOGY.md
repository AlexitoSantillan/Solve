# Metodología (v1.0.0-experimental)

## Qué es y qué no es
- Indicador **experimental** por reglas con umbrales sobre datos de Open-Meteo. No es IA ni una alerta oficial.
- Alertas oficiales: las emite la autoridad meteorológica de cada país (p. ej. SENAMHI en Perú).

## Indicador de riesgo
Datos: `apparent_temperature`, `temperature_2m`, `precipitation`, `wind_gusts_10m`, `surface_pressure`
(próximas 24 h + valor actual; 3 h pasadas solo para tendencia de presión).
Cada factor toma su valor más desfavorable y se compara con tres umbrales (moderado, alto, crítico).
El nivel global es el máximo de los factores evaluados. Un factor sin datos se marca "no evaluado".

| Nivel | Color |
|---|---|
| Bajo | Verde |
| Moderado | Amarillo |
| Alto | Naranja |
| Crítico | Rojo |

Reglas y base de cada umbral: `backend/app/risk.py` (`RULES`) y `GET /api/risk/methodology`.

## Anomalías climatológicas
Para el valor previsto de hoy (T máx., T mín., precipitación diaria, viento máximo) se calcula el percentil y el z-score
frente a los mismos días del año (±7 días) de ~10 años del reanálisis ERA5 (Open-Meteo Archive).
Percentil ≥95 o ≤5: "inusual"; ≥99 o ≤1: "extremo". Mínimo 30 datos históricos. La precipitación menor a 1 mm no se marca.
Es estadística descriptiva, **no aprendizaje automático**.

## Limitaciones
- Umbrales absolutos en el indicador de riesgo (no climatológicos); varios son experimentales y sin validar con eventos reales.
- La sensación térmica de Open-Meteo no usa la fórmula del Heat Index del NWS: el umbral de calor es aproximado.
- Pronóstico y reanálisis provienen de modelos distintos (posible sesgo pequeño); resolución ~10-25 km.
- No se han calculado métricas de desempeño (precisión, falsos positivos).
