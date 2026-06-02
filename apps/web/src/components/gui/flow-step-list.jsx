import { useState } from "react";
import {
  ArrowRightLeft,
  ChevronDown,
  ChevronUp,
  CornerLeftUp,
  Trash2,
} from "lucide-react";
import {
  branchBodyDepthAt,
  branchCaseDepthAt,
  branchMarkerDepthAt,
  branchCaseBadgeStyle,
  canAddAnd,
  canAddElseIf,
  canAddMerge,
  canOutdentBranch,
  findMergeTargetAfterBranch,
  isInsideOpenIf,
  nextStepMergeId,
  findAdjacentBranchBlockIndex,
  findAdjacentCaseIndex,
  findAdjacentStepIndex,
  findBranchEndIndex,
  getMoveToTargets,
  getReorderBounds,
  moveBranchOutOfNest,
  moveUnitToInsertBefore,
  nextBranchId,
  resolveMovedIndex,
  rowBadgeLabel,
  rowKindBadgeClass,
  rowListIndentDepth,
  rowSummaryText,
  swapFrameUnits,
  swapCaseBlocks,
  swapStepRows,
} from "../../lib/flow-rows";
import { MoveRowModal } from "./move-row-modal";

export function FlowStepList({
  rows,
  selectedRowIndex,
  onSelectRow,
  onEditRows,
  lanes,
}) {
  const defaultRole = lanes[0]?.id || "role_applicant";
  const [moveFromIndex, setMoveFromIndex] = useState(null);

  function insertAt(index, newRows) {
    onEditRows((draft) => {
      draft.rows.splice(index, 0, ...newRows);
    });
  }

  function handleAddStep() {
    const idx = selectedRowIndex != null ? selectedRowIndex + 1 : rows.length;
    insertAt(idx, [
      {
        kind: "step",
        role: defaultRole,
        text: "新しいステップ",
        depth: rows[idx - 1]?.depth ?? 0,
        blockRef: null,
        stepId: `step-new-${Date.now()}`,
        mergeId: nextStepMergeId(rows),
      },
    ]);
    onSelectRow(idx);
  }

  function handleAddIf() {
    const idx = selectedRowIndex != null ? selectedRowIndex + 1 : rows.length;
    const markerDepth = branchMarkerDepthAt(rows, idx);
    const caseDepth = branchCaseDepthAt(rows, idx);
    const branchId = nextBranchId(rows);
    insertAt(idx, [
      {
        kind: "branchStart",
        cond: "条件",
        firstCase: "",
        branchColor: null,
        id: branchId,
        depth: markerDepth,
      },
      {
        kind: "branchCase",
        label: "ケース1",
        branchColor: null,
        id: branchId,
        depth: caseDepth,
      },
      {
        kind: "branchCase",
        label: "ケース2",
        branchColor: null,
        id: branchId,
        depth: caseDepth,
      },
      {
        kind: "branchEnd",
        id: branchId,
        depth: markerDepth,
      },
    ]);
    onSelectRow(idx);
  }

  function handleAddFork() {
    const idx = selectedRowIndex != null ? selectedRowIndex + 1 : rows.length;
    const markerDepth = branchMarkerDepthAt(rows, idx);
    const caseDepth = branchCaseDepthAt(rows, idx);
    const branchId = nextBranchId(rows);
    // A fork's first path opens at the `fork` row itself, so two concurrent
    // paths need one `and` (branchCase) row.
    insertAt(idx, [
      {
        kind: "branchStart",
        parallel: true,
        cond: null,
        firstCase: null,
        branchColor: "purple",
        id: branchId,
        depth: markerDepth,
      },
      {
        kind: "branchCase",
        parallel: true,
        label: "",
        branchColor: "purple",
        id: branchId,
        depth: caseDepth,
      },
      {
        kind: "branchEnd",
        parallel: true,
        id: branchId,
        depth: markerDepth,
      },
    ]);
    onSelectRow(idx);
  }

  function handleAddAnd() {
    if (selectedRowIndex == null || !canAddAnd(rows, selectedRowIndex)) return;
    const idx = selectedRowIndex + 1;
    const caseDepth = branchCaseDepthAt(rows, idx);
    insertAt(idx, [
      {
        kind: "branchCase",
        parallel: true,
        label: "",
        branchColor: null,
        id: rows[findEnclosingStart(rows, selectedRowIndex)]?.id,
        depth: caseDepth,
      },
    ]);
    onSelectRow(idx);
  }

  function handleAddMerge() {
    if (selectedRowIndex == null || !canAddMerge(rows, selectedRowIndex)) return;
    const mergeInsertAt = selectedRowIndex + 1;
    const start = findEnclosingStart(rows, selectedRowIndex);
    const branchId = rows[start]?.id;
    const endIdx = findBranchEndIndex(rows, start);
    const { mergeId, stepIndex, needsId } = findMergeTargetAfterBranch(
      rows,
      start,
    );
    onEditRows((draft) => {
      let insertAt = mergeInsertAt;
      if (stepIndex < 0) {
        draft.rows.splice(endIdx + 1, 0, {
          kind: "step",
          role: defaultRole,
          text: "合流先",
          mergeId,
          depth: draft.rows[endIdx]?.depth ?? 0,
          blockRef: null,
          stepId: `step-new-${Date.now()}`,
        });
        if (endIdx + 1 < insertAt) insertAt += 1;
      } else if (needsId && draft.rows[stepIndex]) {
        draft.rows[stepIndex].mergeId = mergeId;
      }
      draft.rows.splice(insertAt, 0, {
        kind: "branchMerge",
        mergeTarget: mergeId,
        mergeBranchId: branchId,
        depth: branchBodyDepthAt(draft.rows, insertAt),
      });
    });
    onSelectRow(mergeInsertAt);
  }

  function handleAddElseIf() {
    if (selectedRowIndex == null || !canAddElseIf(rows, selectedRowIndex))
      return;
    const idx = selectedRowIndex + 1;
    const caseDepth = branchCaseDepthAt(rows, idx);
    insertAt(idx, [
      {
        kind: "branchCase",
        label: "ケース",
        branchColor: null,
        id: rows[findEnclosingStart(rows, selectedRowIndex)]?.id,
        depth: caseDepth,
      },
    ]);
    onSelectRow(idx);
  }

  function handleAddLoop() {
    if (selectedRowIndex == null || !isInsideOpenIf(rows, selectedRowIndex))
      return;
    const idx = selectedRowIndex + 1;
    const start = findEnclosingStart(rows, selectedRowIndex);
    const branchId = rows[start]?.id;
    insertAt(idx, [
      {
        kind: "branchLoop",
        loopBranchId: branchId,
        depth: branchBodyDepthAt(rows, idx),
      },
    ]);
    onSelectRow(idx);
  }

  function handleDelete(index) {
    const row = rows[index];
    if (row.kind === "branchEnd") return;
    if (row.kind === "branchStart") {
      const endIdx = findBranchEndIndex(rows, index);
      if (endIdx < 0) return;
      const msg = row.parallel
        ? "この並行処理と、その中の手順をすべて削除しますか？"
        : "この条件分岐と、その中の手順をすべて削除しますか？";
      if (!window.confirm(msg)) return;
      onEditRows((draft) => {
        draft.rows.splice(index, endIdx - index + 1);
      });
      onSelectRow(Math.max(0, index - 1));
      return;
    }
    onEditRows((draft) => {
      draft.rows.splice(index, 1);
    });
    onSelectRow(Math.max(0, index - 1));
  }

  function handleMove(index, direction) {
    const { canUp, canDown } = getReorderBounds(rows, index);
    if (direction === "up" && !canUp) return;
    if (direction === "down" && !canDown) return;

    const row = rows[index];
    if (row.kind === "branchCase") {
      const target = findAdjacentCaseIndex(rows, index, direction);
      if (target < 0) return;
      onEditRows((draft) => {
        draft.rows = swapCaseBlocks(draft.rows, index, target);
      });
      onSelectRow(target);
      return;
    }

    if (row.kind === "branchStart") {
      const target = findAdjacentBranchBlockIndex(rows, index, direction);
      if (target < 0) return;
      onEditRows((draft) => {
        draft.rows = swapFrameUnits(draft.rows, index, target);
      });
      onSelectRow(target);
      return;
    }

    const target = findAdjacentStepIndex(rows, index, direction);
    if (target < 0) return;
    onEditRows((draft) => {
      draft.rows = swapStepRows(draft.rows, index, target);
    });
    onSelectRow(target);
  }

  function handleMoveTo(fromIndex, insertBefore) {
    const newIndex = resolveMovedIndex(rows, fromIndex, insertBefore);
    onEditRows((draft) => {
      draft.rows = moveUnitToInsertBefore(draft.rows, fromIndex, insertBefore);
    });
    onSelectRow(newIndex);
    setMoveFromIndex(null);
  }

  function handleOutdent(index) {
    if (!canOutdentBranch(rows, index)) return;
    const endIdx = findBranchEndIndex(rows, index);
    if (endIdx < 0) return;
    const removedLen = endIdx - index + 1;
    let parentStart = -1;
    for (let i = index - 1; i >= 0; i--) {
      if (rows[i].kind === "branchStart") {
        parentStart = i;
        break;
      }
    }
    const parentEnd =
      parentStart >= 0 ? findBranchEndIndex(rows, parentStart) : -1;
    const newIndex = parentEnd >= 0 ? parentEnd + 1 - removedLen : index;

    onEditRows((draft) => {
      draft.rows = moveBranchOutOfNest(draft.rows, index);
    });
    onSelectRow(Math.max(0, newIndex));
  }

  const canBranch =
    selectedRowIndex != null && canAddElseIf(rows, selectedRowIndex);
  const canLoop =
    selectedRowIndex != null && isInsideOpenIf(rows, selectedRowIndex);
  const canAnd =
    selectedRowIndex != null && canAddAnd(rows, selectedRowIndex);
  const canMerge =
    selectedRowIndex != null && canAddMerge(rows, selectedRowIndex);

  return (
    <div className="flex flex-col min-h-0 flex-1">
      <div className="px-2 py-2 border-b border-stone-700/60 flex flex-wrap gap-1">
        <p className="w-full text-[10px] font-jp text-stone-500 mb-1">
          手順一覧
        </p>
        <ToolBtn onClick={handleAddStep}>＋ 手順</ToolBtn>
        <ToolBtn onClick={handleAddIf}>＋ 条件</ToolBtn>
        <ToolBtn onClick={handleAddElseIf} disabled={!canBranch}>
          ＋ 分岐
        </ToolBtn>
        <ToolBtn onClick={handleAddLoop} disabled={!canLoop}>
          ＋ ループ
        </ToolBtn>
        <ToolBtn onClick={handleAddFork}>＋ 並行</ToolBtn>
        <ToolBtn onClick={handleAddAnd} disabled={!canAnd}>
          ＋ 並行パス
        </ToolBtn>
        <ToolBtn onClick={handleAddMerge} disabled={!canMerge}>
          ＋ 合流
        </ToolBtn>
      </div>
      <ul className="flex-1 overflow-y-auto text-xs font-jp">
        {rows.length === 0 && (
          <li className="px-3 py-6 text-stone-500 text-center">
            手順がありません。「＋ 手順」で追加してください。
          </li>
        )}
        {rows.map((row, i) => {
          const badge = rowBadgeLabel(row);
          const isSelected = selectedRowIndex === i;
          const depth = rowListIndentDepth(rows, i);
          const isStep = row.kind === "step" && !row.empty;
          const isMovableBranchCase =
            row.kind === "branchCase" &&
            !/^else$/i.test((row.label || "").trim());
          const isMovableBranchStart = row.kind === "branchStart";
          const showReorder =
            isStep || isMovableBranchCase || isMovableBranchStart;
          const { canUp, canDown } = getReorderBounds(rows, i);
          const canMoveTo =
            showReorder && getMoveToTargets(rows, i, lanes).length > 0;
          const canOutdent = isMovableBranchStart && canOutdentBranch(rows, i);
          const summary = rowSummaryText(row, lanes);

          return (
            <li
              key={`row-${i}`}
              className={`flex items-center gap-1 border-b border-stone-800/80 pr-2 ${
                isSelected ? "bg-stone-700" : "hover:bg-stone-800/60"
              }`}
              style={{
                paddingLeft: `${8 + depth * 14}px`
              }}
            >
              {showReorder && (
                <span className="flex flex-col shrink-0">
                  <button
                    type="button"
                    disabled={!canUp}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMove(i, "up");
                    }}
                    className="p-0.5 text-stone-400 hover:text-stone-100 disabled:opacity-30"
                    aria-label="上へ"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    type="button"
                    disabled={!canDown}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMove(i, "down");
                    }}
                    className="p-0.5 text-stone-400 hover:text-stone-100 disabled:opacity-30"
                    aria-label="下へ"
                  >
                    <ChevronDown size={14} />
                  </button>
                </span>
              )}
              {!showReorder && <span className="w-[18px] shrink-0" />}
              <div
                role="button"
                tabIndex={0}
                onClick={() => onSelectRow(i)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelectRow(i);
                  }
                }}
                className="flex-1 text-left py-1.5 min-w-0 flex flex-row items-center cursor-pointer"
              >
                <span
                  className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-medium text-stone-100 mr-1.5 shrink-0 ${rowKindBadgeClass(row)}`}
                  style={branchCaseBadgeStyle(row)}
                >
                  {badge}
                </span>
                <span className="flex-1 text-stone-100 leading-snug line-clamp-2">
                  {summary}
                </span>
              </div>
              {canMoveTo && (
                <button
                  type="button"
                  onClick={() => setMoveFromIndex(i)}
                  className="shrink-0 p-0.5 text-stone-400 hover:text-stone-100"
                  aria-label="移動先を選ぶ"
                  title="移動先を選ぶ"
                >
                  <ArrowRightLeft size={14} />
                </button>
              )}
              {canOutdent && (
                <button
                  type="button"
                  onClick={() => handleOutdent(i)}
                  className="shrink-0 p-0.5 text-stone-400 hover:text-stone-100"
                  aria-label="ネストから出す"
                  title="ネストから出す"
                >
                  <CornerLeftUp size={14} />
                </button>
              )}
              <button
                type="button"
                onClick={() => handleDelete(i)}
                disabled={row.kind === "branchEnd"}
                className="shrink-0 p-1 text-stone-500 hover:text-red-400 disabled:opacity-30"
                aria-label="削除"
              >
                <Trash2 size={13} />
              </button>
            </li>
          );
        })}
      </ul>
      <MoveRowModal
        open={moveFromIndex != null}
        fromIndex={moveFromIndex}
        rows={rows}
        lanes={lanes}
        onClose={() => setMoveFromIndex(null)}
        onPick={(insertBefore) => handleMoveTo(moveFromIndex, insertBefore)}
      />
    </div>
  );
}

function ToolBtn({ children, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="px-2 py-1 rounded text-[10px] font-jp border border-stone-600 text-stone-300 hover:bg-stone-700 disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function findEnclosingStart(rows, rowIndex) {
  for (let i = rowIndex; i >= 0; i--) {
    if (rows[i].kind === "branchStart") return i;
  }
  return -1;
}
