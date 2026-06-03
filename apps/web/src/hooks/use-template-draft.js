import { useMemo, useRef, useState } from "react";

function cloneEntity(entity) {
  return entity ? structuredClone(entity) : null;
}

function stableStringify(value) {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  const keys = Object.keys(value).sort();
  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(",")}}`;
}

export function useTemplateDraft(entity) {
  const serialized = useMemo(
    () => (entity ? stableStringify(entity) : ""),
    [entity]
  );

  const [draft, setDraft] = useState(() => cloneEntity(entity));
  const [baselineSerialized, setBaselineSerialized] = useState(serialized);
  const [entitySerialized, setEntitySerialized] = useState(serialized);
  const savePendingRef = useRef(false);

  if (serialized !== entitySerialized) {
    if (savePendingRef.current) {
      if (serialized === baselineSerialized) {
        savePendingRef.current = false;
        setEntitySerialized(serialized);
        setDraft(cloneEntity(entity));
      }
    } else {
      setEntitySerialized(serialized);
      setDraft(cloneEntity(entity));
      setBaselineSerialized(serialized);
    }
  }

  const isDirty = useMemo(() => {
    if (!draft) return false;
    return stableStringify(draft) !== baselineSerialized;
  }, [draft, baselineSerialized]);

  function patch(partial) {
    savePendingRef.current = false;
    setDraft((prev) => (prev ? { ...prev, ...partial } : prev));
  }

  function reset() {
    savePendingRef.current = false;
    setDraft(cloneEntity(entity));
    setBaselineSerialized(serialized);
  }

  function commitSaved() {
    if (!draft) return;
    setBaselineSerialized(stableStringify(draft));
    savePendingRef.current = true;
  }

  return { draft, patch, isDirty, reset, commitSaved };
}
