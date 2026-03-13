"use client";

import Link from "next/link";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { TesterScenarioResult } from "../lib/gherkin";
import { useFeatureFiles } from "../hooks/use-feature-files";
import { FeatureDetailHeaderSection } from "./qa/feature-detail/feature-detail-header-section";
import { FeatureScenariosSection } from "./qa/feature-detail/feature-scenarios-section";
import { FeatureTestersSection } from "./qa/feature-detail/feature-testers-section";
import { ChipButton, chipButtonClassName } from "./ui/chip-button";

type FeatureDetailPageProps = {
  featureId: string;
};

export function FeatureDetailPage({ featureId }: FeatureDetailPageProps) {
  const router = useRouter();
  const {
    isHydrated,
    syncError,
    featureFileMap,
    addTester,
    updateTester,
    removeTester,
    updateScenarioTesterResult,
    removeFeatureFile,
  } = useFeatureFiles();

  const featureFile = featureFileMap.get(featureId);

  const onDeleteFeature = useCallback(() => {
    removeFeatureFile(featureId);
    router.push("/");
  }, [featureId, removeFeatureFile, router]);

  const onScenarioTesterResultChange = useCallback(
    (
      scenarioId: string,
      testerId: string,
      updates: Partial<Pick<TesterScenarioResult, "status" | "note">>,
    ) => {
      updateScenarioTesterResult(featureId, scenarioId, testerId, updates);
    },
    [featureId, updateScenarioTesterResult],
  );

  const onScrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  if (!isHydrated) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 p-8 text-center text-sm text-slate-700 dark:text-slate-300">
          Feature 데이터를 불러오는 중입니다...
        </div>
      </div>
    );
  }

  if (!featureFile) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <Link href="/" className={chipButtonClassName({ className: "w-fit" })}>
          메인으로 돌아가기
        </Link>
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 dark:border-slate-600 bg-slate-100 dark:bg-slate-800/50 p-8 text-center text-sm text-slate-700 dark:text-slate-300">
          해당 Feature 파일을 찾을 수 없습니다. 메인 화면에서 다시 선택해주세요.
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        {syncError ? (
          <section className="rounded-2xl border border-rose-500/35 dark:border-rose-300/35 bg-rose-500/10 dark:bg-rose-300/10 px-4 py-3 text-sm text-rose-800 dark:text-rose-100 backdrop-blur">
            {syncError}
          </section>
        ) : null}

        <FeatureDetailHeaderSection
          fileName={featureFile.fileName}
          featureNames={featureFile.featureNames}
          updatedAt={featureFile.updatedAt}
          onDeleteFeature={onDeleteFeature}
        />

        <FeatureScenariosSection
          scenarios={featureFile.scenarios}
          testers={featureFile.testers}
          onTesterResultChange={onScenarioTesterResultChange}
          middleContent={
            <FeatureTestersSection
              fileId={featureFile.id}
              testers={featureFile.testers}
              addTester={addTester}
              updateTester={updateTester}
              removeTester={removeTester}
            />
          }
        />
      </div>

      <ChipButton
        variant="accent"
        className="bottom-6 right-6 z-40 h-14! w-14! p-0! shadow-lg shadow-black/30 hidden xl:fixed"
        onClick={onScrollToTop}
        aria-label="페이지 최상단으로 이동"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 5v14" />
          <path d="m6 11 6-6 6 6" />
        </svg>
      </ChipButton>
    </>
  );
}
