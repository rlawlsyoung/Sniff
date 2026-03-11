"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getScenarioStats, ScenarioStatus } from "../lib/gherkin";
import { ScenarioCard } from "./qa/scenario-card";
import { ScenarioStats } from "./qa/scenario-stats";
import { useFeatureFiles } from "../hooks/use-feature-files";

type FeatureDetailPageProps = {
  featureId: string;
};

type FilterStatus = "all" | ScenarioStatus;

const FILTERS: { label: string; value: FilterStatus }[] = [
  { label: "전체", value: "all" },
  { label: "미실행", value: "todo" },
  { label: "통과", value: "passed" },
  { label: "실패", value: "failed" },
];

export function FeatureDetailPage({ featureId }: FeatureDetailPageProps) {
  const router = useRouter();
  const {
    featureFileMap,
    updateScenarioStatus,
    updateScenarioNote,
    removeFeatureFile,
  } = useFeatureFiles();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("all");

  const featureFile = featureFileMap.get(featureId);
  const stats = useMemo(() => {
    if (!featureFile) {
      return {
        total: 0,
        todo: 0,
        passed: 0,
        failed: 0,
        passRate: 0,
      };
    }

    return getScenarioStats(featureFile.scenarios);
  }, [featureFile]);

  const filteredScenarios = useMemo(() => {
    if (!featureFile) {
      return [];
    }

    const q = query.trim().toLowerCase();

    return featureFile.scenarios.filter((scenario) => {
      if (filter !== "all" && scenario.status !== filter) {
        return false;
      }

      if (!q) {
        return true;
      }

      const haystack = [
        scenario.feature,
        scenario.title,
        scenario.tags.join(" "),
        scenario.steps.join(" "),
        scenario.note,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [featureFile, filter, query]);

  const onDelete = () => {
    if (!featureFile) {
      return;
    }

    const ok = window.confirm("이 Feature 파일을 삭제할까요?");
    if (!ok) {
      return;
    }

    removeFeatureFile(featureFile.id);
    router.push("/");
  };

  if (!featureFile) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#070b14] px-4 py-8 text-slate-100 sm:px-8">
        <div className="relative mx-auto flex w-full max-w-4xl flex-col gap-4">
          <Link
            href="/"
            className="w-fit rounded-full border border-white/20 bg-black/30 px-4 py-2 text-sm text-slate-200"
          >
            메인으로 돌아가기
          </Link>
          <div className="rounded-2xl border border-dashed border-white/30 bg-white/[0.03] p-8 text-center text-sm text-slate-300">
            해당 Feature 파일을 찾을 수 없습니다. 메인 화면에서 다시
            선택해주세요.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070b14] px-4 py-8 text-slate-100 sm:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-28 top-[-120px] h-[280px] w-[280px] rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute -right-24 top-[120px] h-[240px] w-[240px] rounded-full bg-emerald-300/15 blur-3xl" />
      </div>

      <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/"
            className="rounded-full border border-white/20 bg-black/30 px-4 py-2 text-sm text-slate-200 transition hover:border-white/40"
          >
            메인으로 돌아가기
          </Link>
          <button
            className="rounded-full border border-rose-300/45 bg-rose-300/10 px-4 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-300/20"
            onClick={onDelete}
          >
            이 파일 삭제
          </button>
        </div>

        <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_14px_32px_rgba(0,0,0,0.28)] backdrop-blur-xl">
          <h1 className="text-2xl font-semibold text-white">
            {featureFile.fileName}
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            포함 Feature:{" "}
            {featureFile.featureNames.join(", ") || "Untitled Feature"}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            업데이트: {new Date(featureFile.updatedAt).toLocaleString()}
          </p>
        </section>

        <ScenarioStats
          scenarioTotal={stats.total}
          todo={stats.todo}
          passed={stats.passed}
          failed={stats.failed}
        />

        <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_14px_32px_rgba(0,0,0,0.28)] backdrop-blur-xl">
          <div className="flex flex-wrap items-center gap-2">
            {FILTERS.map((item) => (
              <button
                key={item.value}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                  filter === item.value
                    ? "border-cyan-300/70 bg-cyan-300/20 text-cyan-100"
                    : "border-white/20 text-slate-300 hover:border-white/40 hover:text-slate-100"
                }`}
                onClick={() => setFilter(item.value)}
              >
                {item.label}
              </button>
            ))}
            <input
              className="ml-auto min-w-56 flex-1 rounded-full border border-white/20 bg-black/30 px-4 py-2 text-sm text-slate-100 outline-none ring-cyan-300/25 placeholder:text-slate-500 focus:border-cyan-300/60 focus:ring-4"
              placeholder="시나리오/태그/메모 검색"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </section>

        <section className="grid gap-3 pb-8">
          {filteredScenarios.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/25 bg-white/[0.02] p-8 text-center text-sm text-slate-300">
              조건에 맞는 시나리오가 없습니다.
            </div>
          ) : (
            filteredScenarios.map((scenario) => (
              <ScenarioCard
                key={scenario.id}
                scenario={scenario}
                onStatusChange={(scenarioId, status) =>
                  updateScenarioStatus(featureFile.id, scenarioId, status)
                }
                onNoteChange={(scenarioId, note) =>
                  updateScenarioNote(featureFile.id, scenarioId, note)
                }
              />
            ))
          )}
        </section>
      </div>
    </div>
  );
}
