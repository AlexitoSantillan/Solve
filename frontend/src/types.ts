export interface Place {
  name: string;
  region?: string;
  country?: string;
  latitude: number;
  longitude: number;
  /** "click" = elegido en el mapa (no se recentra el mapa). */
  origin?: "default" | "search" | "click";
}

export type RiskColor = "green" | "yellow" | "orange" | "red";

export interface RiskFactor {
  id: string;
  label: string;
  evaluated: boolean;
  level: number;
  level_name: string;
  color: RiskColor;
  value: number | null;
  unit: string;
  when: string | null;
  thresholds: { moderado: number; alto: number; critico: number };
  explanation: string;
}

export interface RiskAssessment {
  level: number;
  level_name: string;
  color: RiskColor;
  summary: string;
  drivers: string[];
  factors: RiskFactor[];
  horizon_hours: number;
  evaluated_factors: number;
  kind: string;
  methodology_version: string;
  disclaimer: string;
}

export interface Current {
  time: string | null;
  temperature: number | null;
  apparent: number | null;
  humidity: number | null;
  precipitation: number | null;
  wind_speed: number | null;
  wind_direction: number | null;
  wind_gusts: number | null;
  pressure: number | null;
  cloud_cover: number | null;
  weather_code: number | null;
  is_day: boolean;
}

export interface HourlyRow {
  time: string;
  temperature: number | null;
  apparent: number | null;
  precipitation: number | null;
  precipitation_probability: number | null;
  wind_speed: number | null;
  wind_gusts: number | null;
  pressure: number | null;
  humidity: number | null;
}

export interface DailyRow {
  date: string;
  weather_code: number | null;
  temp_max: number | null;
  temp_min: number | null;
  precipitation_sum: number | null;
  precipitation_probability_max: number | null;
  wind_speed_max: number | null;
  uv_index_max: number | null;
}

export interface SourceInfo {
  name: string;
  url: string;
  license: string;
}

export interface DashboardData {
  location: { latitude: number; longitude: number; timezone: string; elevation: number | null };
  generated_at: string;
  source: SourceInfo;
  current: Current;
  hourly: HourlyRow[];
  daily: DailyRow[];
  risk: RiskAssessment;
}

export interface AnomalyVariable {
  id: string;
  label: string;
  unit: string;
  available: boolean;
  reason?: string;
  value?: number;
  percentile?: number;
  mean?: number;
  std?: number;
  z_score?: number | null;
  samples?: number;
  status?: string;
  direction?: "alto" | "bajo" | "normal";
}

export interface AnomalyData {
  generated_at: string;
  report: { date: string; variables: AnomalyVariable[]; flagged: string[]; window_days: number };
  method: {
    kind: string;
    is_machine_learning: boolean;
    description: string;
    reference_data: string;
    limitations: string[];
  };
  source: SourceInfo;
}

export interface GridPoint {
  latitude: number;
  longitude: number;
  temperature: number;
  precipitation: number;
  wind_speed: number;
  wind_direction: number | null;
  time: string | null;
  name?: string;
  rank?: number;
}

export interface GridData {
  bbox: { south: number; west: number; north: number; east: number };
  points: GridPoint[];
  data_time_utc: string | null;
  generated_at: string;
  source: SourceInfo;
  note: string;
}

export interface MethodologyRule {
  id: string;
  label: string;
  unit: string;
  direction: "ge" | "le";
  moderate: number;
  high: number;
  critical: number;
  basis: string;
}

export interface Methodology {
  version: string;
  disclaimer: string;
  rules: MethodologyRule[];
}

export interface Bounds {
  south: number;
  west: number;
  north: number;
  east: number;
}

/** Campo global (cada `step` grados) para colorear el globo; null = sin dato. */
export interface FieldData {
  lat0: number;
  lon0: number;
  step: number;
  rows: number;
  cols: number;
  temperature: (number | null)[][];
  precipitation: (number | null)[][];
  wind_speed: (number | null)[][];
  generated_at: string;
  source: SourceInfo;
  note: string;
}
