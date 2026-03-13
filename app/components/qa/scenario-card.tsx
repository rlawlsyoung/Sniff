import { useState } from "react";
import {
  QaScenario,
  QaTester,
  ScenarioStatus,
  TesterScenarioResult,
} from "../../lib/gherkin";
import { ChipButton } from "../ui/chip-button";
import { NoteActionButton } from "./note-action-button";

const STATUS_LABELS: Record<ScenarioStatus, string> = {
  todo: "미실행",
  passed: "통과",
  failed: "실패",
};

const STATUS_BUTTON_STYLES: Record<ScenarioStatus, string> = {
  todo: "border-slate-500/70 text-slate-300 hover:border-slate-300",
  passed: "border-emerald-400/50 text-emerald-300 hover:border-emerald-300",
  failed: "border-rose-400/50 text-rose-300 hover:border-rose-300",
};

type ParsedStepRow = {
  keyword: string;
  content: string;
  kind: "step" | "examples" | "table" | "text";
  cells?: string[];
};

type ExamplesTableBlock = {
  header: string[];
  rows: string[][];
};

type DisplayRow =
  | {
      kind: "row";
      row: ParsedStepRow;
    }
  | {
      kind: "examples-table";
      table: ExamplesTableBlock;
    };

const KEYWORD_STYLES: Record<string, string> = {
  Given: "border-sky-300/45 bg-sky-300/15 text-sky-100",
  When: "border-amber-300/45 bg-amber-300/15 text-amber-100",
  Then: "border-emerald-300/45 bg-emerald-300/15 text-emerald-100",
  And: "border-indigo-300/45 bg-indigo-300/15 text-indigo-100",
  But: "border-rose-300/45 bg-rose-300/15 text-rose-100",
  Step: "border-cyan-300/45 bg-cyan-300/15 text-cyan-100",
  Examples: "border-violet-300/45 bg-violet-300/15 text-violet-100",
  Table: "border-slate-300/35 bg-slate-300/10 text-slate-200",
  Text: "border-slate-300/35 bg-slate-300/10 text-slate-200",
};

function toKeywordLabel(rawKeyword: string) {
  if (rawKeyword === "*") {
    return "Step";
  }

  const lowerKeyword = rawKeyword.toLowerCase();
  return `${lowerKeyword.charAt(0).toUpperCase()}${lowerKeyword.slice(1)}`;
}

function parseStep(step: string): ParsedStepRow {
  const trimmedStep = step.trim();

  if (/^Examples:\s*$/i.test(trimmedStep)) {
    return {
      keyword: "Examples",
      content: "",
      kind: "examples",
    };
  }

  if (trimmedStep.startsWith("|")) {
    const cells = trimmedStep
      .split("|")
      .map((cell) => cell.trim())
      .filter((cell) => cell.length > 0);

    return {
      keyword: "Table",
      content: trimmedStep,
      kind: "table",
      cells,
    };
  }

  const keywordMatch = trimmedStep.match(
    /^(Given|When|Then|And|But|\*)\s*(.*)$/i,
  );
  if (keywordMatch) {
    return {
      keyword: toKeywordLabel(keywordMatch[1]),
      content: keywordMatch[2].trim(),
      kind: "step",
    };
  }

  return {
    keyword: "Text",
    content: trimmedStep,
    kind: "text",
  };
}

function createExamplesTableBlock(
  tableRows: string[][],
): ExamplesTableBlock | null {
  if (tableRows.length === 0) {
    return null;
  }

  const columnCount = Math.max(1, ...tableRows.map((row) => row.length));
  const [rawHeader, ...rawRows] = tableRows;

  const header = Array.from({ length: columnCount }, (_, index) => {
    const headerCell = rawHeader[index]?.trim();
    return headerCell || `컬럼 ${index + 1}`;
  });

  const rows = rawRows.map((row) =>
    Array.from(
      { length: columnCount },
      (_, index) => row[index]?.trim() || "-",
    ),
  );

  return {
    header,
    rows,
  };
}

function buildDisplayRows(parsedSteps: ParsedStepRow[]): DisplayRow[] {
  const displayRows: DisplayRow[] = [];

  for (let index = 0; index < parsedSteps.length; index += 1) {
    const current = parsedSteps[index];

    if (current.kind === "examples") {
      const tableRows: string[][] = [];
      let cursor = index + 1;

      while (
        cursor < parsedSteps.length &&
        parsedSteps[cursor].kind === "table"
      ) {
        tableRows.push(parsedSteps[cursor].cells ?? []);
        cursor += 1;
      }

      const table = createExamplesTableBlock(tableRows);
      if (table) {
        displayRows.push({
          kind: "examples-table",
          table,
        });
        index = cursor - 1;
        continue;
      }
    }

    displayRows.push({
      kind: "row",
      row: current,
    });
  }

  return displayRows;
}

type ScenarioCardProps = {
  scenario: QaScenario;
  testers: QaTester[];
  onTesterResultChange: (
    scenarioId: string,
    testerId: string,
    updates: Partial<Pick<TesterScenarioResult, "status" | "note">>,
  ) => void;
};

export function ScenarioCard({
  scenario,
  testers,
  onTesterResultChange,
}: ScenarioCardProps) {
  const [noteDraftByTesterId, setNoteDraftByTesterId] = useState<
    Record<string, string>
  >({});
  const [editingTesterMap, setEditingTesterMap] = useState<
    Record<string, true>
  >({});

  const parsedSteps = scenario.steps.map(parseStep);
  const displayRows = buildDisplayRows(parsedSteps);

  const setTesterNoteDraft = (testerId: string, note: string) => {
    setNoteDraftByTesterId((previous) => ({
      ...previous,
      [testerId]: note,
    }));
  };

  const clearTesterNoteDraft = (testerId: string) => {
    setNoteDraftByTesterId((previous) => {
      if (!(testerId in previous)) {
        return previous;
      }

      const next = { ...previous };
      delete next[testerId];
      return next;
    });
  };

  const startTesterNoteEdit = (testerId: string, currentNote: string) => {
    setEditingTesterMap((previous) => ({
      ...previous,
      [testerId]: true,
    }));
    setTesterNoteDraft(testerId, currentNote);
  };

  const stopTesterNoteEdit = (testerId: string) => {
    setEditingTesterMap((previous) => {
      if (!(testerId in previous)) {
        return previous;
      }

      const next = { ...previous };
      delete next[testerId];
      return next;
    });
  };

  const submitTesterNote = (
    scenarioId: string,
    testerId: string,
    savedNote: string,
    draftNote: string,
  ) => {
    if (draftNote !== savedNote) {
      onTesterResultChange(scenarioId, testerId, {
        note: draftNote,
      });
    }

    stopTesterNoteEdit(testerId);
    clearTesterNoteDraft(testerId);
  };

  const cancelTesterNoteEdit = (testerId: string) => {
    stopTesterNoteEdit(testerId);
    clearTesterNoteDraft(testerId);
  };

  return (
    <article className="rounded-2xl border border-white/10 bg-white/4 p-5 shadow-[0_14px_32px_rgba(0,0,0,0.28)] backdrop-blur-xl">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-cyan-300/35 bg-cyan-300/15 px-3 py-1 text-xs font-semibold text-cyan-100">
          {scenario.feature}
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

      {displayRows.length > 0 ? (
        <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-black/30">
          <table className="w-full border-collapse text-sm text-slate-200">
            <thead className="bg-white/3 text-xs uppercase tracking-wide text-slate-300">
              <tr>
                <th className="w-28 px-3 py-2 text-left font-semibold">문법</th>
                <th className="px-3 py-2 text-left font-semibold">내용</th>
              </tr>
            </thead>
            <tbody>
              {displayRows.map((displayRow, index) => {
                if (displayRow.kind === "examples-table") {
                  const columnCount = displayRow.table.header.length;

                  return (
                    <tr
                      key={`${scenario.id}-step-${index}`}
                      className="border-t border-white/10 align-top"
                    >
                      <td className="px-3 py-2.5">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                            KEYWORD_STYLES.Examples
                          }`}
                        >
                          Examples
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-slate-100">
                        <div className="overflow-hidden rounded-lg border border-white/15 bg-black/25">
                          <table className="w-full border-collapse text-xs text-slate-200">
                            <thead className="bg-white/5 text-[11px] uppercase tracking-wide text-slate-300">
                              <tr>
                                {displayRow.table.header.map(
                                  (headerCell, headerIndex) => (
                                    <th
                                      key={`${scenario.id}-examples-head-${index}-${headerIndex}`}
                                      className="border-b border-white/15 px-2.5 py-2 text-left font-semibold"
                                    >
                                      {headerCell}
                                    </th>
                                  ),
                                )}
                              </tr>
                            </thead>
                            <tbody>
                              {displayRow.table.rows.length === 0 ? (
                                <tr>
                                  <td
                                    colSpan={columnCount}
                                    className="px-2.5 py-2 text-slate-400"
                                  >
                                    예제 데이터 행이 없습니다.
                                  </td>
                                </tr>
                              ) : (
                                displayRow.table.rows.map(
                                  (rowCells, rowIndex) => (
                                    <tr
                                      key={`${scenario.id}-examples-row-${index}-${rowIndex}`}
                                      className="border-t border-white/10"
                                    >
                                      {rowCells.map((cell, cellIndex) => (
                                        <td
                                          key={`${scenario.id}-examples-cell-${index}-${rowIndex}-${cellIndex}`}
                                          className="px-2.5 py-2 text-slate-100"
                                        >
                                          {cell}
                                        </td>
                                      ))}
                                    </tr>
                                  ),
                                )
                              )}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  );
                }

                const row = displayRow.row;

                return (
                  <tr
                    key={`${scenario.id}-step-${index}`}
                    className="border-t border-white/10 align-top"
                  >
                    <td className="px-3 py-2.5">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                          KEYWORD_STYLES[row.keyword] ?? KEYWORD_STYLES.Text
                        }`}
                      >
                        {row.keyword}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-100">
                      {row.kind === "examples" ? (
                        <span className="text-slate-300">
                          예제 블록에 테이블 데이터가 없습니다.
                        </span>
                      ) : row.kind === "table" ? (
                        row.cells && row.cells.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {row.cells.map((cell, cellIndex) => (
                              <span
                                key={`${scenario.id}-step-${index}-cell-${cellIndex}`}
                                className="rounded-md border border-white/15 bg-white/4 px-2 py-1 text-xs text-slate-200"
                              >
                                {cell}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <code className="text-xs text-slate-300">| |</code>
                        )
                      ) : row.content ? (
                        row.content
                      ) : (
                        <span className="text-slate-400">(내용 없음)</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-400">등록된 Step이 없습니다.</p>
      )}

      {testers.length === 0 ? (
        <>
          <div className="mt-4 rounded-xl border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-xs text-amber-100">
            등록된 진행자가 없어 QA를 진행할 수 없습니다. 먼저 상단에서 진행자를
            추가해주세요.
          </div>
        </>
      ) : (
        <section className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-300">
              QA 진행 기록
            </p>
            <p className="text-xs text-slate-400">진행자 {testers.length}명</p>
          </div>

          <div className="mt-3 grid gap-3">
            {testers.map((tester) => {
              const result = scenario.testerResults[tester.id] ?? {
                status: "todo",
                note: "",
              };
              const savedNote = result.note;
              const hasSavedNote = savedNote.trim().length > 0;
              const isEditing =
                editingTesterMap[tester.id] === true || !hasSavedNote;
              const draftNote = noteDraftByTesterId[tester.id] ?? savedNote;
              const isNoteChanged = draftNote !== savedNote;
              const testerMeta = [tester.device, tester.osVersion]
                .filter((value) => value.trim().length > 0)
                .join(" / ");

              return (
                <div
                  key={`${scenario.id}-${tester.id}`}
                  className="rounded-xl border border-white/10 bg-white/5 p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-100">
                        {tester.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {testerMeta || "기기/OS 정보 미입력"}
                      </p>
                    </div>
                    <span className="rounded-full border border-white/20 bg-black/35 px-2.5 py-1 text-xs text-slate-200">
                      {STATUS_LABELS[result.status]}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {(["todo", "passed", "failed"] as ScenarioStatus[]).map(
                      (status) => (
                        <ChipButton
                          key={`${scenario.id}-${tester.id}-${status}`}
                          variant="custom"
                          size="xs"
                          className={`px-3 font-semibold ${
                            result.status === status
                              ? status === "todo"
                                ? "border-slate-200/80 bg-slate-200 text-slate-900"
                                : status === "passed"
                                  ? "border-emerald-300/80 bg-emerald-300 text-emerald-950"
                                  : "border-rose-300/80 bg-rose-300 text-rose-950"
                              : STATUS_BUTTON_STYLES[status]
                          }`}
                          onClick={() =>
                            onTesterResultChange(scenario.id, tester.id, {
                              status,
                            })
                          }
                        >
                          {STATUS_LABELS[status]}
                        </ChipButton>
                      ),
                    )}
                  </div>

                  {isEditing ? (
                    <div className="mt-2">
                      <textarea
                        className="h-24 w-full resize-y rounded-lg border border-white/15 bg-black/35 p-2.5 text-sm text-slate-100 outline-none ring-cyan-300/25 placeholder:text-slate-500 focus:border-cyan-300/60 focus:ring-4"
                        placeholder={`${tester.name} 진행 메모`}
                        value={draftNote}
                        onChange={(event) =>
                          setTesterNoteDraft(tester.id, event.target.value)
                        }
                        onKeyDown={(event) => {
                          if (
                            (event.metaKey || event.ctrlKey) &&
                            event.key === "Enter"
                          ) {
                            submitTesterNote(
                              scenario.id,
                              tester.id,
                              savedNote,
                              draftNote,
                            );
                          }
                        }}
                      />

                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs text-slate-400">
                          입력 후 등록 버튼을 눌러 저장합니다.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {hasSavedNote ? (
                            <NoteActionButton
                              onClick={() => cancelTesterNoteEdit(tester.id)}
                            >
                              취소
                            </NoteActionButton>
                          ) : null}
                          <NoteActionButton
                            variant="primary"
                            disabled={!isNoteChanged}
                            onClick={() =>
                              submitTesterNote(
                                scenario.id,
                                tester.id,
                                savedNote,
                                draftNote,
                              )
                            }
                          >
                            등록
                          </NoteActionButton>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <div className="min-h-20 rounded-lg border border-white/15 bg-black/25 px-2.5 py-2 text-sm text-slate-100 whitespace-pre-wrap">
                        {savedNote}
                      </div>
                      <div className="mt-2 flex justify-end">
                        <NoteActionButton
                          onClick={() =>
                            startTesterNoteEdit(tester.id, savedNote)
                          }
                        >
                          수정
                        </NoteActionButton>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </article>
  );
}
