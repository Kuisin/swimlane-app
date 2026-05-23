import { openAppPopup } from "./open-app-popup";

const WINDOW_NAMES = {
  roles: "swimlane-templates-roles",
  blocks: "swimlane-templates-blocks",
  props: "swimlane-templates-props",
};

function getTemplatePopupUrl(kind) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${window.location.origin}${base}/gui/templates/${kind}`;
}

export function openTemplatePopup(kind, popupRefs) {
  const existing = popupRefs.current[kind];
  if (existing && !existing.closed) {
    existing.focus();
    return existing;
  }

  const url = getTemplatePopupUrl(kind);
  const popup = openAppPopup(url, WINDOW_NAMES[kind], {
    width: 960,
    height: 720,
  });

  if (!popup) return null;

  popupRefs.current[kind] = popup;
  return popup;
}
