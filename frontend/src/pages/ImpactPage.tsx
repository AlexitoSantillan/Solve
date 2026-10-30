import { Banknote, Bot, CalendarRange, Compass, Gauge, HeartHandshake, ShieldAlert, Sprout, Target } from "lucide-react";
import type { ReactNode } from "react";
import { Panel } from "../components/Common";

const FOCUS: { icon: ReactNode; title: string; text: string; main?: boolean }[] = [
  { icon: <ShieldAlert size={20} aria-hidden />, title: "Proteger a personas y servicios", text: "Alertas por helada, lluvias intensas y calor para familias, escuelas y puestos de salud.", main: true },
  { icon: <Sprout size={20} aria-hidden />, title: "Agroalimentación resiliente", text: "Decisiones de siembra, riego y cosecha según el riesgo local, para proteger cultivos andinos.", main: true },
  { icon: <Compass size={20} aria-hidden />, title: "Océanos y costas", text: "Alertas de viento y oleaje para la pesca artesanal (fase 2)." },
  { icon: <Gauge size={20} aria-hidden />, title: "Ciudades resilientes", text: "Riesgo por barrio para planificación municipal (fase 3)." },
];

const KPIS = [
  { v: "5 000", l: "hogares alcanzados en el piloto de 12 meses" },
  { v: "3", l: "regiones: Puno, Cusco y Piura" },
  { v: "< 1 USD", l: "costo estimado por hogar al año" },
  { v: "≥ 70 %", l: "meta de aciertos en eventos extremos, con falsas alarmas medidas" },
];

const MODEL = [
  { who: "Familias y escuelas", price: "Gratis", how: "Subvencionado por municipios y cooperación. Alertas por WhatsApp/SMS." },
  { who: "Municipios y gobiernos regionales", price: "Suscripción anual", how: "Panel de riesgo por distrito, reportes y planes de contingencia." },
  { who: "Cooperativas, aseguradoras y ONG", price: "API / licencia", how: "Datos de riesgo para seguros paramétricos y programas de adaptación." },
];

const AI_ROWS = [
  { part: "Indicador de riesgo", now: "Reglas por umbrales documentados", next: "Umbrales locales por percentil y perfil" },
  { part: "Anomalías", now: "Percentil y z-score frente a ~10 años de ERA5", next: "Modelo de detección entrenado con métricas (POD, FAR)" },
  { part: "Asistente", now: "Mensajes con plantillas por perfil", next: "LLM anclado en los datos, en lenguaje sencillo y lenguas locales" },
];

const ROADMAP = [
  { when: "Oct – Nov 2026", what: "Prototipo y postulación a MIT Solve" },
  { when: "Dic 2026 – Feb 2027", what: "Validación con eventos históricos y entrevistas a usuarios" },
  { when: "Mar – Ago 2027", what: "Piloto con 3 comunidades y un municipio aliado" },
  { when: "Sep 2027 →", what: "Escalado regional y modelo de ingresos" },
];

export function ImpactPage() {
  return (
    <div className="page">
      <section className="hero hero-solo">
        <div>
          <span className="eyebrow">MIT Solve · 2027 Global Climate Challenge</span>
          <h2>¿Cómo adaptarnos de forma equitativa a un clima más cálido?</h2>
          <p>Las comunidades andinas enfrentan heladas, lluvias y sequías con pocos recursos y sin información que puedan usar.
            ClimaGuard convierte datos climáticos abiertos en <strong>alertas accionables, de bajo costo y con IA transparente</strong>,
            diseñadas para funcionar dentro de los sistemas y presupuestos que ya existen.</p>
        </div>
      </section>

      <Panel title="Encaje con las prioridades de Solve" icon={<Target size={18} aria-hidden />}>
        <div className="cards-4">
          {FOCUS.map((f) => (
            <article key={f.title} className={`card ${f.main ? "is-main" : ""}`}>
              <span className="card-icon">{f.icon}</span>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
              {f.main && <span className="tag">Foco del piloto</span>}
            </article>
          ))}
        </div>
        <div className="sdg">
          {["ODS 13 Acción por el clima", "ODS 2 Hambre cero", "ODS 1 Fin de la pobreza", "ODS 11 Ciudades sostenibles"].map((s) => <span key={s} className="chip">{s}</span>)}
        </div>
      </Panel>

      <Panel title="Metas del piloto" subtitle="Objetivos a validar, no resultados obtenidos" icon={<HeartHandshake size={18} aria-hidden />}>
        <div className="kpis">{KPIS.map((k) => <div key={k.l}><strong>{k.v}</strong><span>{k.l}</span></div>)}</div>
      </Panel>

      <div className="grid-2 even">
        <Panel title="Sostenibilidad financiera" subtitle="Hipótesis de modelo de ingresos, por validar" icon={<Banknote size={18} aria-hidden />}>
          <ul className="model">
            {MODEL.map((m) => (
              <li key={m.who}><div><strong>{m.who}</strong><span className="tag">{m.price}</span></div><p>{m.how}</p></li>
            ))}
          </ul>
        </Panel>
        <Panel title="IA transparente y honesta" subtitle="Qué es hoy y qué construiremos" icon={<Bot size={18} aria-hidden />}>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Componente</th><th>Hoy</th><th>Siguiente paso</th></tr></thead>
              <tbody>{AI_ROWS.map((r) => <tr key={r.part}><td><strong>{r.part}</strong></td><td>{r.now}</td><td>{r.next}</td></tr>)}</tbody>
            </table>
          </div>
          <p className="disclaimer">Hoy no hay un modelo de aprendizaje automático entrenado. Solo lo llamaremos IA cuando tenga métricas publicadas.</p>
        </Panel>
      </div>

      <Panel title="Hoja de ruta" icon={<CalendarRange size={18} aria-hidden />}>
        <ol className="roadmap">
          {ROADMAP.map((r, i) => <li key={r.when} className={i === 0 ? "is-now" : ""}><span>{r.when}</span><p>{r.what}</p></li>)}
        </ol>
      </Panel>
    </div>
  );
}
