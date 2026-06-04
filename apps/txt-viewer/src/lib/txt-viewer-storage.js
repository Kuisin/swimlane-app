export const TXT_VIEWER_STORAGE_KEY = "swimlane-txt-viewer-state-v1";
export const TXT_VIEWER_FOLDER_KEY = "swimlane-txt-viewer-folder-path";

export function isPopupWindow() {
  const hash = window.location.hash;
  return (
    hash.includes("/gui/step-inspector") || hash.includes("/gui/templates/")
  );
}

export function readSavedFolderPath() {
  return localStorage.getItem(TXT_VIEWER_FOLDER_KEY) || "";
}

export function writeSavedFolderPath(folderPath) {
  if (folderPath) {
    localStorage.setItem(TXT_VIEWER_FOLDER_KEY, folderPath);
  } else {
    localStorage.removeItem(TXT_VIEWER_FOLDER_KEY);
  }
}
