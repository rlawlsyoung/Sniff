"use client";

import Link from "next/link";
import { useState } from "react";
import { FeatureDeletePopup } from "../feature-delete-popup";
import { ChipButton, chipButtonClassName } from "../../ui/chip-button";

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
      <section className="rounded-2xl border border-white/10 flex items-start justify-between bg-white/4 p-5 shadow-[0_14px_32px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        <div>
          <h1 className="text-2xl font-semibold text-white">{fileName}</h1>
          <p className="mt-2 text-sm text-slate-300">
            {featureNames.join(", ") || "Untitled Feature"}
          </p>
          <p className="mt-1 text-xs text-slate-400">
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
