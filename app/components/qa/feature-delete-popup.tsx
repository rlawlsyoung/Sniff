"use client";

import { Popup } from "../ui/popup";

type FeatureDeletePopupProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function FeatureDeletePopup({
  open,
  onClose,
  onConfirm,
}: FeatureDeletePopupProps) {
  return (
    <Popup
      open={open}
      title="Feature 파일을 삭제할까요?"
      description="삭제 후에는 복구할 수 없습니다."
      confirmLabel="삭제"
      cancelLabel="취소"
      tone="danger"
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}
