import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import {
  canAddElseIf,
  findAdjacentStepIndex,
  findBranchEndIndex,
  getReorderBounds,
  isInsideOpenBranch,
  nextBranchId,
  rowBadgeLabel,
  rowSummaryText,
  swapStepRows,
} from "../../lib/flow-rows";

export function FlowStepList({
  rows,
  selectedRowIndex,
  onSelectRow,
  onEditRows,
  lanes,
}) {
  const defaultRole = lanes[0]?.id || "role_applicant";

  function insertAt(index, newRows) {
    onEditRows((draft) => {
      draft.rows.splice(index, 0, ...newRows);
    });
  }

  function handleAddStep() {
    const idx =
      selectedRowIndex != null ? selectedRowIndex + 1 : rows.length;
    insertAt(idx, [
      {
        kind: "step",
        role: defaultRole,
        text: "新しいステップ",
        depth: rows[idx - 1]?.depth ?? 0,
        blockRef: null,
        stepId: `step-new-${Date.now()}`,
      },
    ]);
    onSelectRow(idx);
  }

  function handleAddIf() {
    const idx =
      selectedRowIndex != null ? selectedRowIndex + 1 : rows.length;
    const depth = rows[Math.max(0, idx - 1)]?.depth ?? 0;
    const branchId = nextBranchId(rows);
    insertAt(idx, [
      {
        kind: "branchStart",
        cond: "条件",
        firstCase: "",
        branchColor: null,
        id: branchId,
        depth,
      },
      {
        kind: "branchCase",
        label: "ケース1",
        branchColor: null,
        id: branchId,
        depth,
      },
      {
        kind: "branchCase",
        label: "ケース2",
        branchColor: null,
        id: branchId,
        depth,
      },
      {
        kind: "branchEnd",
        id: branchId,
        depth,
      },
    ]);
    onSelectRow(idx);
  }

  function handleAddElseIf() {
    if (selectedRowIndex == null || !canAddElseIf(rows, selectedRowIndex)) return;
    const idx = selectedRowIndex + 1;
    const depth = rows[selectedRowIndex]?.depth ?? 0;
    insertAt(idx, [
      {
        kind: "branchCase",
        label: "ケース",
        branchColor: null,
        id: rows[findEnclosingStart(rows, selectedRowIndex)]?.id,
        depth,
      },
    ]);
    onSelectRow(idx);
  }

  function handleAddElse() {
    if (selectedRowIndex == null || !canAddElseIf(rows, selectedRowIndex)) return;
    const idx = selectedRowIndex + 1;
    const depth = rows[selectedRowIndex]?.depth ?? 0;
    insertAt(idx, [
      {
        kind: "branchCase",
        label: "else",
        id: rows[findEnclosingStart(rows, selectedRowIndex)]?.id,
        depth,
      },
    ]);
    onSelectRow(idx);
  }

  function handleAddLoop() {
    if (
      selectedRowIndex == null ||
      !isInsideOpenBranch(rows, selectedRowIndex)
    )
      return;
    const idx = selectedRowIndex + 1;
    const start = findEnclosingStart(rows, selectedRowIndex);
    const branchId = rows[start]?.id;
    insertAt(idx, [
      {
        kind: "branchLoop",
        loopBranchId: branchId,
        depth: rows[selectedRowIndex]?.depth ?? 0,
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
      const msg = "この条件分岐と、その中の手順をすべて削除しますか？";
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
    const target = findAdjacentStepIndex(rows, index, direction);
    if (target < 0) return;
    onEditRows((draft) => {
      draft.rows = swapStepRows(draft.rows, index, target);
    });
    onSelectRow(target);
  }

  const canBranch = selectedRowIndex != null && canAddElseIf(rows, selectedRowIndex);
  const canLoop =
    selectedRowIndex != null && isInsideOpenBranch(rows, selectedRowIndex);

  return (
    <div className="flex flex-col min-h-0 flex-1">
      <div className="px-2 py-2 border-b border-stone-700/60 flex flex-wrap gap-1">
        <p className="w-full text-[10px] font-jp text-stone-500 mb-1">手順一覧</p>
        <ToolBtn onClick={handleAddStep}>＋ 手順</ToolBtn>
        <ToolBtn onClick={handleAddIf}>＋ 条件分岐</ToolBtn>
        <ToolBtn onClick={handleAddElseIf} disabled={!canBranch}>
          ＋ 分岐を追加
        </ToolBtn>
        <ToolBtn onClick={handleAddElse} disabled={!canBranch}>
          ＋ その他
        </ToolBtn>
        <ToolBtn onClick={handleAddLoop} disabled={!canLoop}>
          ＋ ループ
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
          const depth = row.depth ?? 0;
          const isStep = row.kind === "step" && !row.empty;
          const { canUp, canDown } = getReorderBounds(rows, i);
          const summary = rowSummaryText(row, lanes);

          return (
            <li
              key={`row-${i}`}
              className={`flex items-center gap-1 border-b border-stone-800/80 ${
                isSelected ? "bg-stone-700" : "hover:bg-stone-800/60"
              }`}
              style={{ paddingLeft: `${8 + depth * 14}px` }}
            >
              {isStep && (
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
              {!isStep && <span className="w-[28px] shrink-0" />}
              <button
                type="button"
                onClick={() => onSelectRow(i)}
                className="flex-1 text-left py-1.5 min-w-0 flex flex-row"
              >
                <span className="inline-block rounded px-1.5 py-0.5 text-[9px] font-medium bg-stone-600 text-stone-100 mr-1.5 shrink-0">
                  {badge}
                </span>
                <span className="text-stone-100 leading-snug line-clamp-2">
                  {summary}
                </span>
              </button>
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

