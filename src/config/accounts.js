/**
 * Hisoblar (tokenlar) ro'yxati va qaysi biri FAOL ekani.
 *
 * Har token bitta MFY ga tegishli: tashqi API faqat o'sha token
 * egasining hududidagi xonadonlarni qaytaradi. Shuning uchun
 * "boshqa mahallaga o'tish" = "boshqa tokenni faol qilish".
 *
 * Saqlash joyi — brauzer (`localStorage`). Server tomonda hech
 * narsa o'zgarmaydi: faol hisobning tokeni odatdagidek
 * `Authorization` sarlavhasida ketadi, server esa uni kim
 * ekanini o'zi aniqlaydi. Natijada barcha so'rovlar allaqachon
 * `userUid` bo'yicha ajratilgani uchun hisoblar bir-biriga
 * aralashmaydi.
 *
 * Diqqat: token maxfiy ma'lumot. U faqat shu brauzerda qoladi —
 * boshqa qurilmaga o'tilsa, hisoblar qaytadan qo'shiladi.
 */

const STORE_KEY = "accounts";
const ACTIVE_KEY = "activeAccountUid";

// Eski versiyada token shu kalitda yakka saqlanardi. Yangi
// ro'yxatga o'tganda ham undan foydalanamiz — foydalanuvchi
// qaytadan kirishi shart emas.
const LEGACY_KEY = "accessToken";

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

/**
 * Barcha hisoblar: `[{ uid, username, token, mahallaName }]`.
 *
 * `uid` — server qaytargan foydalanuvchi ID'si, ro'yxatda kalit
 * vazifasini bajaradi (bitta hisob ikki marta qo'shilmasin).
 */
export const getAccounts = () => {
  const raw = readRaw(STORE_KEY);

  if (raw) {
    try {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) return list;
    } catch {
      // Buzilgan yozuv — bo'sh ro'yxatdan boshlaymiz.
    }
  }

  // Eski yakka token — ro'yxatga o'tkazamiz.
  const legacy = readRaw(LEGACY_KEY);
  return legacy ? [{ uid: null, username: null, token: legacy }] : [];
};

const saveAccounts = (list) => {
  writeRaw(STORE_KEY, JSON.stringify(list));
};

/** Faol hisob. Ro'yxat bo'sh bo'lmasa, har doim bittasi faol. */
export const getActiveAccount = () => {
  const list = getAccounts();
  if (!list.length) return null;

  const uid = readRaw(ACTIVE_KEY);
  return list.find((account) => account.uid === uid) ?? list[0];
};

/** Joriy so'rov uchun token — `api.js` va SSE shu yerdan oladi. */
export const getActiveToken = () => getActiveAccount()?.token ?? null;

/**
 * Hisob qo'shadi yoki mavjudini yangilaydi.
 *
 * Bir xil `uid` ikki marta qo'shilmaydi: token yangilangan
 * bo'lishi mumkin, shuning uchun eski yozuv ustiga yoziladi.
 */
export const upsertAccount = ({ uid, username, token, mahallaName }) => {
  const list = getAccounts().filter((account) => account.uid !== uid);

  list.push({ uid, username, token, mahallaName: mahallaName ?? null });
  saveAccounts(list);

  return list;
};

/** Faol hisobni almashtirish. */
export const setActiveAccount = (uid) => {
  writeRaw(ACTIVE_KEY, uid);

  // Eski kalit ham yangilanadi: ilovaning ba'zi joylari (va
  // brauzer yorliqlari) hali shuni o'qiydi.
  const account = getAccounts().find((item) => item.uid === uid);
  if (account) writeRaw(LEGACY_KEY, account.token);
};

/**
 * Hisobni olib tashlash. Faol hisob o'chirilsa, ro'yxatdagi
 * birinchisi faol bo'ladi.
 */
export const removeAccount = (uid) => {
  const list = getAccounts().filter((account) => account.uid !== uid);
  saveAccounts(list);

  if (readRaw(ACTIVE_KEY) === uid) {
    if (list.length) setActiveAccount(list[0].uid);
    else writeRaw(ACTIVE_KEY, null);
  }

  if (!list.length) writeRaw(LEGACY_KEY, null);

  return list;
};

/** Chiqish — barcha hisoblar o'chiriladi. */
export const clearAccounts = () => {
  writeRaw(STORE_KEY, null);
  writeRaw(ACTIVE_KEY, null);
  writeRaw(LEGACY_KEY, null);
};

/** MFY nomini hisobga yozib qo'yamiz — ro'yxatda ko'rinib tursin. */
export const setAccountMahalla = (uid, mahallaName) => {
  const list = getAccounts();
  const account = list.find((item) => item.uid === uid);

  if (!account || account.mahallaName === mahallaName) return;

  account.mahallaName = mahallaName;
  saveAccounts(list);
};
