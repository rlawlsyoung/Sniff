"use client";

import { FormEvent, useState } from "react";
import { Pencil } from "lucide-react";
import type { RenameFeatureFileResult } from "@/app/hooks/use-feature-files";
import { FeatureDeletePopup } from "../feature-delete-popup";
import { ChipButton } from "../../ui/chip-button";

type FeatureDetailHeaderSectionProps = {
  fileName: string;
  featureNames: string[];
  updatedAt: string;
  onRenameFeature: (nextFileName: string) => RenameFeatureFileResult;
  onDeleteFeature: () => void;
};

export function FeatureDetailHeaderSection({
  fileName,
  featureNames,
  updatedAt,
  onRenameFeature,
  onDeleteFeature,
}: FeatureDetailHeaderSectionProps) {
  const [isDeletePopupOpen, setIsDeletePopupOpen] = useState(false);
  const [isRenameMode, setIsRenameMode] = useState(false);
  const [renameDraft, setRenameDraft] = useState(fileName);
  const [renameError, setRenameError] = useState<string | null>(null);

  const onSubmitRename = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = onRenameFeature(renameDraft);
    if (!result.ok) {
      setRenameError(result.message);
      return;
    }

    setRenameError(null);
    setIsRenameMode(false);
  };

  return (
    <>
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 flex items-start justify-between bg-white/60 dark:bg-slate-900/50 gap-2 p-5 shadow-sm shadow-slate-200/40 dark:shadow-none backdrop-blur-xl">
        <div className="flex-1">
          {isRenameMode ? (
            <form
              className="flex flex-wrap items-center gap-2"
              onSubmit={onSubmitRename}
            >
              <input
                autoFocus
                value={renameDraft}
                onChange={(event) => setRenameDraft(event.target.value)}
                className="min-w-64 flex-1  rounded-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none ring-cyan-500/25 dark:ring-cyan-300/25 focus:border-cyan-500/60 dark:focus:border-cyan-300/60 focus:ring-4"
                aria-label="Feature 파일 제목"
              />
              <ChipButton variant="accent" size="mdCompact" type="submit">
                저장
              </ChipButton>
              <ChipButton
                variant="neutralSoft"
                size="mdCompact"
                onClick={() => {
                  setRenameDraft(fileName);
                  setRenameError(null);
                  setIsRenameMode(false);
                }}
              >
                취소
              </ChipButton>
            </form>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
                {fileName}
              </h1>
              <ChipButton
                variant="ghost"
                size="xs"
                className="h-8 w-8 p-0"
                aria-label="파일 제목 수정"
                onClick={() => {
                  setRenameDraft(fileName);
                  setRenameError(null);
                  setIsRenameMode(true);
                }}
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
              </ChipButton>
            </div>
          )}

          {renameError ? (
            <p className="mt-2 text-sm text-rose-700 dark:text-rose-300">
              {renameError}
            </p>
          ) : null}

          <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
            {featureNames.join(", ") || "Untitled Feature"}
          </p>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            업데이트: {new Date(updatedAt).toLocaleString()}
          </p>
        </div>

        <ChipButton
          variant="danger"
          className="font-semibold"
          onClick={() => setIsDeletePopupOpen(true)}
        >
          이 파일 삭제
        </ChipButton>
      </section>

      <FeatureDeletePopup
        open={isDeletePopupOpen}
        onClose={() => setIsDeletePopupOpen(false)}
        onConfirm={() => {
          onDeleteFeature();
          setIsDeletePopupOpen(false);
        }}
      />
    </>
  );
}
