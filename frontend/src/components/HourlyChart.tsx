import { useState } from "react";
import { Area, Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { hhmm } from "../lib/format";
import type { HourlyRow } from "../types";

type Mode = "temp" | "rain" | "wind";

const TABS: { id: Mode; label: string }[] = [
  { id: "temp", label: "Temperatura" },
  { id: "rain", label: "Precipitación" },
  { id: "wind", label: "Viento" },
];

const tooltipStyle = { background: "#0d2238", border: "1px solid #2b4a68", borderRadius: 10, color: "#eaf3ff" };

export function HourlyChart({ rows }: { rows: HourlyRow[] }) {
  const [mode, setMode] = useState<Mode>("temp");
  const data = rows.map((r) => ({ ...r, label: hhmm(r.time) }));

  return (
    <div>
      <div className="tabs" role="tablist" aria-label="Variable del gráfico">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={mode === t.id} className={mode === t.id ? "is-active" : ""} onClick={() => setMode(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="chart" aria-label="Gráfico horario de las próximas 24 horas">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gTemp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.4} /><stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gWind" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.35} /><stop offset="100%" stopColor="#fbbf24" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#1d3550" strokeDasharray="3 5" vertical={false} />
            <XAxis dataKey="label" stroke="#8aa5c0" tick={{ fontSize: 11 }} interval={2} />
            {mode === "temp" && <YAxis stroke="#8aa5c0" tick={{ fontSize: 11 }} unit=" °C" width={58} domain={["auto", "auto"]} />}
            {mode === "wind" && <YAxis stroke="#8aa5c0" tick={{ fontSize: 11 }} unit=" km/h" width={66} domain={[0, "auto"]} />}
            {mode === "rain" && <YAxis yAxisId="mm" stroke="#8aa5c0" tick={{ fontSize: 11 }} unit=" mm" width={58} domain={[0, "auto"]} />}
            {mode === "rain" && <YAxis yAxisId="pct" orientation="right" stroke="#8aa5c0" tick={{ fontSize: 11 }} unit="%" width={46} domain={[0, 100]} />}
            <Tooltip contentStyle={tooltipStyle} labelFormatter={(l) => `Hora local ${l}`} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {mode === "temp" && <Area type="monotone" dataKey="temperature" name="Temperatura (°C)" stroke="#22d3ee" strokeWidth={3} fill="url(#gTemp)" unit=" °C" />}
            {mode === "temp" && <Line type="monotone" dataKey="apparent" name="Sensación térmica (°C)" stroke="#fb923c" strokeWidth={2} strokeDasharray="5 4" dot={false} unit=" °C" />}
            {mode === "rain" && <Bar yAxisId="mm" dataKey="precipitation" name="Precipitación (mm)" fill="#8b5cf6" radius={[4, 4, 0, 0]} unit=" mm" />}
            {mode === "rain" && <Line yAxisId="pct" type="monotone" dataKey="precipitation_probability" name="Probabilidad (%)" stroke="#38bdf8" strokeWidth={2} dot={false} unit="%" />}
            {mode === "wind" && <Area type="monotone" dataKey="wind_speed" name="Viento (km/h)" stroke="#fbbf24" strokeWidth={3} fill="url(#gWind)" unit=" km/h" />}
            {mode === "wind" && <Line type="monotone" dataKey="wind_gusts" name="Rachas (km/h)" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 4" dot={false} unit=" km/h" />}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
