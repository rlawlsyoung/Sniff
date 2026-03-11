"use client";

import {
  ChangeEvent,
  DragEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  mergeScenarios,
  parseFeatureText,
  QaScenario,
  ScenarioStatus,
} from "../lib/gherkin";

const STORAGE_KEY = "sniff.qa.scenarios.v1";

type FilterStatus = "all" | ScenarioStatus;

type ImportNotice = {
  type: "success" | "error";
  message: string;
};

const STATUS_LABELS: Record<ScenarioStatus, string> = {
  todo: "미실행",
  passed: "통과",
  failed: "실패",
};

const FILTERS: { label: string; value: FilterStatus }[] = [
  { label: "전체", value: "all" },
  { label: "미실행", value: "todo" },
  { label: "통과", value: "passed" },
  { label: "실패", value: "failed" },
];

const STATUS_BUTTON_STYLES: Record<ScenarioStatus, string> = {
  todo: "border-slate-500/70 text-slate-300 hover:border-slate-300",
  passed: "border-emerald-400/50 text-emerald-300 hover:border-emerald-300",
  failed: "border-rose-400/50 text-rose-300 hover:border-rose-300",
};

function isFeatureLikeText(text: string) {
  return (
    /(^|\n)\s*Feature:\s*/i.test(text) &&
    /(^|\n)\s*Scenario(?: Outline)?:\s*/i.test(text)
  );
}

export default function QaDashboard() {
  const [scenarios, setScenarios] = useState<QaScenario[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        return [];
      }

      const parsed = JSON.parse(saved) as QaScenario[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [rawText, setRawText] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [notice, setNotice] = useState<ImportNotice | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
  }, [scenarios]);

  const applyImport = useCallback((text: string, source: string) => {
    const { scenarios: incoming, featureCount } = parseFeatureText(
      text,
      source,
    );

    if (incoming.length === 0) {
      setNotice({
        type: "error",
        message:
          "시나리오를 찾지 못했습니다. `Feature:`와 `Scenario:` 구문을 확인해주세요.",
      });
      return 0;
    }

    setScenarios((previous) => mergeScenarios(previous, incoming));
    setNotice({
      type: "success",
      message: `${incoming.length}개 QA 항목을 가져왔습니다 (${featureCount || 1}개 Feature).`,
    });

    return incoming.length;
  }, []);

  const importFromClipboardData = useCallback(
    async (clipboardData: DataTransfer, allowTextImport: boolean) => {
      const items = Array.from(clipboardData.items || []);

      for (const item of items) {
        if (item.kind !== "file") {
          continue;
        }

        const file = item.getAsFile();
        if (!file) {
          continue;
        }

        if (file.name.toLowerCase().endsWith(".feature")) {
          const text = await file.text();
          const importedCount = applyImport(text, file.name);
          return importedCount > 0;
        }
      }

      const plainText = clipboardData.getData("text/plain");
      if (!allowTextImport || !plainText.trim()) {
        return false;
      }

      if (/^[^\n\r]+\.feature$/i.test(plainText.trim())) {
        setNotice({
          type: "error",
          message:
            "파일 경로 문자열만 붙여넣어진 상태입니다. 브라우저 보안상 로컬 파일 경로는 읽을 수 없어, 파일 자체를 붙여넣거나 아래 업로드를 사용해주세요.",
        });
        return false;
      }

      if (isFeatureLikeText(plainText)) {
        const importedCount = applyImport(plainText, "clipboard.feature");
        return importedCount > 0;
      }

      return false;
    },
    [applyImport],
  );

  useEffect(() => {
    const onPaste = async (event: ClipboardEvent) => {
      if (!event.clipboardData) {
        return;
      }

      const target = event.target;
      const isEditableTarget =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable);

      const hasFeatureFile = Array.from(event.clipboardData.items || []).some(
        (item) => {
          if (item.kind !== "file") {
            return false;
          }

          const file = item.getAsFile();
          return Boolean(file && file.name.toLowerCase().endsWith(".feature"));
        },
      );

      const imported = await importFromClipboardData(
        event.clipboardData,
        !isEditableTarget || hasFeatureFile,
      );
      if (imported) {
        event.preventDefault();
      }
    };

    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [importFromClipboardData]);

  const stats = useMemo(() => {
    const total = scenarios.length;
    const todo = scenarios.filter((item) => item.status === "todo").length;
    const passed = scenarios.filter((item) => item.status === "passed").length;
    const failed = scenarios.filter((item) => item.status === "failed").length;
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

    return { total, todo, passed, failed, passRate };
  }, [scenarios]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return scenarios.filter((scenario) => {
      const byStatus = filter === "all" || scenario.status === filter;
      if (!byStatus) {
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
  }, [filter, query, scenarios]);

  const onParseTextarea = () => {
    const importedCount = applyImport(rawText, "manual-input.feature");
    if (importedCount > 0) {
      setRawText("");
    }
  };

  const onStatusChange = (id: string, status: ScenarioStatus) => {
    setScenarios((previous) =>
      previous.map((item) => (item.id === id ? { ...item, status } : item)),
    );
  };

  const onNoteChange = (id: string, note: string) => {
    setScenarios((previous) =>
      previous.map((item) => (item.id === id ? { ...item, note } : item)),
    );
  };

  const onClearAll = () => {
    const ok = window.confirm("모든 QA 리스트를 삭제할까요?");
    if (!ok) {
      return;
    }

    setScenarios([]);
    setNotice({ type: "success", message: "전체 QA 리스트를 비웠습니다." });
  };

  const importFeatureFile = async (file: File) => {
    if (
      !file.name.toLowerCase().endsWith(".feature") &&
      !file.type.includes("text")
    ) {
      return;
    }

    const text = await file.text();
    applyImport(text, file.name);
  };

  const onFileInput = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    for (const file of files) {
      await importFeatureFile(file);
    }
    event.target.value = "";
  };

  const onDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(true);
  };

  const onDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false);
  };

  const onDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false);

    const files = Array.from(event.dataTransfer.files || []);
    for (const file of files) {
      await importFeatureFile(file);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070b14] px-4 py-8 text-slate-100 sm:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-28 top-[-120px] h-[280px] w-[280px] rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute -right-24 top-[120px] h-[240px] w-[240px] rounded-full bg-emerald-300/15 blur-3xl" />
        <div className="absolute bottom-[-100px] left-1/3 h-[220px] w-[360px] rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-5">
        <h1 className="font-brand text-[42px] font-semibold tracking-[0.28em] text-transparent [text-shadow:0_0_34px_rgba(99,235,255,0.28)] bg-[linear-gradient(110deg,#dcf8ff_0%,#99ecff_38%,#8de5ff_62%,#f8fdff_100%)] bg-clip-text sm:text-[48px]">
          SNIFF
        </h1>

        <section className="grid gap-4 [animation:fade-up_420ms_ease-out_40ms_both] sm:grid-cols-2 lg:grid-cols-5">
          <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 shadow-[0_12px_28px_rgba(0,0,0,0.25)] backdrop-blur-xl">
            <p className="text-xs font-semibold tracking-[0.1em] text-slate-300">
              전체
            </p>
            <p className="mt-2 text-3xl font-semibold text-white">
              {stats.total}
            </p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 shadow-[0_12px_28px_rgba(0,0,0,0.25)] backdrop-blur-xl">
            <p className="text-xs font-semibold tracking-[0.1em] text-slate-300">
              미실행
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-100">
              {stats.todo}
            </p>
          </article>
          <article className="rounded-2xl border border-emerald-300/30 bg-emerald-300/10 p-4 shadow-[0_12px_28px_rgba(0,0,0,0.25)] backdrop-blur-xl">
            <p className="text-xs font-semibold tracking-[0.1em] text-emerald-200">
              통과
            </p>
            <p className="mt-2 text-3xl font-semibold text-emerald-100">
              {stats.passed}
            </p>
          </article>
          <article className="rounded-2xl border border-rose-300/30 bg-rose-300/10 p-4 shadow-[0_12px_28px_rgba(0,0,0,0.25)] backdrop-blur-xl">
            <p className="text-xs font-semibold tracking-[0.1em] text-rose-200">
              실패
            </p>
            <p className="mt-2 text-3xl font-semibold text-rose-100">
              {stats.failed}
            </p>
          </article>
          <article className="rounded-2xl border border-cyan-300/30 bg-cyan-300/10 p-4 shadow-[0_12px_28px_rgba(0,0,0,0.25)] backdrop-blur-xl">
            <p className="text-xs font-semibold tracking-[0.1em] text-cyan-100">
              Pass Rate
            </p>
            <p className="mt-2 text-3xl font-semibold text-cyan-50">
              {stats.passRate}%
            </p>
          </article>
        </section>

        <section className="grid gap-4 [animation:fade-up_460ms_ease-out_80ms_both] lg:grid-cols-[1.2fr_1fr]">
          <article
            className={`rounded-2xl border bg-white/[0.04] p-5 shadow-[0_14px_32px_rgba(0,0,0,0.28)] backdrop-blur-xl transition ${
              isDragActive
                ? "border-cyan-300/70 ring-4 ring-cyan-300/20"
                : "border-white/10"
            }`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            <h2 className="text-lg font-semibold text-white">빠른 가져오기</h2>
            <p className="mt-1 text-sm text-slate-300">
              `.feature` 붙여넣기, 드래그 앤 드롭, 파일 선택을 지원합니다.
            </p>

            <label
              htmlFor="feature-file"
              className="mt-4 flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-cyan-200/45 bg-cyan-300/10 p-6 text-center text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/15"
            >
              `.feature` 파일 선택
            </label>
            <input
              id="feature-file"
              className="hidden"
              type="file"
              accept=".feature,text/plain"
              multiple
              onChange={onFileInput}
            />

            <div className="mt-4 rounded-xl border border-white/10 bg-black/25 p-4 text-xs text-slate-300">
              파일 자체를 복사한 뒤 이 화면에서 `Cmd+V`를 누르면 자동으로 QA
              리스트가 생성됩니다.
            </div>
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_14px_32px_rgba(0,0,0,0.28)] backdrop-blur-xl">
            <h2 className="text-lg font-semibold text-white">직접 붙여넣기</h2>
            <p className="mt-1 text-sm text-slate-300">
              Gherkin 텍스트를 붙여넣고 QA 리스트를 생성하세요.
            </p>
            <textarea
              className="mt-3 h-48 w-full resize-y rounded-xl border border-white/15 bg-black/35 p-3 text-sm text-slate-100 outline-none ring-cyan-300/25 placeholder:text-slate-500 focus:border-cyan-300/60 focus:ring-4"
              placeholder="Feature: 로그인\n  Scenario: 유효한 계정 로그인\n    Given ..."
              value={rawText}
              onChange={(event) => setRawText(event.target.value)}
            />
            <button
              className="mt-3 w-full rounded-xl border border-cyan-200/40 bg-[linear-gradient(135deg,#0ea5b2_0%,#2c6cff_100%)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(26,135,255,0.35)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:border-slate-500/40 disabled:bg-slate-600/40 disabled:shadow-none"
              onClick={onParseTextarea}
              disabled={!rawText.trim()}
            >
              QA 리스트 생성
            </button>
          </article>
        </section>

        {notice ? (
          <section
            className={`rounded-2xl border px-4 py-3 text-sm backdrop-blur ${
              notice.type === "success"
                ? "border-emerald-300/35 bg-emerald-300/10 text-emerald-100"
                : "border-rose-300/35 bg-rose-300/10 text-rose-100"
            }`}
          >
            {notice.message}
          </section>
        ) : null}

        <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_14px_32px_rgba(0,0,0,0.28)] backdrop-blur-xl [animation:fade-up_500ms_ease-out_120ms_both]">
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
            <button
              className="rounded-full border border-rose-300/40 bg-rose-300/10 px-4 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-300/20"
              onClick={onClearAll}
            >
              전체 삭제
            </button>
          </div>
        </section>

        <section className="grid gap-3 pb-8 [animation:fade-up_560ms_ease-out_180ms_both]">
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/25 bg-white/[0.02] p-8 text-center text-sm text-slate-300">
              조건에 맞는 QA 시나리오가 없습니다.
            </div>
          ) : (
            filtered.map((scenario) => (
              <article
                key={scenario.id}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_14px_32px_rgba(0,0,0,0.28)] backdrop-blur-xl"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-cyan-300/35 bg-cyan-300/15 px-3 py-1 text-xs font-semibold text-cyan-100">
                    {scenario.feature}
                  </span>
                  <span className="rounded-full border border-white/20 bg-black/30 px-3 py-1 text-xs text-slate-300">
                    {scenario.source}
                  </span>
                  <span className="rounded-full border border-white/20 bg-black/30 px-3 py-1 text-xs text-slate-300">
                    {new Date(scenario.createdAt).toLocaleString()}
                  </span>
                </div>

                <h3 className="mt-3 text-lg font-semibold text-white">
                  {scenario.title}
                </h3>

                {scenario.tags.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {scenario.tags.map((tag) => (
                      <span
                        key={`${scenario.id}-${tag}`}
                        className="rounded-full border border-blue-200/25 bg-blue-300/15 px-2.5 py-1 text-xs font-medium text-blue-100"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}

                {scenario.steps.length > 0 ? (
                  <ul className="mt-3 space-y-1 rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-slate-200">
                    {scenario.steps.map((step, index) => (
                      <li key={`${scenario.id}-step-${index}`}>{step}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-slate-400">
                    등록된 Step이 없습니다.
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {(["todo", "passed", "failed"] as ScenarioStatus[]).map(
                    (status) => (
                      <button
                        key={`${scenario.id}-${status}`}
                        className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                          scenario.status === status
                            ? status === "todo"
                              ? "border-slate-200/80 bg-slate-200 text-slate-900"
                              : status === "passed"
                                ? "border-emerald-300/80 bg-emerald-300 text-emerald-950"
                                : "border-rose-300/80 bg-rose-300 text-rose-950"
                            : STATUS_BUTTON_STYLES[status]
                        }`}
                        onClick={() => onStatusChange(scenario.id, status)}
                      >
                        {STATUS_LABELS[status]}
                      </button>
                    ),
                  )}
                </div>

                <textarea
                  className="mt-3 h-24 w-full resize-y rounded-xl border border-white/15 bg-black/35 p-3 text-sm text-slate-100 outline-none ring-cyan-300/25 placeholder:text-slate-500 focus:border-cyan-300/60 focus:ring-4"
                  placeholder="실행 로그/이슈 메모"
                  value={scenario.note}
                  onChange={(event) =>
                    onNoteChange(scenario.id, event.target.value)
                  }
                />
              </article>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
