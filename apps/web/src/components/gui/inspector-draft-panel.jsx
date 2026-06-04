import { useEffect, useImperativeHandle, useMemo } from "react";

import { useTemplateDraft } from "../../hooks/use-template-draft";

import { resolveInspectorTarget } from "../../lib/flow-rows";

import { DraftActions } from "./draft-actions";

import { StepInspector } from "./step-inspector";

import { BranchInspector } from "./branch-inspector";



export function InspectorDraftPanel({

  row,

  rowIndex,

  guiModel,

  model,

  themeKey,

  onSave,

  onRowsPatch,

  onDirtyChange,

  editingDisabled = false,

  flushRef,

}) {

  const target = useMemo(

    () => resolveInspectorTarget(guiModel.rows, rowIndex ?? -1),

    [guiModel.rows, rowIndex],

  );



  const { draft, patch, isDirty, reset, commitSaved } = useTemplateDraft(
    target.inspectorRow,
  );



  useEffect(() => {

    onDirtyChange?.(isDirty);

    return () => onDirtyChange?.(false);

  }, [isDirty, onDirtyChange]);



  if (!row) {

    return (

      <p className="text-xs font-jp text-stone-500 px-3 py-4">

        手順を選択してください

      </p>

    );

  }



  if (!draft) return null;



  const readOnlyInspector = editingDisabled;



  function handleSave() {

    onSave(draft, target.saveRowIndex);
    commitSaved();

  }



  useImperativeHandle(

    flushRef,

    () => ({

      flush() {

        if (readOnlyInspector || !isDirty || !draft) return null;

        const nextSrc = onSave(draft, target.saveRowIndex);

        commitSaved();

        return nextSrc ?? null;

      },

      discard() {

        reset();

      },

    }),

    [readOnlyInspector, isDirty, draft, target.saveRowIndex],

  );



  function handleMergeTargetPick(stepIndex, mergeId) {
    patch({ mergeTarget: mergeId });
    onRowsPatch?.((draft) => {
      const step = draft.rows[stepIndex];
      if (step?.kind === "step" && !(step.mergeId || "").trim()) {
        step.mergeId = mergeId;
      }
      if (
        rowIndex != null &&
        rowIndex >= 0 &&
        draft.rows[rowIndex]?.kind === "branchMerge"
      ) {
        draft.rows[rowIndex].mergeTarget = mergeId;
      }
    });
  }



  return (

    <div className="flex flex-col min-h-0 flex-1">

      {readOnlyInspector && (

        <p className="shrink-0 px-3 py-2 text-[10px] font-jp text-amber-400 border-b border-stone-700/60 bg-amber-950/30">

          構文エラーがあるため、このブロックは保存できません。テキストエディタで直してください。

        </p>

      )}

      <div

        className={

          readOnlyInspector ? "opacity-60 pointer-events-none flex-1 min-h-0" : "flex-1 min-h-0"

        }

      >

        {target.isBranchRow ? (

          <BranchInspector

            row={draft}

            rows={guiModel.rows}

            onPatch={patch}

            viaBranchEnd={target.viaBranchEnd}

            onMergeTargetPick={handleMergeTargetPick}

          />

        ) : (

          <StepInspector

            row={draft}

            rows={guiModel.rows}

            rowIndex={rowIndex ?? -1}

            lanes={model.lanes}

            blocks={model.blocks}

            props={model.props}

            themeKey={themeKey}

            onPatch={patch}

          />

        )}

      </div>

      <div className="px-3 py-3 shrink-0">

        <DraftActions

          isDirty={isDirty && !readOnlyInspector}

          onSave={handleSave}

          onReset={reset}

          variant="dark"

        />

      </div>

    </div>

  );

}


