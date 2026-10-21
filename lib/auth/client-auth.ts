import type { AuthUser } from "@/types/auth";

const tokenKey = "socratic-auth-token";
const userKey = "socratic-auth-user";

function readPersistedValue(key: string) {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(key) ?? window.sessionStorage.getItem(key);
  if (value && !window.localStorage.getItem(key)) window.localStorage.setItem(key, value);
  return value;
}

export function getAuthToken() {
  return readPersistedValue(tokenKey);
}

export function getAuthUser(): AuthUser | null {
  const value = readPersistedValue(userKey);
  if (!value) return null;
  try {
    return JSON.parse(value) as AuthUser;
  } catch {
    clearAuthSession();
    return null;
  }
}

export function saveAuthSession(user: AuthUser, token: string) {
  const serializedUser = JSON.stringify(user);
  window.localStorage.setItem(userKey, serializedUser);
  window.localStorage.setItem(tokenKey, token);
  window.sessionStorage.setItem(userKey, serializedUser);
  window.sessionStorage.setItem(tokenKey, token);
}

export function updateStoredAuthUser(user: AuthUser) {
  const serializedUser = JSON.stringify(user);
  window.localStorage.setItem(userKey, serializedUser);
  window.sessionStorage.setItem(userKey, serializedUser);
}

export function clearAuthSession() {
  window.localStorage.removeItem(userKey);
  window.localStorage.removeItem(tokenKey);
  window.sessionStorage.removeItem(userKey);
  window.sessionStorage.removeItem(tokenKey);
}
