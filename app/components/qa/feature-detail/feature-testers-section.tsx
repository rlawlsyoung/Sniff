"use client";

import { useState } from "react";
import { QaTester } from "../../../lib/gherkin";
import { Popup } from "../../ui/popup";
import { ChipButton } from "../../ui/chip-button";

type TesterFormState = {
  name: string;
  device: string;
  osVersion: string;
};

type FeatureTestersSectionProps = {
  fileId: string;
  testers: QaTester[];
  addTester: (fileId: string, draft: TesterFormState) => void;
  updateTester: (
    fileId: string,
    testerId: string,
    draft: TesterFormState,
  ) => void;
  removeTester: (fileId: string, testerId: string) => void;
};

const EMPTY_TESTER_FORM: TesterFormState = {
  name: "",
  device: "",
  osVersion: "",
};

export function FeatureTestersSection({
  fileId,
  testers,
  addTester,
  updateTester,
  removeTester,
}: FeatureTestersSectionProps) {
  const [newTesterForm, setNewTesterForm] = useState(EMPTY_TESTER_FORM);
  const [newTesterFormError, setNewTesterFormError] = useState<string | null>(
    null,
  );
  const [editingTesterId, setEditingTesterId] = useState<string | null>(null);
  const [editingTesterForm, setEditingTesterForm] = useState(EMPTY_TESTER_FORM);
  const [editingTesterFormError, setEditingTesterFormError] = useState<
    string | null
  >(null);
  const [pendingDeleteTesterId, setPendingDeleteTesterId] = useState<
    string | null
  >(null);

  const onTesterAdd = () => {
    if (!newTesterForm.name.trim()) {
      setNewTesterFormError("진행자 이름을 입력해주세요.");
      return;
    }

    addTester(fileId, newTesterForm);
    setNewTesterForm(EMPTY_TESTER_FORM);
    setNewTesterFormError(null);
  };

  const onTesterEditClick = (testerId: string) => {
    const tester = testers.find((item) => item.id === testerId);
    if (!tester) {
      return;
    }

    setEditingTesterId(tester.id);
    setEditingTesterForm({
      name: tester.name,
      device: tester.device,
      osVersion: tester.osVersion,
    });
    setEditingTesterFormError(null);
  };

  const onTesterEditSave = () => {
    if (!editingTesterId) {
      return;
    }

    if (!editingTesterForm.name.trim()) {
      setEditingTesterFormError("진행자 이름을 입력해주세요.");
      return;
    }

    updateTester(fileId, editingTesterId, editingTesterForm);
    setEditingTesterId(null);
    setEditingTesterForm(EMPTY_TESTER_FORM);
    setEditingTesterFormError(null);
  };

  const onCancelTesterEdit = () => {
    setEditingTesterId(null);
    setEditingTesterForm(EMPTY_TESTER_FORM);
    setEditingTesterFormError(null);
  };

  const onConfirmTesterDelete = () => {
    if (!pendingDeleteTesterId) {
      return;
    }

    removeTester(fileId, pendingDeleteTesterId);
    if (editingTesterId === pendingDeleteTesterId) {
      onCancelTesterEdit();
    }

    setPendingDeleteTesterId(null);
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-white/4 p-5 shadow-[0_14px_32px_rgba(0,0,0,0.28)] backdrop-blur-xl">
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
          등록 진행자 {testers.length}명
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
        <input
          className="w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-slate-100 outline-none ring-cyan-300/20 placeholder:text-slate-500 focus:border-cyan-300/60 focus:ring-4"
          placeholder="진행자명 (예: 김QA)"
          value={newTesterForm.name}
          onChange={(event) =>
            setNewTesterForm((prev) => ({
              ...prev,
              name: event.target.value,
            }))
          }
        />
        <input
          className="w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-slate-100 outline-none ring-cyan-300/20 placeholder:text-slate-500 focus:border-cyan-300/60 focus:ring-4"
          placeholder="기기 정보 (예: iPhone 16 Pro)"
          value={newTesterForm.device}
          onChange={(event) =>
            setNewTesterForm((prev) => ({
              ...prev,
              device: event.target.value,
            }))
          }
        />
        <input
          className="w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-slate-100 outline-none ring-cyan-300/20 placeholder:text-slate-500 focus:border-cyan-300/60 focus:ring-4"
          placeholder="OS 버전 (예: iOS 19.0)"
          value={newTesterForm.osVersion}
          onChange={(event) =>
            setNewTesterForm((prev) => ({
              ...prev,
              osVersion: event.target.value,
            }))
          }
        />
        <ChipButton
          variant="accent"
          size="mdCompact"
          className="px-4 font-semibold md:self-center"
          onClick={onTesterAdd}
        >
          진행자 추가
        </ChipButton>
      </div>

      {newTesterFormError ? (
        <p className="mt-2 text-xs text-rose-200">{newTesterFormError}</p>
      ) : null}

      {testers.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-white/25 bg-white/2 p-4 text-sm text-slate-300">
          아직 등록된 진행자가 없습니다. 진행자를 추가하면 시나리오별로 상태와
          메모를 개별 기록할 수 있습니다.
        </div>
      ) : (
        <div className="mt-4 grid gap-2">
          {testers.map((tester) => (
            <article
              key={tester.id}
              className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5"
            >
              {editingTesterId === tester.id ? (
                <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto_auto_auto]">
                  <input
                    className="w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-slate-100 outline-none ring-cyan-300/20 placeholder:text-slate-500 focus:border-cyan-300/60 focus:ring-4"
                    placeholder="진행자명"
                    value={editingTesterForm.name}
                    onChange={(event) =>
                      setEditingTesterForm((prev) => ({
                        ...prev,
                        name: event.target.value,
                      }))
                    }
                  />
                  <input
                    className="w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-slate-100 outline-none ring-cyan-300/20 placeholder:text-slate-500 focus:border-cyan-300/60 focus:ring-4"
                    placeholder="기기 정보"
                    value={editingTesterForm.device}
                    onChange={(event) =>
                      setEditingTesterForm((prev) => ({
                        ...prev,
                        device: event.target.value,
                      }))
                    }
                  />
                  <input
                    className="w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-slate-100 outline-none ring-cyan-300/20 placeholder:text-slate-500 focus:border-cyan-300/60 focus:ring-4"
                    placeholder="OS 버전"
                    value={editingTesterForm.osVersion}
                    onChange={(event) =>
                      setEditingTesterForm((prev) => ({
                        ...prev,
                        osVersion: event.target.value,
                      }))
                    }
                  />
                  <ChipButton
                    variant="accent"
                    size="sm"
                    className="font-semibold md:self-center"
                    onClick={onTesterEditSave}
                  >
                    저장
                  </ChipButton>
                  <ChipButton
                    variant="neutral"
                    size="sm"
                    className="md:self-center"
                    onClick={onCancelTesterEdit}
                  >
                    취소
                  </ChipButton>
                  <ChipButton
                    variant="danger"
                    size="sm"
                    className="md:self-center"
                    onClick={() => setPendingDeleteTesterId(tester.id)}
                  >
                    삭제
                  </ChipButton>

                  {editingTesterFormError ? (
                    <p className="text-xs text-rose-200 md:col-span-6">
                      {editingTesterFormError}
                    </p>
                  ) : null}
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3">
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
                    <ChipButton
                      variant="neutral"
                      size="xs"
                      className="px-3"
                      onClick={() => onTesterEditClick(tester.id)}
                    >
                      수정
                    </ChipButton>
                    <ChipButton
                      variant="danger"
                      size="xs"
                      className="px-3"
                      onClick={() => setPendingDeleteTesterId(tester.id)}
                    >
                      삭제
                    </ChipButton>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

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
    </section>
  );
}
