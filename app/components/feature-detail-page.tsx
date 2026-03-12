"use client";

import Link from "next/link";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { TesterScenarioResult } from "../lib/gherkin";
import { QaPageShell } from "./qa/qa-page-shell";
import { useFeatureFiles } from "../hooks/use-feature-files";
import { FeatureDetailHeaderSection } from "./qa/feature-detail/feature-detail-header-section";
import { FeatureScenariosSection } from "./qa/feature-detail/feature-scenarios-section";
import { FeatureTestersSection } from "./qa/feature-detail/feature-testers-section";

type FeatureDetailPageProps = {
  featureId: string;
};

export function FeatureDetailPage({ featureId }: FeatureDetailPageProps) {
  const router = useRouter();
  const {
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

  if (!featureFile) {
    return (
      <QaPageShell maxWidthClassName="max-w-4xl" contentGapClassName="gap-4">
        <Link
          href="/"
          className="w-fit rounded-full border border-white/20 bg-black/30 px-4 py-2 text-sm text-slate-200"
        >
          메인으로 돌아가기
        </Link>
        <div className="rounded-2xl border border-dashed border-white/30 bg-white/3 p-8 text-center text-sm text-slate-300">
          해당 Feature 파일을 찾을 수 없습니다. 메인 화면에서 다시 선택해주세요.
        </div>
      </QaPageShell>
    );
  }

  return (
    <QaPageShell maxWidthClassName="max-w-5xl" contentGapClassName="gap-4">
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
    </QaPageShell>
  );
}
