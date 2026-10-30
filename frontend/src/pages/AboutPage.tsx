import { Database, Info, Scale } from "lucide-react";
import { Panel } from "../components/Common";
import { API_BASE } from "../lib/api";

export function AboutPage() {
  return (
    <div className="page">
      <Panel title="Acerca de ClimaGuard AI" subtitle="Plataforma experimental de inteligencia meteorológica" icon={<Info size={18} aria-hidden />}>
        <div className="prose">
          <p>ClimaGuard AI reúne pronóstico, mapa con capas, un indicador experimental de riesgo y una comparación estadística con
            la climatología histórica. Todo el cálculo de riesgo y anomalías vive en el backend (FastAPI), de modo que el
            navegador solo muestra resultados.</p>
          <h3>Cómo leer los niveles</h3>
          <div className="legend-levels">
            <span className="badge lvl-green">Bajo</span>
            <span className="badge lvl-yellow">Moderado</span>
            <span className="badge lvl-orange">Alto</span>
            <span className="badge lvl-red">Crítico</span>
          </div>
          <p>El nivel global es el más alto entre siete factores: estrés térmico, frío, intensidad y acumulado de lluvia, rachas de
            viento, cambio brusco de temperatura y caída de presión.</p>
        </div>
      </Panel>

      <Panel title="Datos y atribución" icon={<Database size={18} aria-hidden />}>
        <div className="prose">
          <p>Datos meteorológicos de <a href="https://open-meteo.com" target="_blank" rel="noreferrer">Open-Meteo</a> (licencia CC BY 4.0).
            Climatología histórica: reanálisis ERA5 vía Open-Meteo Historical API. Mapas base: &copy; OpenStreetMap contributors y CARTO.</p>
          <p>Los valores provienen de modelos numéricos, no de estaciones puntuales. Las capas del mapa son una malla de 48 puntos
            del modelo, no radar ni imágenes satelitales.</p>
          <p>Open-Meteo es gratuito para uso no comercial con límites de consulta; un uso comercial requiere su plan de pago.</p>
          <p>Documentación de la API: {API_BASE ? <a href={`${API_BASE}/docs`} target="_blank" rel="noreferrer">{API_BASE}/docs</a> : <code>/docs</code> + " en el servidor del backend"}.</p>
        </div>
      </Panel>

      <Panel title="Limitaciones" icon={<Scale size={18} aria-hidden />}>
        <ul className="limits">
          <li>No sustituye a las alertas oficiales ni debe usarse para decisiones de seguridad.</li>
          <li>Los umbrales son genéricos y no consideran la vulnerabilidad ni la climatología local; algunos son experimentales.</li>
          <li>Resolución espacial de ~10-25 km: no representa microclimas.</li>
          <li>No existe todavía un modelo de aprendizaje automático entrenado.</li>
        </ul>
      </Panel>
    </div>
  );
}
