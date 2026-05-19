import { useCallback, useState } from "react";

export function useUnsavedGuard() {
  const [dirty, setDirty] = useState(false);

  const guardUnsaved = useCallback(() => {
    if (!dirty) return true;
    return window.confirm("未保存の変更があります。破棄しますか？");
  }, [dirty]);

  return { dirty, onDirtyChange: setDirty, guardUnsaved };
}
