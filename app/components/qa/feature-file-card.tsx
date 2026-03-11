import Link from "next/link";
import { QaFeatureFile, getScenarioStats } from "../../lib/gherkin";

type FeatureFileCardProps = {
  featureFile: QaFeatureFile;
  onDelete: (id: string) => void;
};

export function FeatureFileCard({
  featureFile,
  onDelete,
}: FeatureFileCardProps) {
  const stats = getScenarioStats(featureFile.scenarios);

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_14px_32px_rgba(0,0,0,0.28)] backdrop-blur-xl">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-lg font-semibold text-white">
          {featureFile.fileName}
        </h3>
        <span className="rounded-full border border-white/20 bg-black/25 px-2.5 py-1 text-xs text-slate-300">
          {new Date(featureFile.updatedAt).toLocaleString()}
        </span>
      </div>

      <p className="mt-2 text-sm text-slate-300">
        {featureFile.featureNames.join(", ") || "Untitled Feature"}
      </p>

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full border border-white/20 bg-black/25 px-2.5 py-1 text-slate-200">
          전체 {stats.total}
        </span>
        <span className="rounded-full border border-slate-400/40 bg-slate-300/10 px-2.5 py-1 text-slate-200">
          미실행 {stats.todo}
        </span>
        <span className="rounded-full border border-emerald-400/45 bg-emerald-300/10 px-2.5 py-1 text-emerald-200">
          통과 {stats.passed}
        </span>
        <span className="rounded-full border border-rose-400/45 bg-rose-300/10 px-2.5 py-1 text-rose-200">
          실패 {stats.failed}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Link
          href={`/features/${featureFile.id}`}
          className="rounded-full border border-cyan-300/45 bg-cyan-300/10 px-4 py-1.5 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/20"
        >
          상세 보기
        </Link>
        <button
          className="rounded-full border border-rose-300/45 bg-rose-300/10 px-4 py-1.5 text-sm font-semibold text-rose-100 transition hover:bg-rose-300/20"
          onClick={() => onDelete(featureFile.id)}
        >
          삭제
        </button>
      </div>
    </article>
  );
}
