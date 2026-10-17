/**
 * MFY manzil nomi (slug) — `mfy.mysrv.uz/{mfy_nomi}` uchun.
 *
 * Instagram'dagi `instagram.com/{user}` kabi: har mahallaning o'z
 * doimiy manzili bo'ladi. Manzil mahalla NOMIDAN yasaladi, uid'dan
 * emas — uid foydalanuvchiga hech narsa demaydi, nom esa o'qiladi va
 * eslab qolinadi.
 *
 * Nomlar kirill ham, lotin ham bo'lishi mumkin ("Кияли", "ЗАХКАШ",
 * "Sarnavul") — shuning uchun kirill harflar lotinga o'giriladi.
 */

// Kirill -> lotin. O'zbek kirill alifbosi (rus harflari ham bor:
// platformadan kelgan nomlarda uchraydi).
const CYRILLIC = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  ғ: "g",
  д: "d",
  е: "e",
  ё: "yo",
  ж: "j",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  қ: "q",
  л: "l",
  м: "m",
  н: "n",
  ң: "ng",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ў: "o",
  ф: "f",
  х: "x",
  ҳ: "h",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "sh",
  ъ: "",
  ы: "i",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
};

/**
 * Nomdan manzil yasaydi: "Кияли" -> "kiyali", "ГУЗАР" -> "guzar",
 * "Sarnavul MFY" -> "sarnavul-mfy".
 *
 * Nom yo'q yoki butunlay belgilardan iborat bo'lsa — `null`.
 */
export const toSlug = (name) => {
  if (!name) return null;

  const slug = String(name)
    .trim()
    .toLowerCase()
    // O'zbek lotinidagi tutuq belgilari ("o‘", "g'") — tashlab
    // yuboriladi, "o'zbek" va "ozbek" bir xil manzil bo'lsin.
    .replace(/[’'`‘ʻʼ]/g, "")
    .split("")
    .map((ch) => CYRILLIC[ch] ?? ch)
    .join("")
    // Qolgan hamma narsa (bo'sh joy, nuqta, qavs) — chiziqcha.
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || null;
};

/**
 * MFY uchun manzil nomi. Mahalla nomi bo'lmasa — username, u ham
 * bo'lmasa uid (manzil baribir ishlashi kerak).
 */
export const mfySlug = (mfy) => {
  if (!mfy) return null;
  return toSlug(mfy.mahallaName) ?? toSlug(mfy.username) ?? mfy.uid ?? null;
};

/**
 * Manzildagi nom bo'yicha MFY ni topadi.
 *
 * Avval slug bo'yicha, topilmasa uid bo'yicha qidiriladi — eski
 * (uid'li) havolalar ham ishlayversin.
 *
 * Bir xil nomli ikki mahalla bo'lsa, birinchisi olinadi; ikkinchisi
 * uid orqali ochiladi (`uniqueSlugs` buni hal qiladi).
 */
export const findMfyBySlug = (mahallas, slug) => {
  if (!slug || !mahallas?.length) return null;

  const wanted = String(slug).toLowerCase();
  const slugs = uniqueSlugs(mahallas);

  return (
    mahallas.find((m) => slugs.get(m.uid) === wanted) ??
    mahallas.find((m) => m.uid === slug) ??
    null
  );
};

/**
 * Har MFY uchun TAKRORLANMAS manzil: uid -> slug.
 *
 * Ikki mahalla bir xil nomli bo'lsa, ikkinchisiga raqam qo'shiladi
 * ("kiyali", "kiyali-2") — aks holda ikkalasi bitta manzilni
 * ulashardi va biriga o'tib bo'lmasdi.
 */
export const uniqueSlugs = (mahallas) => {
  const result = new Map();
  const seen = new Map();

  for (const mfy of mahallas ?? []) {
    const base = toSlug(mfy.mahallaName) ?? toSlug(mfy.username) ?? mfy.uid;
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    result.set(mfy.uid, count === 1 ? base : `${base}-${count}`);
  }

  return result;
};
