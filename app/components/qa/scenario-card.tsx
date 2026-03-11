import { QaScenario, ScenarioStatus } from "../../lib/gherkin";

const STATUS_LABELS: Record<ScenarioStatus, string> = {
  todo: "미실행",
  passed: "통과",
  failed: "실패",
};

const STATUS_BUTTON_STYLES: Record<ScenarioStatus, string> = {
  todo: "border-slate-500/70 text-slate-300 hover:border-slate-300",
  passed: "border-emerald-400/50 text-emerald-300 hover:border-emerald-300",
  failed: "border-rose-400/50 text-rose-300 hover:border-rose-300",
};

type ScenarioCardProps = {
  scenario: QaScenario;
  onStatusChange: (id: string, status: ScenarioStatus) => void;
  onNoteChange: (id: string, note: string) => void;
};

export function ScenarioCard({
  scenario,
  onStatusChange,
  onNoteChange,
}: ScenarioCardProps) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_14px_32px_rgba(0,0,0,0.28)] backdrop-blur-xl">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-cyan-300/35 bg-cyan-300/15 px-3 py-1 text-xs font-semibold text-cyan-100">
          {scenario.feature}
        </span>
        <span className="rounded-full border border-white/20 bg-black/30 px-3 py-1 text-xs text-slate-300">
          {new Date(scenario.createdAt).toLocaleString()}
        </span>
      </div>

      <h3 className="mt-3 text-lg font-semibold text-white">
        {scenario.title}
      </h3>

      {scenario.tags.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {scenario.tags.map((tag) => (
            <span
              key={`${scenario.id}-${tag}`}
              className="rounded-full border border-blue-200/25 bg-blue-300/15 px-2.5 py-1 text-xs font-medium text-blue-100"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      {scenario.steps.length > 0 ? (
        <ul className="mt-3 space-y-1 rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-slate-200">
          {scenario.steps.map((step, index) => (
            <li key={`${scenario.id}-step-${index}`}>{step}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-slate-400">등록된 Step이 없습니다.</p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {(["todo", "passed", "failed"] as ScenarioStatus[]).map((status) => (
          <button
            key={`${scenario.id}-${status}`}
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
              scenario.status === status
                ? status === "todo"
                  ? "border-slate-200/80 bg-slate-200 text-slate-900"
                  : status === "passed"
                    ? "border-emerald-300/80 bg-emerald-300 text-emerald-950"
                    : "border-rose-300/80 bg-rose-300 text-rose-950"
                : STATUS_BUTTON_STYLES[status]
            }`}
            onClick={() => onStatusChange(scenario.id, status)}
          >
            {STATUS_LABELS[status]}
          </button>
        ))}
      </div>

      <textarea
        className="mt-3 h-24 w-full resize-y rounded-xl border border-white/15 bg-black/35 p-3 text-sm text-slate-100 outline-none ring-cyan-300/25 placeholder:text-slate-500 focus:border-cyan-300/60 focus:ring-4"
        placeholder="실행 로그/이슈 메모"
        value={scenario.note}
        onChange={(event) => onNoteChange(scenario.id, event.target.value)}
      />
    </article>
  );
}
