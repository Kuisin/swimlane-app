import { openAppPopup } from "./open-app-popup";
import {
  STEP_INSPECTOR_CHANNEL,
  postStepInspectorMessage,
} from "./step-inspector-channel";

const WINDOW_NAME = "swimlane-step-inspector";

export function getStepInspectorPopupUrl(documentId, rowIndex) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const params = new URLSearchParams();
  if (documentId) params.set("doc", documentId);
  if (rowIndex != null) params.set("row", String(rowIndex));
  const query = params.toString();
  return `${window.location.origin}${base}/gui/step-inspector${query ? `?${query}` : ""}`;
}

export function syncStepInspectorPopup(documentId, rowIndex, popupRef) {
  const existing = popupRef?.current;
  if (!existing || existing.closed) return null;

  postStepInspectorMessage(existing, {
    type: "navigate",
    documentId,
    rowIndex,
  });
  existing.focus();
  return existing;
}

export function openStepInspectorPopup(documentId, rowIndex, popupRef) {
  const existing = syncStepInspectorPopup(documentId, rowIndex, popupRef);
  if (existing) return existing;

  const url = getStepInspectorPopupUrl(documentId, rowIndex);
  const popup = openAppPopup(url, WINDOW_NAME, {
    width: 440,
    height: 640,
  });

  if (!popup) return null;

  if (popupRef) popupRef.current = popup;
  return popup;
}

export { STEP_INSPECTOR_CHANNEL };
