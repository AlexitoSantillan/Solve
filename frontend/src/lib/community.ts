import type { RiskAssessment, RiskColor, RiskFactor } from "../types";

/* Perfiles de usuario: misma amenaza, distinta consecuencia y distinta acción. */

export type ProfileId = "agricultor" | "escuela" | "salud" | "pesca";

export interface Profile {
  id: ProfileId;
  name: string;
  who: string;
  emoji: string;
  /** Factores del indicador que importan a este perfil. */
  factors: string[];
  /** Qué está en juego (consecuencia, no solo "°C"). */
  stakes: string;
  /** Acción recomendada por factor (se muestra desde nivel moderado). */
  actions: Record<string, string>;
}

export const PROFILES: Profile[] = [
  {
    id: "agricultor", name: "Familia agricultora", who: "Papa, quinua y pastos a más de 3 500 m", emoji: "🌾",
    factors: ["frio", "lluvia_acumulada", "viento_rachas", "cambio_temperatura"],
    stakes: "Una helada en floración puede arrasar la cosecha de una campaña completa.",
    actions: {
      frio: "Riegue por la tarde y cubra almácigos; encienda fogatas de humo antes del amanecer.",
      lluvia_acumulada: "Revise zanjas de drenaje y posponga la siembra y la aplicación de abonos.",
      viento_rachas: "Asegure mallas y techos de cobertizos; recoja la cosecha seca.",
      cambio_temperatura: "Proteja plantones: el choque térmico los debilita.",
    },
  },
  {
    id: "escuela", name: "Escuela rural", who: "Docentes y 120 estudiantes sin calefacción ni refrigeración", emoji: "🏫",
    factors: ["calor", "frio", "lluvia_intensidad", "viento_rachas"],
    stakes: "El clima decide si los niños llegan y si pueden aprender de forma segura.",
    actions: {
      calor: "Adelante el horario, active pausas en sombra y asegure agua segura.",
      frio: "Abrigue a los niños, reciba el desayuno caliente y evite clases al aire libre.",
      lluvia_intensidad: "Coordine con las familias el traslado seguro; evite cruzar quebradas.",
      viento_rachas: "Evalúe suspender actividades en patio y revise techos.",
    },
  },
  {
    id: "salud", name: "Puesto de salud", who: "Personal y pacientes vulnerables (niños, mayores)", emoji: "🏥",
    factors: ["calor", "frio", "lluvia_acumulada", "lluvia_intensidad"],
    stakes: "Olas de frío y calor elevan consultas respiratorias y golpes de calor.",
    actions: {
      calor: "Refuerce hidratación y vigilancia de golpe de calor en mayores y niños.",
      frio: "Active campaña de abrigo y vigilancia de infecciones respiratorias agudas.",
      lluvia_acumulada: "Asegure el stock de medicamentos y la ruta de acceso ante deslizamientos.",
      lluvia_intensidad: "Prepare el plan de contingencia para derrumbes y huaicos.",
    },
  },
  {
    id: "pesca", name: "Pesca artesanal", who: "Pescadores y acuicultores del litoral y del Titicaca", emoji: "🎣",
    factors: ["viento_rachas", "lluvia_intensidad", "caida_presion"],
    stakes: "Salir al mar con oleaje o ráfagas fuertes es una de las mayores causas de accidentes.",
    actions: {
      viento_rachas: "No zarpe: ráfagas peligrosas para embarcaciones pequeñas. Amarre y asegure redes.",
      lluvia_intensidad: "Reduzca visibilidad: salga solo con radio/GPS y avise a la capitanía.",
      caida_presion: "Posible cambio brusco de tiempo: regrese temprano y vigile el cielo.",
    },
  },
];

/* ---------- Escenarios de demostración (no son datos en vivo) ---------- */

export type ScenarioId = "live" | "helada" | "lluvias" | "calor";

export const SCENARIOS: { id: ScenarioId; label: string; hint: string; plain?: string; ours?: string }[] = [
  { id: "live", label: "Datos en vivo", hint: "Open-Meteo para el lugar elegido" },
  { id: "helada", label: "Helada altoandina", hint: "Noche de -16 °C en el altiplano", plain: "Mínima de -16 °C, cielo despejado.", ours: "Helada severa esta noche: cubra los almácigos y riegue por la tarde." },
  { id: "lluvias", label: "Lluvias intensas", hint: "Evento tipo El Niño costero", plain: "Lluvia de 78 mm, ráfagas de 62 km/h.", ours: "Riesgo de huaico: evite quebradas, asegure la ruta al puesto de salud y no zarpe." },
  { id: "calor", label: "Ola de calor", hint: "Sensación térmica de 41 °C", plain: "Máxima de 41 °C, soleado.", ours: "Calor extremo: adelante el horario escolar y vigile golpes de calor en mayores." },
];

const RULE: Record<string, { label: string; unit: string; dir: "ge" | "le"; t: [number, number, number] }> = {
  calor: { label: "Estrés térmico", unit: "°C", dir: "ge", t: [32, 39, 51] },
  frio: { label: "Frío extremo", unit: "°C", dir: "le", t: [-5, -15, -30] },
  lluvia_intensidad: { label: "Intensidad de lluvia", unit: "mm/h", dir: "ge", t: [2.5, 7.6, 50] },
  lluvia_acumulada: { label: "Lluvia acumulada (24 h)", unit: "mm", dir: "ge", t: [25, 50, 100] },
  viento_rachas: { label: "Rachas de viento", unit: "km/h", dir: "ge", t: [50, 75, 100] },
  cambio_temperatura: { label: "Cambio brusco de temperatura (6 h)", unit: "°C", dir: "ge", t: [8, 12, 16] },
  caida_presion: { label: "Caída de presión (3 h)", unit: "hPa", dir: "ge", t: [3.6, 6, 10] },
};
const COLORS: RiskColor[] = ["green", "yellow", "orange", "red"];
const NAMES = ["Bajo", "Moderado", "Alto", "Crítico"];

function factor(id: string, value: number): RiskFactor {
  const r = RULE[id];
  const hit = (th: number) => (r.dir === "ge" ? value >= th : value <= th);
  const level = hit(r.t[2]) ? 3 : hit(r.t[1]) ? 2 : hit(r.t[0]) ? 1 : 0;
  return {
    id, label: r.label, evaluated: true, level, level_name: NAMES[level], color: COLORS[level], value, unit: r.unit,
    when: null, thresholds: { moderado: r.t[0], alto: r.t[1], critico: r.t[2] }, explanation: "",
  };
}

const SCENARIO_VALUES: Record<Exclude<ScenarioId, "live">, Record<string, number>> = {
  helada: { calor: 14, frio: -16, lluvia_intensidad: 0, lluvia_acumulada: 0, viento_rachas: 38, cambio_temperatura: 11, caida_presion: 1.2 },
  lluvias: { calor: 24, frio: 14, lluvia_intensidad: 12, lluvia_acumulada: 78, viento_rachas: 62, cambio_temperatura: 5, caida_presion: 7.1 },
  calor: { calor: 41, frio: 22, lluvia_intensidad: 0, lluvia_acumulada: 0, viento_rachas: 28, cambio_temperatura: 9, caida_presion: 1.0 },
};

export function scenarioRisk(id: Exclude<ScenarioId, "live">): RiskAssessment {
  const factors = Object.entries(SCENARIO_VALUES[id]).map(([k, v]) => factor(k, v));
  const top = Math.max(...factors.map((f) => f.level));
  return {
    level: top, level_name: NAMES[top], color: COLORS[top], summary: "Escenario de demostración", drivers: [],
    factors, horizon_hours: 24, evaluated_factors: factors.length, kind: "demo", methodology_version: "demo", disclaimer: "",
  };
}

/* ---------- Traducción riesgo → alerta para un perfil ---------- */

export interface ProfileAlert {
  level: number;
  levelName: string;
  color: RiskColor;
  hits: { factor: RiskFactor; action: string }[];
  message: string;
}

export function alertFor(profile: Profile, risk: RiskAssessment): ProfileAlert {
  const mine = risk.factors.filter((f) => f.evaluated && profile.factors.includes(f.id));
  const level = Math.max(0, ...mine.map((f) => f.level));
  const hits = mine
    .filter((f) => f.level >= 1)
    .sort((a, b) => b.level - a.level)
    .slice(0, 3)
    .map((f) => ({ factor: f, action: profile.actions[f.id] ?? "" }));
  const header =
    level === 0 ? "✅ Sin riesgos para su actividad en las próximas 24 h."
      : `${level >= 3 ? "🔴" : level === 2 ? "🟠" : "🟡"} Alerta ${NAMES[level].toUpperCase()} · ${profile.name}`;
  const lines = hits.map((h) => `• ${h.factor.label}: ${h.factor.value}${h.factor.unit === "°C" ? " °C" : " " + h.factor.unit}. ${h.action}`);
  return {
    level, levelName: NAMES[level], color: COLORS[level], hits,
    message: [header, ...lines, level > 0 ? "Indicador experimental. Siga las alertas oficiales de SENAMHI/INDECI." : ""].filter(Boolean).join("\n"),
  };
}
