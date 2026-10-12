/**
 * Ro'yxatga olish bo'limidagi kod -> nom jadvallari.
 *
 * Alohida faylda: bir nechta komponent (jadval, modal, hisobot)
 * bir xil nomlardan foydalanadi, komponent faylidan eksport qilsa
 * esa Vite'ning fast-refresh'i buziladi.
 */

// Odam yozuvining holati.
export const MEMBER_STATUS_LABELS = {
  pending: "Navbatda",
  added: "Kiritildi",
  exists: "Allaqachon bor",
  skipped: "O'tkazildi",
  failed: "Xatolik",
};

export const MEMBER_STATUS_COLORS = {
  pending: "default",
  added: "success",
  exists: "accent",
  skipped: "warning",
  failed: "danger",
};

// Xonadon yozuvining holati.
export const HOME_STATUS_LABELS = {
  pending: "Navbatda",
  processing: "Ishlanmoqda",
  done: "Tugadi",
  partial: "Qisman",
  skipped: "O'tkazildi",
  // Xonadonning o'zi o'qildi, lekin a'zolarining hammasi rad
  // etilgan — "xatolik" deyish chalg'ituvchi bo'lardi.
  failed: "Kirmadi",
};

export const HOME_STATUS_COLORS = {
  pending: "default",
  processing: "accent",
  done: "success",
  partial: "warning",
  skipped: "default",
  failed: "danger",
};

// Yurishning holati.
export const RUN_STATUS_LABELS = {
  pending: "Boshlanmagan",
  preparing: "Tayyorlanmoqda",
  running: "Ketmoqda",
  paused: "To'xtatib turildi",
  done: "Tugadi",
  stopped: "To'xtatildi",
  error: "Xatolik",
};

export const RUN_STATUS_COLORS = {
  pending: "default",
  preparing: "accent",
  running: "accent",
  paused: "warning",
  done: "success",
  stopped: "default",
  error: "danger",
};

// Platformaning kod jadvallari (add_family_member/*.json).
export const STUDY_LEVEL_LABELS = {
  1: "Oliy",
  2: "Tugallanmagan oliy",
  3: "O'rta maxsus",
  4: "O'rta",
  5: "Ma'lumoti yo'q",
};

export const RELATIONSHIP_LABELS = {
  1: "Otasi",
  2: "Onasi",
  3: "Opasi",
  4: "Akasi",
  5: "Singlisi",
  6: "Ukasi",
  7: "Turmush o'rtog'i",
  8: "Qizi",
  9: "O'g'li",
  10: "Qaynotasi",
  11: "Qaynonasi",
  12: "Kelini",
  13: "Boshqa",
  14: "Kuyovi",
  15: "Nabira",
};

export const DOCUMENT_TYPE_LABELS = {
  1: "Passport / ID-karta",
  2: "Tug'ilganlik guvohnomasi",
};
