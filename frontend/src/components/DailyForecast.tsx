import { Droplets, Sun } from "lucide-react";
import { dayLabel, fmt } from "../lib/format";
import { describeWeather } from "../lib/weather";
import type { DailyRow } from "../types";
import { WeatherIcon } from "./WeatherIcon";

export function DailyForecast({ rows }: { rows: DailyRow[] }) {
  return (
    <div className="daily">
      {rows.map((d, i) => {
        const w = describeWeather(d.weather_code);
        const l = dayLabel(d.date);
        return (
          <article className={`day ${i === 0 ? "is-today" : ""}`} key={d.date}>
            <div className="day-name">{i === 0 ? "Hoy" : l.weekday} <span>{l.day}</span></div>
            <WeatherIcon kind={w.icon} />
            <div className="day-label">{w.label}</div>
            <div className="day-temps"><strong>{fmt(d.temp_max, 0)}°</strong><span>{fmt(d.temp_min, 0)}°</span></div>
            <div className="day-meta"><Droplets size={13} aria-hidden /> {fmt(d.precipitation_sum)} mm
              {d.precipitation_probability_max !== null && ` · ${fmt(d.precipitation_probability_max, 0)}%`}</div>
            <div className="day-meta"><Sun size={13} aria-hidden /> UV {fmt(d.uv_index_max, 0)}</div>
          </article>
        );
      })}
    </div>
  );
}
