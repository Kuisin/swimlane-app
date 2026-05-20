import {
  STEP_INSPECTOR_CHANNEL,
  postStepInspectorMessage,
} from "./step-inspector-channel";

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

  if (existing && !existing.closed) {
    postStepInspectorMessage(existing, {
      type: "navigate",
      documentId,
      rowIndex,
    });
    existing.focus();
    return existing;
  }

  const url = getStepInspectorPopupUrl(documentId, rowIndex);
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

export { STEP_INSPECTOR_CHANNEL };
