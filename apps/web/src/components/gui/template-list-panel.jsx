import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export function TemplateListPanel({
  defaultItems,
  docItems,
  renderListItem,
  renderDetail,
  onAddDoc,
  addDocLabel = "追加",
  guardUnsaved,
  onReorderDocItem,
  docReorderHint,
}) {
  const [tab, setTab] = useState("doc");
  const [selectedId, setSelectedId] = useState(null);

  const items = tab === "default" ? defaultItems : docItems;
  const selected =
    items.find((item) => itemKey(item) === selectedId) || items[0] || null;

  function tryNavigate(next) {
    if (guardUnsaved && !guardUnsaved()) return false;
    next();
    return true;
  }

  function selectItem(key) {
    tryNavigate(() => setSelectedId(key));
  }

  function handleReorder(item, direction) {
    if (guardUnsaved && !guardUnsaved()) return;
    onReorderDocItem?.(item, direction);
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex border-b border-stone-200">
        <TabButton
          active={tab === "default"}
          onClick={() => tryNavigate(() => setTab("default"))}
        >
          既定
        </TabButton>
        <TabButton
          active={tab === "doc"}
          onClick={() => tryNavigate(() => setTab("doc"))}
        >
          ドキュメント
        </TabButton>
        {tab === "doc" && onAddDoc && (
          <button
            type="button"
            onClick={onAddDoc}
            className="ml-auto mr-2 my-1 px-2 py-1 text-[10px] font-jp border border-stone-300 rounded hover:bg-stone-100"
          >
            {addDocLabel}
          </button>
        )}
      </div>
      <div className="flex flex-1 min-h-0">
        <div className="w-52 shrink-0 border-r border-stone-200 flex flex-col min-h-0">
          {tab === "doc" && docReorderHint && (
            <p className="px-2 py-1.5 text-[9px] text-stone-500 font-jp border-b border-stone-100 leading-snug">
              {docReorderHint}
            </p>
          )}
          <ul className="flex-1 overflow-y-auto">
            {items.map((item, index) => {
              const key = itemKey(item);
              const active = selected && itemKey(selected) === key;
              const canReorder = tab === "doc" && onReorderDocItem;
              const canUp = canReorder && index > 0;
              const canDown = canReorder && index < items.length - 1;
              return (
                <li
                  key={key}
                  className={`flex items-stretch border-b border-stone-100 ${
                    active ? "bg-stone-200" : "hover:bg-stone-100"
                  }`}
                >
                  {canReorder && (
                    <span className="flex flex-col shrink-0 justify-center border-r border-stone-100/80">
                      <button
                        type="button"
                        disabled={!canUp}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReorder(item, "up");
                        }}
                        className="p-0.5 text-stone-500 hover:text-stone-800 disabled:opacity-30"
                        aria-label="上へ（左のレーン）"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        type="button"
                        disabled={!canDown}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReorder(item, "down");
                        }}
                        className="p-0.5 text-stone-500 hover:text-stone-800 disabled:opacity-30"
                        aria-label="下へ（右のレーン）"
                      >
                        <ChevronDown size={14} />
                      </button>
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => selectItem(key)}
                    className="flex-1 min-w-0 text-left px-2 py-2 text-xs"
                  >
                    {renderListItem(item, tab)}
                  </button>
                </li>
              );
            })}
            {items.length === 0 && (
              <li className="px-2 py-4 text-[10px] text-stone-500 font-jp">
                項目がありません
              </li>
            )}
          </ul>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {selected ? renderDetail(selected, tab) : null}
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 text-xs font-jp ${
        active
          ? "border-b-2 border-stone-900 text-stone-900 font-semibold"
          : "text-stone-500 hover:text-stone-700"
      }`}
    >
      {children}
    </button>
  );
}

function itemKey(item) {
  return item.id || item.title || item.code?.slice(0, 24);
}
