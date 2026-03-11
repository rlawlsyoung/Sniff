type DashboardStatsProps = {
  fileCount: number;
  scenarioTotal: number;
  todo: number;
  passed: number;
  failed: number;
};

export function DashboardStats({
  fileCount,
  scenarioTotal,
  todo,
  passed,
  failed,
}: DashboardStatsProps) {
  const passRate =
    scenarioTotal > 0 ? Math.round((passed / scenarioTotal) * 100) : 0;

  return (
    <section className="grid gap-4 [animation:fade-up_420ms_ease-out_40ms_both] sm:grid-cols-2 lg:grid-cols-6">
      <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 shadow-[0_12px_28px_rgba(0,0,0,0.25)] backdrop-blur-xl">
        <p className="text-xs font-semibold tracking-[0.1em] text-slate-300">
          Feature 파일
        </p>
        <p className="mt-2 text-3xl font-semibold text-white">{fileCount}</p>
      </article>
      <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 shadow-[0_12px_28px_rgba(0,0,0,0.25)] backdrop-blur-xl">
        <p className="text-xs font-semibold tracking-[0.1em] text-slate-300">
          시나리오
        </p>
        <p className="mt-2 text-3xl font-semibold text-white">
          {scenarioTotal}
        </p>
      </article>
      <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 shadow-[0_12px_28px_rgba(0,0,0,0.25)] backdrop-blur-xl">
        <p className="text-xs font-semibold tracking-[0.1em] text-slate-300">
          미실행
        </p>
        <p className="mt-2 text-3xl font-semibold text-slate-100">{todo}</p>
      </article>
      <article className="rounded-2xl border border-emerald-300/30 bg-emerald-300/10 p-4 shadow-[0_12px_28px_rgba(0,0,0,0.25)] backdrop-blur-xl">
        <p className="text-xs font-semibold tracking-[0.1em] text-emerald-200">
          통과
        </p>
        <p className="mt-2 text-3xl font-semibold text-emerald-100">{passed}</p>
      </article>
      <article className="rounded-2xl border border-rose-300/30 bg-rose-300/10 p-4 shadow-[0_12px_28px_rgba(0,0,0,0.25)] backdrop-blur-xl">
        <p className="text-xs font-semibold tracking-[0.1em] text-rose-200">
          실패
        </p>
        <p className="mt-2 text-3xl font-semibold text-rose-100">{failed}</p>
      </article>
      <article className="rounded-2xl border border-cyan-300/30 bg-cyan-300/10 p-4 shadow-[0_12px_28px_rgba(0,0,0,0.25)] backdrop-blur-xl">
        <p className="text-xs font-semibold tracking-[0.1em] text-cyan-100">
          Pass Rate
        </p>
        <p className="mt-2 text-3xl font-semibold text-cyan-50">{passRate}%</p>
      </article>
    </section>
  );
}
