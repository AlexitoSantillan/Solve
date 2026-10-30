export type IconKind =
  | "clear-day" | "clear-night" | "partly" | "cloud" | "fog"
  | "drizzle" | "rain" | "snow" | "thunder" | "hail";

interface Described {
  label: string;
  icon: IconKind;
}

/** Códigos WMO de Open-Meteo. */
export function describeWeather(code: number | null | undefined, isDay = true): Described {
  switch (code) {
    case 0: return { label: "Despejado", icon: isDay ? "clear-day" : "clear-night" };
    case 1: return { label: "Mayormente despejado", icon: isDay ? "clear-day" : "clear-night" };
    case 2: return { label: "Parcialmente nublado", icon: "partly" };
    case 3: return { label: "Nublado", icon: "cloud" };
    case 45: case 48: return { label: "Niebla", icon: "fog" };
    case 51: return { label: "Llovizna ligera", icon: "drizzle" };
    case 53: return { label: "Llovizna", icon: "drizzle" };
    case 55: return { label: "Llovizna intensa", icon: "drizzle" };
    case 56: case 57: return { label: "Llovizna helada", icon: "drizzle" };
    case 61: return { label: "Lluvia ligera", icon: "rain" };
    case 63: return { label: "Lluvia", icon: "rain" };
    case 65: return { label: "Lluvia intensa", icon: "rain" };
    case 66: case 67: return { label: "Lluvia helada", icon: "rain" };
    case 71: return { label: "Nevada ligera", icon: "snow" };
    case 73: return { label: "Nevada", icon: "snow" };
    case 75: return { label: "Nevada intensa", icon: "snow" };
    case 77: return { label: "Granos de nieve", icon: "snow" };
    case 80: return { label: "Chubascos ligeros", icon: "rain" };
    case 81: return { label: "Chubascos", icon: "rain" };
    case 82: return { label: "Chubascos violentos", icon: "rain" };
    case 85: case 86: return { label: "Chubascos de nieve", icon: "snow" };
    case 95: return { label: "Tormenta eléctrica", icon: "thunder" };
    case 96: case 99: return { label: "Tormenta con granizo", icon: "hail" };
    default: return { label: "Sin datos", icon: "cloud" };
  }
}
