"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  getScenarioStats,
  QaScenario,
  QaTester,
  ScenarioStatus,
  TesterScenarioResult,
} from "../../../lib/gherkin";
import { ScenarioCard } from "../scenario-card";
import { ScenarioStats } from "../scenario-stats";

type FilterStatus = "all" | ScenarioStatus;
type FeatureFilter = "all" | string;

type FeatureScenariosSectionProps = {
  scenarios: QaScenario[];
  testers: QaTester[];
  onTesterResultChange: (
    scenarioId: string,
    testerId: string,
    updates: Partial<Pick<TesterScenarioResult, "status" | "note">>,
  ) => void;
  middleContent?: ReactNode;
};

const STATUS_FILTERS: { label: string; value: FilterStatus }[] = [
  { label: "전체", value: "all" },
  { label: "미실행", value: "todo" },
  { label: "통과", value: "passed" },
  { label: "실패", value: "failed" },
];

export function FeatureScenariosSection({
  scenarios,
  testers,
  onTesterResultChange,
  middleContent,
}: FeatureScenariosSectionProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [featureFilter, setFeatureFilter] = useState<FeatureFilter>("all");

  const stats = useMemo(() => getScenarioStats(scenarios), [scenarios]);

  const filteredScenarios = useMemo(() => {
    const q = query.trim().toLowerCase();

    return scenarios.filter((scenario) => {
      if (featureFilter !== "all" && scenario.feature !== featureFilter) {
        return false;
      }

      if (statusFilter !== "all" && scenario.status !== statusFilter) {
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
        ...Object.values(scenario.testerResults).map((result) => result.note),
        ...testers.map((tester) => tester.name),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [scenarios, featureFilter, statusFilter, query, testers]);

  const featureFilters = useMemo(() => {
    const names = new Set<string>();

    for (const scenario of scenarios) {
      const name = scenario.feature?.trim();
      if (name) {
        names.add(name);
      }
    }

    return ["all", ...Array.from(names)];
  }, [scenarios]);

  const featureScenarioCountMap = useMemo(() => {
    const counts = new Map<string, number>();

    for (const scenario of scenarios) {
      const name = scenario.feature?.trim();
      if (!name) {
        continue;
      }

      counts.set(name, (counts.get(name) ?? 0) + 1);
    }

    return counts;
  }, [scenarios]);

  const statusCountMap: Record<FilterStatus, number> = {
    all: stats.total,
    todo: stats.todo,
    passed: stats.passed,
    failed: stats.failed,
  };

  const hasActiveFilters =
    featureFilter !== "all" ||
    statusFilter !== "all" ||
    query.trim().length > 0;

  return (
    <>
      <ScenarioStats
        scenarioTotal={stats.total}
        todo={stats.todo}
        passed={stats.passed}
        failed={stats.failed}
      />

      <section className="rounded-2xl border border-white/10 bg-white/4 p-5 shadow-[0_14px_32px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Quick Filter
              </p>
              <h2 className="mt-1 text-base font-semibold text-slate-100">
                시나리오 필터
              </h2>
            </div>

            {hasActiveFilters ? (
              <button
                className="rounded-full border border-white/15 bg-black/30 px-4 py-1.5 text-xs font-medium text-slate-300 transition hover:border-white/35 hover:text-slate-100"
                onClick={() => {
                  setFeatureFilter("all");
                  setStatusFilter("all");
                  setQuery("");
                }}
              >
                필터 초기화
              </button>
            ) : null}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <p className="px-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                Feature
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {featureFilters.map((item) => {
                  const isAll = item === "all";
                  const label = isAll ? "전체" : item;
                  const count = isAll
                    ? stats.total
                    : (featureScenarioCountMap.get(item) ?? 0);

                  return (
                    <button
                      key={item}
                      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                        featureFilter === item
                          ? "border-emerald-300/55 bg-emerald-300/12 text-emerald-100"
                          : "border-white/15 bg-slate-900/40 text-slate-300 hover:border-white/35 hover:bg-slate-800/60 hover:text-slate-100"
                      }`}
                      onClick={() => setFeatureFilter(item)}
                    >
                      <span>{label}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          featureFilter === item
                            ? "bg-emerald-100/90 text-emerald-900"
                            : "bg-white/10 text-slate-300"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <p className="px-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                상태
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {STATUS_FILTERS.map((item) => (
                  <button
                    key={item.value}
                    className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                      statusFilter === item.value
                        ? "border-cyan-300/55 bg-cyan-300/12 text-cyan-100"
                        : "border-white/15 bg-slate-900/40 text-slate-300 hover:border-white/35 hover:bg-slate-800/60 hover:text-slate-100"
                    }`}
                    onClick={() => setStatusFilter(item.value)}
                  >
                    <span>{item.label}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        statusFilter === item.value
                          ? "bg-cyan-100/90 text-cyan-900"
                          : "bg-white/10 text-slate-300"
                      }`}
                    >
                      {statusCountMap[item.value]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
              <svg
                aria-hidden="true"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="none"
              >
                <path
                  d="M14.1667 14.1667L17.5 17.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle
                  cx="8.75"
                  cy="8.75"
                  r="5.75"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
              </svg>
            </span>
            <input
              className="min-w-56 w-full rounded-2xl border border-white/15 bg-black/35 py-2.5 pl-11 pr-10 text-sm text-slate-100 outline-none ring-cyan-300/20 placeholder:text-slate-500 focus:border-cyan-300/60 focus:ring-4"
              placeholder="시나리오/태그/메모 검색"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            {query ? (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-slate-300 transition hover:border-white/30 hover:text-slate-100"
                onClick={() => setQuery("")}
              >
                지우기
              </button>
            ) : null}
          </div>
        </div>
      </section>

      {middleContent}

      <section className="grid gap-3 pb-8">
        {filteredScenarios.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/25 bg-white/2 p-8 text-center text-sm text-slate-300">
            조건에 맞는 시나리오가 없습니다.
          </div>
        ) : (
          filteredScenarios.map((scenario) => (
            <ScenarioCard
              key={scenario.id}
              scenario={scenario}
              testers={testers}
              onTesterResultChange={onTesterResultChange}
            />
          ))
        )}
      </section>
    </>
  );
}
