import axios from "axios";
import { getSession, getActiveMahallaUid, logout } from "./accounts.js";

/**
 * Server manzili.
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

// Har so'rovga:
//   - server SESSIYASI (Authorization) — serverga kirish huquqi;
//   - faol MFY uid (X-Mahalla-Uid) — qaysi mahalla ustida ishlash.
//
// Ikkalasi har so'rovda qayta o'qiladi: MFY almashsa, keyingi
// so'rovlar o'z-o'zidan yangi mahalla bilan ketadi. So'rovning o'zi
// Authorization bergan bo'lsa (kirish), tegmaymiz.
api.interceptors.request.use((config) => {
  if (!config.headers.Authorization) {
    const session = getSession();
    if (session) config.headers.Authorization = `Bearer ${session}`;
  }

  // Mahalla uid'ini so'rov o'zi bermagan bo'lsa, faol MFY dan olamiz.
  if (!config.headers["X-Mahalla-Uid"]) {
    const uid = getActiveMahallaUid();
    if (uid) config.headers["X-Mahalla-Uid"] = uid;
  }

  return config;
});

// Javob: 401 — sessiya tugagan, kirish sahifasiga qaytaramiz.
api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response?.status === 401) {
      logout();
      // Kirish sahifasiga — faqat brauzerda.
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err.response?.data || err);
  },
);

export default api;
