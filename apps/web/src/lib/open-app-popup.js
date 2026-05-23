function buildPopupFeatures(width, height) {
  return [
    `width=${width}`,
    `height=${height}`,
    "left=80",
    "top=80",
    "resizable=yes",
    "scrollbars=yes",
    "noopener=0",
    "noreferrer=0",
  ].join(",");
}

/**
 * Open a sized auxiliary window. Uses about:blank + navigation so the window
 * is created synchronously during the user gesture (required by Arc / strict
 * popup blockers). Falls back to a new tab when popup windows are blocked.
 */
export function openAppPopup(url, windowName, { width = 960, height = 720 } = {}) {
  const features = buildPopupFeatures(width, height);
  let popup = window.open("about:blank", windowName, features);

  if (!popup) {
    popup = window.open(url, "_blank", "noopener=0,noreferrer=0");
    if (!popup) {
      window.alert(
        "ポップアップを開けませんでした。ブラウザのポップアップブロックを解除してください。"
      );
      return null;
    }
    return popup;
  }

  try {
    popup.location.replace(url);
  } catch {
    popup.location.href = url;
  }

  return popup;
}
