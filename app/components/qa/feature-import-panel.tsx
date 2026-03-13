import { ChangeEvent, DragEvent } from "react";

type FeatureImportPanelProps = {
  isDragActive: boolean;
  rawText: string;
  onRawTextChange: (value: string) => void;
  onFileInput: (event: ChangeEvent<HTMLInputElement>) => void;
  onParseTextarea: () => void;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDragLeave: (event: DragEvent<HTMLDivElement>) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
};

export function FeatureImportPanel({
  isDragActive,
  rawText,
  onRawTextChange,
  onFileInput,
  onParseTextarea,
  onDragOver,
  onDragLeave,
  onDrop,
}: FeatureImportPanelProps) {
  return (
    <section className="grid gap-4 [animation:fade-up_460ms_ease-out_80ms_both] lg:grid-cols-[1.2fr_1fr]">
      <article
        className={`rounded-2xl border bg-white/60 dark:bg-slate-900/50 p-5 shadow-sm shadow-slate-200/40 dark:shadow-none backdrop-blur-xl transition ${
          isDragActive
            ? "border-cyan-500/70 dark:border-cyan-300/70 ring-4 ring-cyan-500/20 dark:ring-cyan-300/20"
            : "border-slate-200 dark:border-slate-800"
        }`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          빠른 가져오기
        </h2>
        <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
          `.feature` 붙여넣기, 드래그 앤 드롭, 파일 선택을 지원합니다.
        </p>

        <label
          htmlFor="feature-file"
          className="mt-4 flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-cyan-400/45 dark:border-cyan-200/45 bg-cyan-500/10 dark:bg-cyan-300/10 p-6 text-center text-sm font-semibold text-cyan-800 dark:text-cyan-100 transition hover:bg-cyan-500/15 dark:bg-cyan-300/15"
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

        <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 p-4 text-xs text-slate-700 dark:text-slate-300">
          파일 자체를 복사한 뒤 이 화면에서 `Cmd+V`를 누르면 자동으로 Feature
          리스트가 생성됩니다.
        </div>
      </article>

      <article className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/50 p-5 shadow-sm shadow-slate-200/40 dark:shadow-none backdrop-blur-xl">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          직접 붙여넣기
        </h2>
        <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
          Gherkin 텍스트를 붙여넣고 Feature 파일 페이지를 생성하세요.
        </p>
        <textarea
          className="mt-3 h-48 w-full resize-y rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 p-3 text-sm text-slate-900 dark:text-slate-100 outline-none ring-cyan-500/25 dark:ring-cyan-300/25 placeholder:text-slate-400 dark:placeholder:text-slate-600 dark:text-slate-500 focus:border-cyan-500/60 dark:border-cyan-300/60 focus:ring-4"
          placeholder="Feature: 로그인\n  Scenario: 유효한 계정 로그인\n    Given ..."
          value={rawText}
          onChange={(event) => onRawTextChange(event.target.value)}
        />
        <button
          className="mt-3 w-full rounded-xl border border-cyan-400/40 dark:border-cyan-200/40 bg-[linear-gradient(135deg,#0ea5b2_0%,#2c6cff_100%)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(26,135,255,0.35)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:border-slate-500/40 disabled:bg-slate-600/40 disabled:shadow-none"
          onClick={onParseTextarea}
          disabled={!rawText.trim()}
        >
          Feature 페이지 생성
        </button>
      </article>
    </section>
  );
}
