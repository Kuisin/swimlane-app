/** Must match the key in public/404.html (GitHub Pages SPA fallback). */
export const SPA_REDIRECT_STORAGE_KEY = "swimlane-spa-redirect";

/** Restore client route after 404.html sent the browser to index.html. */
export function restoreSpaPathFrom404() {
  const stored = sessionStorage.getItem(SPA_REDIRECT_STORAGE_KEY);
  if (!stored) return;
  sessionStorage.removeItem(SPA_REDIRECT_STORAGE_KEY);
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const path = stored.startsWith("/") ? stored : `/${stored}`;
  window.history.replaceState(null, "", `${base}${path}`);
}
