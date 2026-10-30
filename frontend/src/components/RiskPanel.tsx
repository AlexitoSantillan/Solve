import { AlertTriangle, ShieldCheck } from "lucide-react";
import { dateTime } from "../lib/format";
import type { RiskAssessment, RiskFactor } from "../types";
import { Skeleton } from "./Common";

export function LevelBadge({ name, color }: { name: string; color: string }) {
  return <span className={`badge lvl-${color}`}>{name}</span>;
}

function LevelMeter({ level, color }: { level: number; color: string }) {
  return (
    <div className={`meter lvl-${color}`} aria-hidden>
      {[0, 1, 2, 3].map((i) => <span key={i} className={i <= level ? "on" : ""} />)}
    </div>
  );
}

export function FactorRow({ f, detailed = false }: { f: RiskFactor; detailed?: boolean }) {
  return (
    <li className={`factor ${f.evaluated ? "" : "is-off"}`}>
      <div className="factor-top">
        <span className="factor-name">{f.label}</span>
        {f.evaluated ? <LevelBadge name={f.level_name} color={f.color} /> : <span className="badge badge-off">No evaluado</span>}
      </div>
      <LevelMeter level={f.evaluated ? f.level : -1} color={f.color} />
      <p>{f.explanation}</p>
      {detailed && f.evaluated && (
        <p className="factor-thresholds">
          Umbrales: moderado {f.thresholds.moderado} · alto {f.thresholds.alto} · crítico {f.thresholds.critico} {f.unit}
          {f.when ? ` · pico: ${dateTime(f.when)}` : ""}
        </p>
      )}
    </li>
  );
}

export function RiskPanel({ risk, compact = false }: { risk: RiskAssessment | null; compact?: boolean }) {
  if (!risk) return <Skeleton height={compact ? 260 : 320} />;
  const shown = compact ? [...risk.factors].filter((f) => f.evaluated).sort((a, b) => b.level - a.level).slice(0, 4) : risk.factors;
  return (
    <div className="risk">
      <div className={`risk-summary lvl-${risk.color}`}>
        <div className="risk-icon">{risk.level >= 2 ? <AlertTriangle size={26} aria-hidden /> : <ShieldCheck size={26} aria-hidden />}</div>
        <div>
          <div className="risk-label">Indicador experimental · próximas {risk.horizon_hours} h</div>
          <div className="risk-level">Riesgo {risk.level_name.toLowerCase()}</div>
          <p>{risk.summary}</p>
        </div>
      </div>
      <ul className="factors">{shown.map((f) => <FactorRow key={f.id} f={f} detailed={!compact} />)}</ul>
      <p className="disclaimer">{risk.disclaimer}</p>
    </div>
  );
}
