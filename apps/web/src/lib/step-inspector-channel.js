export const STEP_INSPECTOR_CHANNEL = "swimlane-step-inspector";

export function postStepInspectorMessage(target, message) {
  if (!target || target.closed) return;
  target.postMessage(
    { channel: STEP_INSPECTOR_CHANNEL, ...message },
    window.location.origin
  );
}

export function isStepInspectorMessage(data) {
  return data?.channel === STEP_INSPECTOR_CHANNEL;
}
