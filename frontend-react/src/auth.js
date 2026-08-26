import { getAppConfig } from "./config";

const AUTH_STORAGE_KEY = "todoApp_authTokens";
const AUTH_PKCE_KEY = "todoApp_pkce";
const AUTH_STATE_KEY = "todoApp_oauthState";

function base64UrlEncode(bytes) {
  const raw = btoa(String.fromCharCode(...new Uint8Array(bytes)));
  return raw.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function randomBase64Url(byteLength = 32) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

async function sha256Base64Url(value) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(digest);
}

export function decodeJwtPayload(token) {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const normalized = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "="
    );
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function tokenExpired(claims, skewSeconds = 60) {
  if (!claims || typeof claims.exp !== "number") return true;
  return claims.exp <= Math.floor(Date.now() / 1000) + skewSeconds;
}

function saveAuth(tokens) {
  sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(tokens));
  return {
    tokens,
    claims: decodeJwtPayload(tokens.id_token || tokens.access_token || "")
  };
}

export function loadStoredAuth() {
  try {
    const raw = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const tokens = JSON.parse(raw);
    if (!tokens || !tokens.access_token) return null;
    const accessClaims = decodeJwtPayload(tokens.access_token);
    if (tokenExpired(accessClaims, 0) && !tokens.refresh_token) return null;
    return {
      tokens,
      claims: decodeJwtPayload(tokens.id_token || tokens.access_token)
    };
  } catch {
    return null;
  }
}

export function clearAuth() {
  sessionStorage.removeItem(AUTH_STORAGE_KEY);
  sessionStorage.removeItem(AUTH_PKCE_KEY);
  sessionStorage.removeItem(AUTH_STATE_KEY);
}

export function authConfigured(config = getAppConfig()) {
  return Boolean(config.cognitoDomain && config.cognitoClientId);
}

export async function beginSignIn(config = getAppConfig()) {
  if (!authConfigured(config)) {
    throw new Error("Cognito is not configured.");
  }

  const verifier = randomBase64Url(64);
  const challenge = await sha256Base64Url(verifier);
  const state = randomBase64Url(24);
  sessionStorage.setItem(AUTH_PKCE_KEY, verifier);
  sessionStorage.setItem(AUTH_STATE_KEY, state);

  const params = new URLSearchParams({
    response_type: "code",
    client_id: config.cognitoClientId,
    redirect_uri: config.cognitoRedirectUri,
    scope: config.cognitoScopes.join(" "),
    state,
    code_challenge: challenge,
    code_challenge_method: "S256"
  });
  window.location.assign(`${config.cognitoDomain}/oauth2/authorize?${params}`);
}

async function exchangeToken(config, params) {
  const res = await fetch(`${config.cognitoDomain}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error_description || data.error || "Token exchange failed");
  }
  return data;
}

export async function completeAuthRedirect(config = getAppConfig()) {
  if (!authConfigured(config)) return { handled: false, auth: null };

  const url = new URL(window.location.href);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    const errorDescription = url.searchParams.get("error_description") || error;
    url.searchParams.delete("error");
    url.searchParams.delete("error_description");
    history.replaceState({}, document.title, url.pathname + url.search + url.hash);
    return {
      handled: true,
      auth: null,
      error: errorDescription
    };
  }

  if (!code) return { handled: false, auth: null };

  const expectedState = sessionStorage.getItem(AUTH_STATE_KEY);
  const verifier = sessionStorage.getItem(AUTH_PKCE_KEY);
  if (!expectedState || expectedState !== state || !verifier) {
    clearAuth();
    url.searchParams.delete("code");
    url.searchParams.delete("state");
    history.replaceState({}, document.title, url.pathname + url.search + url.hash);
    return {
      handled: true,
      auth: null,
      error: "Could not verify the sign-in response. Please try again."
    };
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: config.cognitoClientId,
    code,
    redirect_uri: config.cognitoRedirectUri,
    code_verifier: verifier
  });
  const tokens = await exchangeToken(config, body);
  const auth = saveAuth(tokens);

  sessionStorage.removeItem(AUTH_PKCE_KEY);
  sessionStorage.removeItem(AUTH_STATE_KEY);
  url.searchParams.delete("code");
  url.searchParams.delete("state");
  history.replaceState({}, document.title, url.pathname + url.search + url.hash);

  return { handled: true, auth };
}

export async function refreshTokens(tokens, config = getAppConfig()) {
  if (!authConfigured(config) || !tokens?.refresh_token) return null;
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: config.cognitoClientId,
    refresh_token: tokens.refresh_token
  });
  const next = await exchangeToken(config, body);
  return saveAuth({ ...tokens, ...next });
}

export async function getValidAccessToken(auth, config = getAppConfig()) {
  if (!auth?.tokens?.access_token) return { auth: null, token: null };

  const accessClaims = decodeJwtPayload(auth.tokens.access_token);
  if (!tokenExpired(accessClaims)) {
    return { auth, token: auth.tokens.access_token };
  }

  try {
    const refreshed = await refreshTokens(auth.tokens, config);
    return {
      auth: refreshed,
      token: refreshed?.tokens?.access_token || null
    };
  } catch {
    clearAuth();
    return { auth: null, token: null };
  }
}

export function signOut(config = getAppConfig()) {
  clearAuth();
  if (!authConfigured(config)) return;
  const params = new URLSearchParams({
    client_id: config.cognitoClientId,
    logout_uri: config.cognitoLogoutUri
  });
  window.location.assign(`${config.cognitoDomain}/logout?${params}`);
}
