import { Database } from "lucide-react";
import { dateTime } from "../lib/format";
import type { DashboardData } from "../types";

export function SourceBar({ data }: { data: DashboardData | null }) {
  return (
    <div className="sourcebar">
      <Database size={15} aria-hidden />
      <span>
        Fuente: <a href="https://open-meteo.com" target="_blank" rel="noreferrer">Open-Meteo</a> (licencia CC BY 4.0)
        {data && <> · Hora de los datos: {dateTime(data.current.time)} (hora local, {data.location.timezone})</>}
        {data && <> · Modelo numérico, no es una observación de estación</>}
      </span>
    </div>
  );
}
