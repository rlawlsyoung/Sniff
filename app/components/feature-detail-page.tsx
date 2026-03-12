"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getScenarioStats, ScenarioStatus } from "../lib/gherkin";
import { ScenarioCard } from "./qa/scenario-card";
import { ScenarioStats } from "./qa/scenario-stats";
import { useFeatureFiles } from "../hooks/use-feature-files";
import { Popup } from "./ui/popup";

type FeatureDetailPageProps = {
  featureId: string;
};

type FilterStatus = "all" | ScenarioStatus;
type FeatureFilter = "all" | string;

const STATUS_FILTERS: { label: string; value: FilterStatus }[] = [
  { label: "전체", value: "all" },
  { label: "미실행", value: "todo" },
  { label: "통과", value: "passed" },
  { label: "실패", value: "failed" },
];

const EMPTY_TESTER_FORM = {
  name: "",
  device: "",
  osVersion: "",
};

export function FeatureDetailPage({ featureId }: FeatureDetailPageProps) {
  const router = useRouter();
  const {
    featureFileMap,
    updateScenarioStatus,
    updateScenarioNote,
    addTester,
    updateTester,
    removeTester,
    updateScenarioTesterResult,
    removeFeatureFile,
  } = useFeatureFiles();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [featureFilter, setFeatureFilter] = useState<FeatureFilter>("all");
  const [isDeletePopupOpen, setIsDeletePopupOpen] = useState(false);
  const [testerForm, setTesterForm] = useState(EMPTY_TESTER_FORM);
  const [editingTesterId, setEditingTesterId] = useState<string | null>(null);
  const [pendingDeleteTesterId, setPendingDeleteTesterId] = useState<
    string | null
  >(null);
  const [testerFormError, setTesterFormError] = useState<string | null>(null);

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
        ...featureFile.testers.map((tester) => tester.name),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [featureFile, featureFilter, statusFilter, query]);

  const featureFilters = useMemo(() => {
    if (!featureFile) {
      return [];
    }

    const names = new Set<string>();
    for (const scenario of featureFile.scenarios) {
      const name = scenario.feature?.trim();
      if (name) {
        names.add(name);
      }
    }

    return ["all", ...Array.from(names)] as const;
  }, [featureFile]);

  const featureScenarioCountMap = useMemo(() => {
    const counts = new Map<string, number>();

    if (!featureFile) {
      return counts;
    }

    for (const scenario of featureFile.scenarios) {
      const name = scenario.feature?.trim();
      if (!name) {
        continue;
      }

      counts.set(name, (counts.get(name) ?? 0) + 1);
    }

    return counts;
  }, [featureFile]);

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

  const onDeleteClick = () => {
    if (!featureFile) {
      return;
    }

    setIsDeletePopupOpen(true);
  };

  const onConfirmDelete = () => {
    if (!featureFile) {
      return;
    }

    removeFeatureFile(featureFile.id);
    setIsDeletePopupOpen(false);
    router.push("/");
  };

  const onTesterFormSubmit = () => {
    if (!featureFile) {
      return;
    }

    if (!testerForm.name.trim()) {
      setTesterFormError("진행자 이름을 입력해주세요.");
      return;
    }

    if (editingTesterId) {
      updateTester(featureFile.id, editingTesterId, testerForm);
    } else {
      addTester(featureFile.id, testerForm);
    }

    setTesterForm(EMPTY_TESTER_FORM);
    setTesterFormError(null);
    setEditingTesterId(null);
  };

  const onTesterEditClick = (testerId: string) => {
    const tester = featureFile.testers.find((item) => item.id === testerId);
    if (!tester) {
      return;
    }

    setEditingTesterId(tester.id);
    setTesterForm({
      name: tester.name,
      device: tester.device,
      osVersion: tester.osVersion,
    });
    setTesterFormError(null);
  };

  const onCancelTesterEdit = () => {
    setEditingTesterId(null);
    setTesterForm(EMPTY_TESTER_FORM);
    setTesterFormError(null);
  };

  const onConfirmTesterDelete = () => {
    if (!featureFile || !pendingDeleteTesterId) {
      return;
    }

    removeTester(featureFile.id, pendingDeleteTesterId);
    if (editingTesterId === pendingDeleteTesterId) {
      onCancelTesterEdit();
    }

    setPendingDeleteTesterId(null);
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
            onClick={onDeleteClick}
          >
            이 파일 삭제
          </button>
        </div>

        <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_14px_32px_rgba(0,0,0,0.28)] backdrop-blur-xl">
          <h1 className="text-2xl font-semibold text-white">
            {featureFile.fileName}
          </h1>
          <p className="mt-2 text-sm text-slate-300">
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

        <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_14px_32px_rgba(0,0,0,0.28)] backdrop-blur-xl">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                QA Runner
              </p>
              <h2 className="mt-1 text-base font-semibold text-slate-100">
                QA 진행자 관리
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                진행자를 추가하면 아래 각 시나리오에 진행자 수만큼 댓글형 실행
                기록이 자동으로 생성됩니다.
              </p>
            </div>
            <span className="rounded-full border border-white/15 bg-black/30 px-3 py-1 text-xs text-slate-300">
              등록 진행자 {featureFile.testers.length}명
            </span>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <input
              className="w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-slate-100 outline-none ring-cyan-300/20 placeholder:text-slate-500 focus:border-cyan-300/60 focus:ring-4"
              placeholder="진행자명 (예: 김QA)"
              value={testerForm.name}
              onChange={(event) =>
                setTesterForm((prev) => ({ ...prev, name: event.target.value }))
              }
            />
            <input
              className="w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-slate-100 outline-none ring-cyan-300/20 placeholder:text-slate-500 focus:border-cyan-300/60 focus:ring-4"
              placeholder="기기 정보 (예: iPhone 16 Pro)"
              value={testerForm.device}
              onChange={(event) =>
                setTesterForm((prev) => ({
                  ...prev,
                  device: event.target.value,
                }))
              }
            />
            <input
              className="w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-slate-100 outline-none ring-cyan-300/20 placeholder:text-slate-500 focus:border-cyan-300/60 focus:ring-4"
              placeholder="OS 버전 (예: iOS 19.0)"
              value={testerForm.osVersion}
              onChange={(event) =>
                setTesterForm((prev) => ({
                  ...prev,
                  osVersion: event.target.value,
                }))
              }
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              className="rounded-full border border-cyan-300/45 bg-cyan-300/12 px-4 py-1.5 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/20"
              onClick={onTesterFormSubmit}
            >
              {editingTesterId ? "진행자 수정 저장" : "진행자 추가"}
            </button>

            {editingTesterId ? (
              <button
                className="rounded-full border border-white/20 bg-black/35 px-4 py-1.5 text-sm text-slate-200 transition hover:border-white/40"
                onClick={onCancelTesterEdit}
              >
                수정 취소
              </button>
            ) : null}
          </div>

          {testerFormError ? (
            <p className="mt-2 text-xs text-rose-200">{testerFormError}</p>
          ) : null}

          {featureFile.testers.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-white/25 bg-white/[0.02] p-4 text-sm text-slate-300">
              아직 등록된 진행자가 없습니다. 진행자를 추가하면 시나리오별로
              상태와 메모를 개별 기록할 수 있습니다.
            </div>
          ) : (
            <div className="mt-4 grid gap-2">
              {featureFile.testers.map((tester) => (
                <article
                  key={tester.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-100">
                      {tester.name}
                    </p>
                    <p className="truncate text-xs text-slate-400">
                      {[
                        tester.device || "기기 미입력",
                        tester.osVersion || "OS 미입력",
                      ].join(" / ")}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      className="rounded-full border border-white/20 bg-black/35 px-3 py-1 text-xs text-slate-200 transition hover:border-white/40"
                      onClick={() => onTesterEditClick(tester.id)}
                    >
                      수정
                    </button>
                    <button
                      className="rounded-full border border-rose-300/40 bg-rose-300/10 px-3 py-1 text-xs text-rose-100 transition hover:bg-rose-300/20"
                      onClick={() => setPendingDeleteTesterId(tester.id)}
                    >
                      삭제
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
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
                testers={featureFile.testers}
                onStatusChange={(scenarioId, status) =>
                  updateScenarioStatus(featureFile.id, scenarioId, status)
                }
                onNoteChange={(scenarioId, note) =>
                  updateScenarioNote(featureFile.id, scenarioId, note)
                }
                onTesterResultChange={(scenarioId, testerId, updates) =>
                  updateScenarioTesterResult(
                    featureFile.id,
                    scenarioId,
                    testerId,
                    updates,
                  )
                }
              />
            ))
          )}
        </section>
      </div>

      <Popup
        open={isDeletePopupOpen}
        title="Feature 파일을 삭제할까요?"
        description="삭제 후에는 복구할 수 없습니다."
        confirmLabel="삭제"
        cancelLabel="취소"
        tone="danger"
        onClose={() => setIsDeletePopupOpen(false)}
        onConfirm={onConfirmDelete}
      />

      <Popup
        open={Boolean(pendingDeleteTesterId)}
        title="진행자를 삭제할까요?"
        description="삭제하면 모든 시나리오의 해당 진행자 기록도 함께 삭제됩니다."
        confirmLabel="삭제"
        cancelLabel="취소"
        tone="danger"
        onClose={() => setPendingDeleteTesterId(null)}
        onConfirm={onConfirmTesterDelete}
      />
    </div>
  );
}
