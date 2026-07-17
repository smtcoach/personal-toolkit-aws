import { getAppConfig } from "./config";
import { clearAuth, getValidAccessToken } from "./auth";

export async function apiFetch(path, options, auth, setAuth, onAuthExpired) {
  const config = getAppConfig();
  const { auth: nextAuth, token } = await getValidAccessToken(auth, config);

  if (!token) {
    clearAuth();
    setAuth(null);
    onAuthExpired?.("Sign in to continue.");
    throw new Error("Authentication required");
  }

  if (nextAuth !== auth) {
    setAuth(nextAuth);
  }

  const headers = new Headers(options?.headers || {});
  headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${config.apiUrl}${path}`, {
    ...options,
    headers
  });

  if (res.status === 401 || res.status === 403) {
    clearAuth();
    setAuth(null);
    onAuthExpired?.("Your session is no longer valid. Please sign in again.");
  }

  return res;
}

export async function readApiErrorMessage(res, fallback) {
  try {
    const data = await res.json();
    return (data && (data.message || data.error)) || fallback;
  } catch {
    return fallback;
  }
}
