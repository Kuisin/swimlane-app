import { FilePlus } from "lucide-react";
import { useMemo, useState } from "react";
import { useFolder } from "../context/folder-context";

function buildTree(relPaths) {
  const root = { name: "", path: "", folders: {}, files: [] };
  for (const relPath of relPaths) {
    const parts = relPath.split("/");
    let node = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const folderName = parts[i];
      if (!node.folders[folderName]) {
        const folderPath = parts.slice(0, i + 1).join("/");
        node.folders[folderName] = {
          name: folderName,
          path: folderPath,
          folders: {},
          files: [],
        };
      }
      node = node.folders[folderName];
    }
    node.files.push(relPath);
  }
  return root;
}

function TreeItems({ node, depth, collapsedFolders, onToggleFolder, activeId, onSelect, dirtyIds }) {
  const BASE = 10;
  const STRIDE = 14;
  const FILE_EXTRA = 18;
  const folderLeft = BASE + depth * STRIDE;
  const fileLeft = folderLeft + FILE_EXTRA;

  return (
    <>
      {Object.keys(node.folders)
        .sort()
        .map((folderName) => {
          const folder = node.folders[folderName];
          const isCollapsed = collapsedFolders.has(folder.path);
          return (
            <div key={folder.path}>
              <button
                type="button"
                onClick={() => onToggleFolder(folder.path)}
                className="w-full text-left flex items-center gap-1 py-1.5 text-xs text-stone-600 hover:bg-stone-200/80 truncate"
                style={{ paddingLeft: `${folderLeft}px` }}
              >
                <span
                  className={`inline-block w-2 h-2 border-r border-b border-stone-400 transition-transform ${
                    isCollapsed ? "" : "rotate-45 -translate-y-0.5"
                  }`}
                />
                <span className="truncate font-medium">{folderName}</span>
              </button>
              {!isCollapsed && (
                <TreeItems
                  node={folder}
                  depth={depth + 1}
                  collapsedFolders={collapsedFolders}
                  onToggleFolder={onToggleFolder}
                  activeId={activeId}
                  onSelect={onSelect}
                  dirtyIds={dirtyIds}
                />
              )}
            </div>
          );
        })}
      {node.files
        .slice()
        .sort()
        .map((relPath) => {
          const parts = relPath.split("/");
          const fileName = parts[parts.length - 1];
          const displayName = fileName
            .replace(/^\d+[_\-\s]/, "")
            .replace(/\.txt$/i, "");
          const isActive = relPath === activeId;
          const isDirty = dirtyIds.has(relPath);
          return (
            <button
              key={relPath}
              type="button"
              title={relPath}
              onClick={() => onSelect(relPath)}
              className={`block w-full text-left py-1.5 text-xs truncate border-l-2 ${
                isActive
                  ? "border-stone-900 bg-stone-200/90 text-stone-900 font-medium"
                  : "border-transparent text-stone-700 hover:bg-stone-200/60"
              }`}
              style={{ paddingLeft: `${fileLeft}px`, paddingRight: "8px" }}
            >
              {displayName}
              {isDirty ? " *" : ""}
            </button>
          );
        })}
    </>
  );
}

export function FolderSidebar({ fileIds, activeId, onSelect, dirtyIds, folderPath, width }) {
  const { createNewTxtFile } = useFolder();
  const [collapsedFolders, setCollapsedFolders] = useState(new Set());
  const tree = useMemo(() => buildTree(fileIds), [fileIds]);

  function toggleFolder(folderPathKey) {
    setCollapsedFolders((current) => {
      const next = new Set(current);
      if (next.has(folderPathKey)) next.delete(folderPathKey);
      else next.add(folderPathKey);
      return next;
    });
  }

  const rootName = folderPath?.split(/[/\\]/).pop() || "Files";

  return (
    <aside
      data-resizable-folder={width != null ? "" : undefined}
      className="w-full shrink-0 border-b xl:border-b-0 xl:border-r border-stone-300 bg-stone-50 flex flex-col min-h-0 max-h-[40vh] xl:max-h-none"
      style={
        width != null
          ? { "--panel-folder-width": `${width}px` }
          : undefined
      }
    >
      <div className="px-3 py-2 border-b border-stone-300 shrink-0 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-jp text-stone-500 uppercase tracking-wide">Folder</p>
          <p className="text-xs font-medium text-stone-800 truncate" title={folderPath}>
            {rootName}
          </p>
        </div>
        <button
          type="button"
          onClick={createNewTxtFile}
          title="新規 .txt ファイル"
          className="shrink-0 p-1.5 rounded-sm border border-stone-300 text-stone-600 hover:bg-stone-200 transition"
        >
          <FilePlus size={14} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-1 min-h-0 flex flex-col">
        {fileIds.length === 0 ? (
          <p className="px-3 py-4 text-xs text-stone-500 font-jp">.txt ファイルがありません</p>
        ) : (
          <TreeItems
            node={tree}
            depth={0}
            collapsedFolders={collapsedFolders}
            onToggleFolder={toggleFolder}
            activeId={activeId}
            onSelect={onSelect}
            dirtyIds={dirtyIds}
          />
        )}
      </div>
    </aside>
  );
}
