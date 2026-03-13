type ScenarioStatsProps = {
  scenarioTotal: number;
  todo: number;
  passed: number;
  failed: number;
};

export function ScenarioStats({
  scenarioTotal,
  todo,
  passed,
  failed,
}: ScenarioStatsProps) {
  const passRate =
    scenarioTotal > 0 ? Math.round((passed / scenarioTotal) * 100) : 0;

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <article className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 shadow-sm shadow-slate-200/40 dark:shadow-none backdrop-blur-xl">
        <p className="text-xs font-semibold tracking-[0.1em] text-slate-700 dark:text-slate-300">
          시나리오
        </p>
        <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
          {scenarioTotal}
        </p>
      </article>
      <article className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 shadow-sm shadow-slate-200/40 dark:shadow-none backdrop-blur-xl">
        <p className="text-xs font-semibold tracking-[0.1em] text-slate-700 dark:text-slate-300">
          미실행
        </p>
        <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">
          {todo}
        </p>
      </article>
      <article className="rounded-2xl border border-emerald-500/30 dark:border-emerald-300/30 bg-emerald-500/10 dark:bg-emerald-300/10 p-4 shadow-sm shadow-slate-200/40 dark:shadow-none backdrop-blur-xl">
        <p className="text-xs font-semibold tracking-[0.1em] text-emerald-700 dark:text-emerald-200">
          통과
        </p>
        <p className="mt-2 text-3xl font-semibold text-emerald-800 dark:text-emerald-100">
          {passed}
        </p>
      </article>
      <article className="rounded-2xl border border-rose-500/30 dark:border-rose-300/30 bg-rose-500/10 dark:bg-rose-300/10 p-4 shadow-sm shadow-slate-200/40 dark:shadow-none backdrop-blur-xl">
        <p className="text-xs font-semibold tracking-[0.1em] text-rose-700 dark:text-rose-200">
          실패
        </p>
        <p className="mt-2 text-3xl font-semibold text-rose-800 dark:text-rose-100">
          {failed}
        </p>
      </article>
      <article className="rounded-2xl border border-cyan-500/30 dark:border-cyan-300/30 bg-cyan-500/10 dark:bg-cyan-300/10 p-4 shadow-sm shadow-slate-200/40 dark:shadow-none backdrop-blur-xl">
        <p className="text-xs font-semibold tracking-[0.1em] text-cyan-800 dark:text-cyan-100">
          Pass Rate
        </p>
        <p className="mt-2 text-3xl font-semibold text-cyan-900 dark:text-cyan-50">
          {passRate}%
        </p>
      </article>
    </section>
  );
}
