import { useEffect } from "react";
import { useUnsavedGuard } from "../../../hooks/use-unsaved-guard";

export function useTemplatePanelGuard(registerGuardUnsaved) {
  const { onDirtyChange, guardUnsaved } = useUnsavedGuard();

  useEffect(() => {
    registerGuardUnsaved?.(guardUnsaved);
  }, [guardUnsaved, registerGuardUnsaved]);

  return { onDirtyChange, guardUnsaved };
}

export function confirmOverwriteId(existing, label) {
  if (!existing) return true;
  return window.confirm(`${label} を上書きしますか？`);
}

export function extractPartId(code) {
  return code?.match(/<([^>]+)>/)?.[1];
}
