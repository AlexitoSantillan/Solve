import { Cloud, CloudDrizzle, CloudFog, CloudHail, CloudLightning, CloudRain, CloudSnow, CloudSun, Moon, Sun } from "lucide-react";
import type { IconKind } from "../lib/weather";

export function WeatherIcon({ kind, size = 28 }: { kind: IconKind; size?: number }) {
  const p = { size, "aria-hidden": true } as const;
  switch (kind) {
    case "clear-day": return <Sun {...p} className="wi wi-sun" />;
    case "clear-night": return <Moon {...p} className="wi wi-moon" />;
    case "partly": return <CloudSun {...p} className="wi wi-partly" />;
    case "fog": return <CloudFog {...p} className="wi wi-cloud" />;
    case "drizzle": return <CloudDrizzle {...p} className="wi wi-rain" />;
    case "rain": return <CloudRain {...p} className="wi wi-rain" />;
    case "snow": return <CloudSnow {...p} className="wi wi-snow" />;
    case "thunder": return <CloudLightning {...p} className="wi wi-thunder" />;
    case "hail": return <CloudHail {...p} className="wi wi-thunder" />;
    default: return <Cloud {...p} className="wi wi-cloud" />;
  }
}
