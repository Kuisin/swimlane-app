import { useMemo, useState } from "react";

function cloneEntity(entity) {
  return entity ? structuredClone(entity) : null;
}

export function useTemplateDraft(entity) {
  const serialized = useMemo(
    () => (entity ? JSON.stringify(entity) : ""),
    [entity]
  );

  const [draft, setDraft] = useState(() => cloneEntity(entity));
  const [syncedSerialized, setSyncedSerialized] = useState(serialized);

  if (serialized !== syncedSerialized) {
    setSyncedSerialized(serialized);
    setDraft(cloneEntity(entity));
  }

  const isDirty = useMemo(() => {
    if (!entity || !draft) return false;
    return JSON.stringify(entity) !== JSON.stringify(draft);
  }, [entity, draft]);

  function patch(partial) {
    setDraft((prev) => (prev ? { ...prev, ...partial } : prev));
  }

  function reset() {
    setDraft(cloneEntity(entity));
    setSyncedSerialized(serialized);
  }

  return { draft, patch, isDirty, reset };
}
