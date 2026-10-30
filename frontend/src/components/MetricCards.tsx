import { CloudRain, Droplets, Gauge, Wind } from "lucide-react";
import type { ReactNode } from "react";
import { compass, fmt } from "../lib/format";
import { describeWeather } from "../lib/weather";
import type { Current } from "../types";
import { Skeleton } from "./Common";
import { WeatherIcon } from "./WeatherIcon";

function Card({ title, value, unit, detail, icon, tone }: {
  title: string; value: string; unit: string; detail: string; icon: ReactNode; tone: string;
}) {
  return (
    <article className={`metric tone-${tone}`}>
      <header><span>{title}</span>{icon}</header>
      <div className="metric-value">{value}<small>{unit}</small></div>
      <p>{detail}</p>
    </article>
  );
}

export function MetricCards({ current }: { current: Current | null }) {
  if (!current) {
    return <div className="metrics">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={116} />)}</div>;
  }
  const w = describeWeather(current.weather_code, current.is_day);
  return (
    <div className="metrics">
      <article className="metric metric-hero">
        <header><span>Condición actual</span></header>
        <div className="hero-row">
          <WeatherIcon kind={w.icon} size={44} />
          <div>
            <div className="metric-value">{fmt(current.temperature)}<small>°C</small></div>
            <p>{w.label}</p>
          </div>
        </div>
        <p>Sensación térmica {fmt(current.apparent)} °C</p>
      </article>
      <Card title="Humedad relativa" value={fmt(current.humidity, 0)} unit="%" tone="blue"
        detail={`Nubosidad ${fmt(current.cloud_cover, 0)} %`} icon={<Droplets size={18} aria-hidden />} />
      <Card title="Viento" value={fmt(current.wind_speed)} unit="km/h" tone="amber"
        detail={`${compass(current.wind_direction)} · rachas ${fmt(current.wind_gusts, 0)} km/h`} icon={<Wind size={18} aria-hidden />} />
      <Card title="Precipitación" value={fmt(current.precipitation)} unit="mm" tone="violet"
        detail="Última hora (modelo)" icon={<CloudRain size={18} aria-hidden />} />
      <Card title="Presión" value={fmt(current.pressure, 0)} unit="hPa" tone="cyan"
        detail="A nivel de la estación" icon={<Gauge size={18} aria-hidden />} />
    </div>
  );
}
