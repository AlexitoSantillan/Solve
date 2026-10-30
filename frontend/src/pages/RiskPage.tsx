import { BarChart3, BookOpenCheck, Cpu, ShieldCheck } from "lucide-react";
import { ErrorBox, Panel, Skeleton } from "../components/Common";
import { RiskPanel } from "../components/RiskPanel";
import { useAnomaly, useMethodology } from "../hooks/useAnomaly";
import { fmt } from "../lib/format";
import type { AnomalyVariable, DashboardData, Place } from "../types";

function PercentileBar({ v }: { v: AnomalyVariable }) {
  const p = v.percentile ?? 0;
  const tone = v.direction === "normal" ? "ok" : "warn";
  return (
    <div className={`pbar tone-${tone}`} aria-hidden>
      <span className="pbar-zone" />
      <span className="pbar-marker" style={{ left: `${Math.min(100, Math.max(0, p))}%` }} />
    </div>
  );
}

export function RiskPage({ place, data, error, onRetry }: {
  place: Place;
  data: DashboardData | null;
  error: string | null;
  onRetry: () => void;
}) {
  const anomaly = useAnomaly(place);
  const method = useMethodology();

  return (
    <div className="page">
      {error && <ErrorBox message={error} onRetry={onRetry} />}

      <div className="notice">
        <ShieldCheck size={18} aria-hidden />
        <p><strong>Indicador experimental, no alerta oficial.</strong> Las alertas oficiales las emite la autoridad meteorológica
          de cada país. Este indicador usa reglas por umbrales sobre un modelo numérico y puede equivocarse.</p>
      </div>

      <Panel title={`Análisis de riesgo: ${place.name}`} subtitle="Siete factores evaluados sobre las próximas 24 horas" icon={<ShieldCheck size={18} aria-hidden />}>
        <RiskPanel risk={data?.risk ?? null} />
      </Panel>

      <Panel title="¿Es inusual para esta época?" subtitle="Comparación de hoy con ~10 años de climatología del mismo punto" icon={<BarChart3 size={18} aria-hidden />}>
        {anomaly.error && <ErrorBox message={anomaly.error} onRetry={anomaly.retry} />}
        {anomaly.loading && !anomaly.data && <Skeleton height={200} />}
        {anomaly.data && (
          <>
            <div className="anomaly-grid">
              {anomaly.data.report.variables.map((v) => (
                <article key={v.id} className={`anomaly ${v.direction && v.direction !== "normal" ? "is-flagged" : ""}`}>
                  <header><span>{v.label}</span></header>
                  {v.available ? (
                    <>
                      <div className="anomaly-value">{fmt(v.value)}<small>{v.unit}</small></div>
                      <PercentileBar v={v} />
                      <p>Percentil {fmt(v.percentile, 0)} · media histórica {fmt(v.mean)} {v.unit}
                        {typeof v.z_score === "number" ? ` · z = ${fmt(v.z_score, 1)}` : ""}</p>
                      <p className="anomaly-status">{v.status}</p>
                    </>
                  ) : <p>{v.reason ?? "No disponible"}</p>}
                </article>
              ))}
            </div>
            <ul className="limits">
              {anomaly.data.method.limitations.map((l) => <li key={l}>{l}</li>)}
            </ul>
          </>
        )}
      </Panel>

      <Panel title="Estado del componente de inteligencia artificial" subtitle="Declaración transparente" icon={<Cpu size={18} aria-hidden />}>
        <div className="ai-status">
          <p><strong>Hoy:</strong> el nivel de riesgo se calcula con reglas por umbrales y la comparación con la climatología con estadística
            descriptiva (percentiles y z-score). <strong>No hay un modelo de aprendizaje automático entrenado</strong> en esta versión.</p>
          <p><strong>Siguiente paso previsto:</strong> entrenar y evaluar un detector de anomalías multivariable con datos históricos,
            reportando métricas (precisión, falsos positivos) antes de presentarlo como IA.</p>
        </div>
      </Panel>

      <Panel title="Reglas y umbrales vigentes" subtitle={method.data ? `Versión ${method.data.version}` : "Metodología documentada"} icon={<BookOpenCheck size={18} aria-hidden />}>
        {method.error && <ErrorBox message={method.error} />}
        {method.loading && <Skeleton height={160} />}
        {method.data && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Factor</th><th>Moderado</th><th>Alto</th><th>Crítico</th><th>Base del umbral</th></tr>
              </thead>
              <tbody>
                {method.data.rules.map((r) => (
                  <tr key={r.id}>
                    <td>{r.label}</td>
                    <td>{r.direction === "ge" ? "≥" : "≤"} {r.moderate} {r.unit}</td>
                    <td>{r.direction === "ge" ? "≥" : "≤"} {r.high} {r.unit}</td>
                    <td>{r.direction === "ge" ? "≥" : "≤"} {r.critical} {r.unit}</td>
                    <td className="basis">{r.basis}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
