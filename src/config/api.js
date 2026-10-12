import axios from "axios";

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

api.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem("accessToken");
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
