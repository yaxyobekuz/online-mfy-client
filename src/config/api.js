import axios from "axios";
import { getActiveToken } from "./accounts.js";

/**
 * Tashqi so'rovlar uchun asosiy manzil.
 *
 * `.env` da manzil slash bilan tugashi mumkin
 * ("http://localhost:5000/"). Axios buni o'zi tuzatadi, lekin
 * `fetch` yo'q — natijada "//api/..." bo'lib 404 qaytaradi.
 * Shuning uchun oxirgi slash shu yerda bir marta olib tashlanadi.
 */
export const apiBaseUrl = String(
  import.meta.env.VITE_API_BASE_URL ?? "",
).replace(/\/+$/, "");

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// Token FAOL hisobdan olinadi. Boshqa mahallaga o'tish shu
// yerda hal bo'ladi: hisob almashsa, keyingi so'rovlar o'z-o'zidan
// yangi token bilan ketadi va server ularni boshqa MFY deb
// qabul qiladi.
//
// Sarlavha ataylab har so'rovda qayta o'qiladi (bir marta
// o'qib qo'yilmaydi) — aks holda hisob almashgach eski token
// ishlatilib qolardi.
api.interceptors.request.use((config) => {
  // So'rovning o'zi token bergan bo'lsa, tegmaymiz: kirish va yangi
  // hisob qo'shish aynan BOSHQA token bilan tekshiriladi (hali
  // ro'yxatda yo'q token). Aks holda interceptor uni faol hisob
  // tokeniga almashtirib, tekshiruv noto'g'ri ketardi.
  if (config.headers.Authorization) return config;

  const accessToken = getActiveToken();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Response
api.interceptors.response.use(
  (res) => res.data,
  (err) => Promise.reject(err.response?.data || err),
);

export default api;
