const POPUP_FEATURES = "popup,width=440,height=640,resizable=yes,scrollbars=yes";
const WINDOW_NAME = "swimlane-step-inspector";

export function getStepInspectorPopupUrl(documentId, rowIndex) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const params = new URLSearchParams();
  if (documentId) params.set("doc", documentId);
  if (rowIndex != null) params.set("row", String(rowIndex));
  const query = params.toString();
  return `${window.location.origin}${base}/gui/step-inspector${query ? `?${query}` : ""}`;
}

export function openStepInspectorPopup(documentId, rowIndex, popupRef) {
  const existing = popupRef?.current;
  const url = getStepInspectorPopupUrl(documentId, rowIndex);

  if (existing && !existing.closed) {
    if (existing.location.href !== url) {
      existing.location.href = url;
    }
    existing.focus();
    return existing;
  }

  const popup = window.open(url, WINDOW_NAME, POPUP_FEATURES);

  if (!popup) {
    window.alert(
      "ポップアップを開けませんでした。ブラウザのポップアップブロックを解除してください。"
    );
    return null;
  }

  if (popupRef) popupRef.current = popup;
  return popup;
}
