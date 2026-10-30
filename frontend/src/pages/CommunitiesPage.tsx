import { CheckCheck, MapPinned, MessageCircle, Radio, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import { Panel } from "../components/Common";
import { COMMUNITIES, LEVEL_COLORS, LEVEL_NAMES } from "../lib/demoData";
import { PROFILES, SCENARIOS, alertFor, scenarioRisk } from "../lib/community";
import type { ProfileId, ScenarioId } from "../lib/community";
import type { DashboardData, Place } from "../types";

export function CommunitiesPage({ place, data }: { place: Place; data: DashboardData | null }) {
  const [scenario, setScenario] = useState<ScenarioId>("helada");
  const [profileId, setProfileId] = useState<ProfileId>("agricultor");
  const profile = PROFILES.find((p) => p.id === profileId)!;

  const live = scenario === "live";
  const risk = useMemo(() => (live ? data?.risk ?? null : scenarioRisk(scenario)), [live, data, scenario]);
  const sc = SCENARIOS.find((x) => x.id === scenario)!;
  const alert = risk ? alertFor(profile, risk) : null;

  const exposed = COMMUNITIES.filter((c) => c.level >= 2).reduce((s, c) => s + c.households, 0);
  const total = COMMUNITIES.reduce((s, c) => s + c.households, 0);

  return (
    <div className="page">
      <section className="hero">
        <div>
          <span className="eyebrow">Prototipo · MIT Solve 2027 Global Climate Challenge</span>
          <h2>Del pronóstico a la decisión: alertas que cada comunidad entiende y puede usar</h2>
          <p>El mismo evento climático afecta distinto a una familia agricultora, a una escuela o a un puesto de salud.
            ClimaGuard traduce el riesgo en <strong>qué está en juego</strong> y <strong>qué hacer</strong>, y lo envía por el canal que la gente ya usa.</p>
        </div>
        <div className="hero-stats">
          <div><strong>{total.toLocaleString("es-PE")}</strong><span>hogares en el piloto (demo)</span></div>
          <div><strong>{exposed.toLocaleString("es-PE")}</strong><span>con riesgo alto o crítico hoy</span></div>
        </div>
      </section>

      <Panel title="Escenario" subtitle="Elija un evento para ver cómo cambia la alerta (los escenarios son simulaciones)" icon={<Radio size={18} aria-hidden />}>
        <div className="tabs" role="tablist" aria-label="Escenario">
          {SCENARIOS.map((s) => (
            <button key={s.id} role="tab" aria-selected={scenario === s.id} className={scenario === s.id ? "is-active" : ""}
              onClick={() => setScenario(s.id)} title={s.hint}>{s.label}</button>
          ))}
        </div>
        <p className="muted">{live ? `Datos en vivo de Open-Meteo para ${place.name}.` : SCENARIOS.find((s) => s.id === scenario)?.hint + " · Escenario de demostración."}</p>
      </Panel>

      <div className="profiles" role="radiogroup" aria-label="Perfil de usuario">
        {PROFILES.map((p) => {
          const a = risk ? alertFor(p, risk) : null;
          return (
            <button key={p.id} role="radio" aria-checked={p.id === profileId} onClick={() => setProfileId(p.id)}
              className={`profile ${p.id === profileId ? "is-active" : ""} ${a ? `lvl-${a.color}` : ""}`}>
              <span className="profile-emoji" aria-hidden>{p.emoji}</span>
              <strong>{p.name}</strong>
              <small>{p.who}</small>
              {a && <span className={`badge lvl-${a.color}`}>{a.levelName}</span>}
            </button>
          );
        })}
      </div>

      <div className="grid-2">
        <Panel title={`Qué significa para: ${profile.name}`} subtitle={profile.stakes} icon={<Users size={18} aria-hidden />}>
          {!alert && <p className="muted">Sin datos en vivo disponibles. Elija un escenario de demostración.</p>}
          {alert && alert.hits.length === 0 && <div className="risk-summary lvl-green"><div><div className="risk-level">Sin riesgos para su actividad</div><p>Ningún factor relevante supera los umbrales en las próximas 24 h.</p></div></div>}
          {alert && alert.hits.length > 0 && (
            <ul className="actions">
              {alert.hits.map((h) => (
                <li key={h.factor.id} className={`lvl-${h.factor.color}`}>
                  <div className="factor-top">
                    <span className="factor-name">{h.factor.label}: {h.factor.value} {h.factor.unit}</span>
                    <span className={`badge lvl-${h.factor.color}`}>{h.factor.level_name}</span>
                  </div>
                  <p><strong>Qué hacer:</strong> {h.action}</p>
                </li>
              ))}
            </ul>
          )}
          {sc.plain && (
            <div className="compare">
              <div><span>Pronóstico tradicional</span><p>“{sc.plain}”</p></div>
              <div className="is-us"><span>ClimaGuard</span><p>“{sc.ours}”</p></div>
            </div>
          )}
        </Panel>

        <Panel title="Alerta en el celular" subtitle="Vista previa de la alerta por WhatsApp/SMS (simulada)" icon={<MessageCircle size={18} aria-hidden />}>
          <div className="phone" aria-label="Vista previa de WhatsApp">
            <div className="phone-bar"><span className="avatar">CG</span><div><strong>ClimaGuard Alertas</strong><small>en línea</small></div></div>
            <div className="phone-body">
              <div className="bubble"><pre>{alert?.message ?? "Sin datos."}</pre><span className="time">6:00 <CheckCheck size={13} aria-hidden /></span></div>
              <div className="bubble out"><span>Recibido, gracias</span></div>
            </div>
          </div>
        </Panel>
      </div>

      <Panel title="Comunidades del piloto" subtitle="Ubicaciones ilustrativas y hogares simulados; el color es el nivel de riesgo del escenario de demostración" icon={<MapPinned size={18} aria-hidden />}>
        <div className="map-frame">
          <MapContainer center={[-11, -75]} zoom={5} style={{ height: 420 }} scrollWheelZoom={false}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="&copy; OpenStreetMap contributors &copy; CARTO" />
            {COMMUNITIES.map((c) => (
              <CircleMarker key={c.name} center={[c.lat, c.lon]} radius={8 + Math.sqrt(c.households) / 4}
                pathOptions={{ color: "#fff", weight: 1.5, fillColor: LEVEL_COLORS[c.level], fillOpacity: 0.85 }}>
                <Popup><strong>{c.name}</strong> · {c.region}<br />{c.households} hogares<br />Riesgo: {LEVEL_NAMES[c.level]} ({c.hazard})</Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
        <div className="legend-levels">
          {LEVEL_NAMES.map((n, i) => <span key={n} className="chip"><i style={{ background: LEVEL_COLORS[i] }} />{n}</span>)}
        </div>
      </Panel>
    </div>
  );
}
