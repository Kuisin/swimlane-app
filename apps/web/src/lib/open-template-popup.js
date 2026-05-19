const POPUP_FEATURES = "popup,width=960,height=720,resizable=yes,scrollbars=yes";
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
  const popup = window.open(url, WINDOW_NAMES[kind], POPUP_FEATURES);

  if (!popup) {
    window.alert(
      "ポップアップを開けませんでした。ブラウザのポップアップブロックを解除してください。"
    );
    return null;
  }

  popupRefs.current[kind] = popup;
  return popup;
}
