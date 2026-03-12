"use client";

import { KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { QaFeatureFile, getScenarioStats } from "../../lib/gherkin";
import { ChipButton } from "../ui/chip-button";

type FeatureFileCardProps = {
  featureFile: QaFeatureFile;
  onDelete: (id: string) => void;
};

export function FeatureFileCard({
  featureFile,
  onDelete,
}: FeatureFileCardProps) {
  const router = useRouter();
  const stats = getScenarioStats(featureFile.scenarios);

  const onOpenDetail = () => {
    router.push(`/features/${featureFile.id}`);
  };

  const onCardKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpenDetail();
    }
  };

  return (
    <article
      className="cursor-pointer rounded-2xl border border-white/10 bg-white/4 p-5 shadow-[0_14px_32px_rgba(0,0,0,0.28)] backdrop-blur-xl transition hover:border-cyan-200/40 hover:bg-white/6"
      role="link"
      tabIndex={0}
      onClick={onOpenDetail}
      onKeyDown={onCardKeyDown}
    >
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
      <div className="flex justify-between">
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
        <ChipButton
          variant="danger"
          size="mdCompact"
          className="font-semibold"
          onClick={(event) => {
            event.stopPropagation();
            onDelete(featureFile.id);
          }}
        >
          삭제
        </ChipButton>
      </div>
    </article>
  );
}
