import { useEffect } from "react";
import { useTemplateDraft } from "../../../hooks/use-template-draft";
import { DraftActions } from "../draft-actions";

export function DraftTemplateForm({
  item,
  onSave,
  onDelete,
  referenced,
  onDirtyChange,
  children,
}) {
  const { draft, patch, isDirty, reset, commitSaved } = useTemplateDraft(item);

  useEffect(() => {
    onDirtyChange?.(isDirty);
    return () => onDirtyChange?.(false);
  }, [isDirty, onDirtyChange]);

  if (!draft) return null;

  function handleSave() {
    onSave(draft);
    commitSaved();
  }

  return (
    <div className="space-y-2">
      {children({ draft, patch })}
      <DraftActions
        isDirty={isDirty}
        onSave={handleSave}
        onReset={reset}
        onDelete={onDelete}
        referenced={referenced}
        variant="light"
      />
    </div>
  );
}
