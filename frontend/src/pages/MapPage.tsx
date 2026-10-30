import { ErrorBox } from "../components/Common";
import { WeatherMap } from "../components/WeatherMap";
import type { LayerId } from "../lib/scales";
import type { DashboardData, Place } from "../types";

export function MapPage({ place, data, error, onRetry, layer, onLayer, onPick }: {
  place: Place;
  data: DashboardData | null;
  error: string | null;
  onRetry: () => void;
  layer: LayerId;
  onLayer: (l: LayerId) => void;
  onPick: (lat: number, lon: number) => void;
}) {
  return (
    <div className="page">
      {error && <ErrorBox message={error} onRetry={onRetry} />}
      <section className="panel">
        <WeatherMap place={place} dashboard={data} layer={layer} onLayer={onLayer} onPick={onPick}
          height={Math.max(420, Math.round(window.innerHeight * 0.68))} />
      </section>
    </div>
  );
}
