"use client";

import Link from "next/link";
import { useState } from "react";
import { FeatureDeletePopup } from "../feature-delete-popup";

type FeatureDetailHeaderSectionProps = {
  fileName: string;
  featureNames: string[];
  updatedAt: string;
  onDeleteFeature: () => void;
};

export function FeatureDetailHeaderSection({
  fileName,
  featureNames,
  updatedAt,
  onDeleteFeature,
}: FeatureDetailHeaderSectionProps) {
  const [isDeletePopupOpen, setIsDeletePopupOpen] = useState(false);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/"
          className="rounded-full border border-white/20 bg-black/30 px-4 py-2 text-sm text-slate-200 transition hover:border-white/40"
        >
          메인으로 돌아가기
        </Link>
        <button
          className="rounded-full border border-rose-300/45 bg-rose-300/10 px-4 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-300/20"
          onClick={() => setIsDeletePopupOpen(true)}
        >
          이 파일 삭제
        </button>
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/4 p-5 shadow-[0_14px_32px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        <h1 className="text-2xl font-semibold text-white">{fileName}</h1>
        <p className="mt-2 text-sm text-slate-300">
          {featureNames.join(", ") || "Untitled Feature"}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          업데이트: {new Date(updatedAt).toLocaleString()}
        </p>
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
