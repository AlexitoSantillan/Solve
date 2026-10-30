/* Datos DE DEMOSTRACIÓN para el prototipo. No son mediciones ni resultados reales. */

export interface Community {
  name: string;
  region: string;
  lat: number;
  lon: number;
  households: number;
  profile: "agricultor" | "escuela" | "salud" | "pesca";
  level: 0 | 1 | 2 | 3;
  hazard: string;
}

export const COMMUNITIES: Community[] = [
  { name: "Macusani", region: "Puno", lat: -14.07, lon: -70.43, households: 420, profile: "agricultor", level: 3, hazard: "Helada" },
  { name: "Ilave", region: "Puno", lat: -16.08, lon: -69.64, households: 610, profile: "agricultor", level: 2, hazard: "Helada" },
  { name: "Chumbivilcas", region: "Cusco", lat: -14.28, lon: -72.07, households: 380, profile: "escuela", level: 2, hazard: "Frío" },
  { name: "Huancavelica", region: "Huancavelica", lat: -12.78, lon: -74.97, households: 540, profile: "salud", level: 2, hazard: "Heladas / IRA" },
  { name: "Chivay", region: "Arequipa", lat: -15.64, lon: -71.6, households: 300, profile: "agricultor", level: 1, hazard: "Viento" },
  { name: "Sechura", region: "Piura", lat: -5.56, lon: -80.82, households: 720, profile: "pesca", level: 2, hazard: "Oleaje / viento" },
  { name: "Tumbes", region: "Tumbes", lat: -3.57, lon: -80.45, households: 460, profile: "salud", level: 1, hazard: "Lluvia" },
  { name: "Tarma", region: "Junín", lat: -11.42, lon: -75.69, households: 350, profile: "escuela", level: 0, hazard: "—" },
  { name: "Ayacucho", region: "Ayacucho", lat: -13.16, lon: -74.22, households: 500, profile: "agricultor", level: 1, hazard: "Lluvia" },
];

export const LEVEL_COLORS = ["#22c55e", "#facc15", "#fb923c", "#ef4444"];
export const LEVEL_NAMES = ["Bajo", "Moderado", "Alto", "Crítico"];
