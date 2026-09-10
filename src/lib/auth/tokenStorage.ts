import type { AuthTokensDto } from "@/lib/api/auth";
import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "handdam.accessToken";
const REFRESH_TOKEN_KEY = "handdam.refreshToken";
const LOGIN_SKIPPED_KEY = "handdam.loginSkipped";
const TRAVEL_PROOF_CONSENT_KEY = "handdam.travelProofConsent";

// SecureStore is native-only. On web (and in tests) it throws, so fall back to
// an in-memory map: the session lasts for the run instead of crashing the app.
const memoryStore = new Map<string, string>();

const setItem = async (key: string, value: string) => {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    memoryStore.set(key, value);
  }
};

const getItem = async (key: string) => {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return memoryStore.get(key) ?? null;
  }
};

const removeItem = async (key: string) => {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    memoryStore.delete(key);
  }
};

export const saveTokens = async (tokens: AuthTokensDto) => {
  await Promise.all([
    setItem(ACCESS_TOKEN_KEY, tokens.accessToken),
    setItem(REFRESH_TOKEN_KEY, tokens.refreshToken),
  ]);
};

export const loadTokens = async (): Promise<AuthTokensDto | undefined> => {
  const [accessToken, refreshToken] = await Promise.all([
    getItem(ACCESS_TOKEN_KEY),
    getItem(REFRESH_TOKEN_KEY),
  ]);

  if (!accessToken || !refreshToken) {
    return undefined;
  }

  return { accessToken, refreshToken };
};

export const clearTokens = async () => {
  await Promise.all([
    removeItem(ACCESS_TOKEN_KEY),
    removeItem(REFRESH_TOKEN_KEY),
  ]);
};

export const saveLoginSkipped = () => {
  return setItem(LOGIN_SKIPPED_KEY, "true");
};

export const loadLoginSkipped = async () => {
  return (await getItem(LOGIN_SKIPPED_KEY)) === "true";
};

export const clearLoginSkipped = () => {
  return removeItem(LOGIN_SKIPPED_KEY);
};

// 여행 인증(위치·사진) 동의는 최초 1회만 받는다. 기기에만 남기므로 앱을 지우거나
// 기기를 바꾸면 다시 묻는다.
export const saveTravelProofConsent = () => {
  return setItem(TRAVEL_PROOF_CONSENT_KEY, "true");
};

export const loadTravelProofConsent = async () => {
  return (await getItem(TRAVEL_PROOF_CONSENT_KEY)) === "true";
};
