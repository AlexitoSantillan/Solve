import { Activity, Globe2, ShieldCheck, Sun } from "lucide-react";
import { DailyForecast } from "../components/DailyForecast";
import { ErrorBox, Panel, Skeleton } from "../components/Common";
import { HourlyChart } from "../components/HourlyChart";
import { MetricCards } from "../components/MetricCards";
import { RiskPanel } from "../components/RiskPanel";
import { SourceBar } from "../components/SourceBar";
import { WeatherMap } from "../components/WeatherMap";
import type { Route } from "../hooks/useRoute";
import type { LayerId } from "../lib/scales";
import type { DashboardData, Place } from "../types";

export function DashboardPage({ place, data, error, loading, onRetry, layer, onLayer, onPick, onNavigate }: {
  place: Place;
  data: DashboardData | null;
  error: string | null;
  loading: boolean;
  onRetry: () => void;
  layer: LayerId;
  onLayer: (l: LayerId) => void;
  onPick: (lat: number, lon: number) => void;
  onNavigate: (r: Route) => void;
}) {
  return (
    <div className="page">
      {error && <ErrorBox message={error} onRetry={onRetry} />}
      <MetricCards current={data?.current ?? null} />

      <div className="grid-2">
        <Panel title="Mapa meteorológico" subtitle="Capas con datos reales del modelo" icon={<Globe2 size={18} aria-hidden />}
          actions={<button className="btn btn-ghost" onClick={() => onNavigate("/mapa")}>Pantalla completa</button>}>
          <WeatherMap place={place} dashboard={data} layer={layer} onLayer={onLayer} onPick={onPick} height={420} />
        </Panel>

        <Panel title="Riesgo meteorológico" subtitle="Indicador experimental, no es una alerta oficial" icon={<ShieldCheck size={18} aria-hidden />}
          actions={<button className="btn btn-ghost" onClick={() => onNavigate("/riesgo")}>Ver detalle</button>}>
          <RiskPanel risk={data?.risk ?? null} compact />
        </Panel>
      </div>

      <Panel title="Próximas 24 horas" subtitle="Datos horarios del modelo, hora local del lugar" icon={<Activity size={18} aria-hidden />}>
        {data ? <HourlyChart rows={data.hourly} /> : <Skeleton height={300} />}
      </Panel>

      <Panel title="Pronóstico de 7 días" subtitle="Máxima, mínima, precipitación acumulada, probabilidad e índice UV" icon={<Sun size={18} aria-hidden />}>
        {data ? <DailyForecast rows={data.daily} /> : <Skeleton height={180} />}
      </Panel>

      <SourceBar data={data} />
      {loading && !data && <span className="sr-only">Cargando datos</span>}
    </div>
  );
}
