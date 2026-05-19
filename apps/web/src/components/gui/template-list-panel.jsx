import { useState } from "react";

export function TemplateListPanel({
  defaultItems,
  docItems,
  renderListItem,
  renderDetail,
  onAddDoc,
  addDocLabel = "追加",
  guardUnsaved,
}) {
  const [tab, setTab] = useState("default");
  const [selectedId, setSelectedId] = useState(null);

  const items = tab === "default" ? defaultItems : docItems;
  const selected =
    items.find((item) => itemKey(item) === selectedId) || items[0] || null;

  function tryNavigate(next) {
    if (guardUnsaved && !guardUnsaved()) return;
    next();
  }

  function selectItem(key) {
    tryNavigate(() => setSelectedId(key));
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
        <ul className="w-44 shrink-0 border-r border-stone-200 overflow-y-auto">
          {items.map((item) => {
            const key = itemKey(item);
            const active = selected && itemKey(selected) === key;
            return (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => selectItem(key)}
                  className={`w-full text-left px-2 py-2 text-xs border-b border-stone-100 ${
                    active ? "bg-stone-200" : "hover:bg-stone-100"
                  }`}
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
