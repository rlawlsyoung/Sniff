"use client";

import { FormEvent, KeyboardEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { QaFeatureFile, getScenarioStats } from "../../lib/gherkin";
import { ChipButton } from "../ui/chip-button";

type FeatureFileCardProps = {
  featureFile: QaFeatureFile;
  onRename: (id: string, nextFileName: string) => boolean;
  onDelete: (id: string) => void;
};

export function FeatureFileCard({
  featureFile,
  onRename,
  onDelete,
}: FeatureFileCardProps) {
  const router = useRouter();
  const stats = getScenarioStats(featureFile.scenarios);
  const [isEditing, setIsEditing] = useState(false);
  const [draftFileName, setDraftFileName] = useState(featureFile.fileName);

  const onOpenDetail = () => {
    if (isEditing) {
      return;
    }

    router.push(`/features/${featureFile.id}`);
  };

  const onCardKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (isEditing) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpenDetail();
    }
  };

  const onSubmitRename = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const isRenamed = onRename(featureFile.id, draftFileName);
    if (isRenamed) {
      setIsEditing(false);
    }
  };

  return (
    <article
      className="cursor-pointer rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-sm shadow-slate-200/40 dark:shadow-none backdrop-blur-xl transition hover:border-cyan-400/40 dark:border-cyan-200/40 hover:bg-slate-50 dark:hover:bg-slate-800"
      role="link"
      tabIndex={0}
      onClick={onOpenDetail}
      onKeyDown={onCardKeyDown}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-56 flex-1">
          {isEditing ? (
            <form
              className="flex flex-wrap items-center gap-2"
              onSubmit={onSubmitRename}
              onClick={(event) => event.stopPropagation()}
            >
              <input
                autoFocus
                value={draftFileName}
                onChange={(event) => setDraftFileName(event.target.value)}
                className="min-w-48 flex-1 rounded-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100 outline-none ring-cyan-500/25 dark:ring-cyan-300/25 focus:border-cyan-500/60 dark:focus:border-cyan-300/60 focus:ring-4"
                aria-label="Feature 파일 제목"
              />
              <ChipButton size="sm" variant="accent" type="submit">
                저장
              </ChipButton>
              <ChipButton
                size="sm"
                variant="neutralSoft"
                onClick={(event) => {
                  event.stopPropagation();
                  setDraftFileName(featureFile.fileName);
                  setIsEditing(false);
                }}
              >
                취소
              </ChipButton>
            </form>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {featureFile.fileName}
              </h3>
              <ChipButton
                variant="ghost"
                size="xs"
                className="h-7 w-7 p-0"
                aria-label="파일 제목 수정"
                onClick={(event) => {
                  event.stopPropagation();
                  setDraftFileName(featureFile.fileName);
                  setIsEditing(true);
                }}
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              </ChipButton>
            </div>
          )}

          <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
            {featureFile.featureNames.join(", ") || "Untitled Feature"}
          </p>
        </div>

        <span className="rounded-full border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 px-2.5 py-1 text-xs text-slate-700 dark:text-slate-300">
          {new Date(featureFile.updatedAt).toLocaleString()}
        </span>
      </div>
      <div className="flex justify-between">
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 px-2.5 py-1 text-slate-800 dark:text-slate-200">
            전체 {stats.total}
          </span>
          <span className="rounded-full border border-slate-400/40 bg-slate-300/10 px-2.5 py-1 text-slate-800 dark:text-slate-200">
            미실행 {stats.todo}
          </span>
          <span className="rounded-full border border-emerald-500/45 dark:border-emerald-400/45 bg-emerald-500/10 dark:bg-emerald-300/10 px-2.5 py-1 text-emerald-700 dark:text-emerald-200">
            통과 {stats.passed}
          </span>
          <span className="rounded-full border border-rose-500/45 dark:border-rose-400/45 bg-rose-500/10 dark:bg-rose-300/10 px-2.5 py-1 text-rose-700 dark:text-rose-200">
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
