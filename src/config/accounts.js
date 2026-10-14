/**
 * Kirish holati — brauzerda faqat IKKI narsa saqlanadi:
 *   1. server SESSIYASI (parol orqali olingan),
 *   2. qaysi MFY faol ekani (uid).
 *
 * MFY TOKENLARI endi brauzerda EMAS — ular serverda saqlanadi.
 * Ro'yxat serverdan (`GET /api/mfy-tokens`) olinadi; bu yerda faqat
 * "kim bo'lib kirganmiz va qaysi mahalladamiz" turadi.
 */

const SESSION_KEY = "server_session";
const ACTIVE_KEY = "active_mahalla_uid";

/** `localStorage` ishlamasligi mumkin (maxfiy rejim, bloklangan). */
const readRaw = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeRaw = (key, value) => {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // Saqlab bo'lmasa ham ilova ishlashda davom etadi.
  }
};

// --- Server sessiyasi ---

export const getSession = () => readRaw(SESSION_KEY);
export const setSession = (session) => writeRaw(SESSION_KEY, session);
export const isLoggedIn = () => Boolean(getSession());

// --- Faol MFY (uid) ---

export const getActiveMahallaUid = () => readRaw(ACTIVE_KEY);
export const setActiveMahallaUid = (uid) => writeRaw(ACTIVE_KEY, uid ?? null);

/** Chiqish — sessiya ham, faol MFY ham tozalanadi. */
export const logout = () => {
  writeRaw(SESSION_KEY, null);
  writeRaw(ACTIVE_KEY, null);
};
