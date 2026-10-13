import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import logo from "../assets/logo.png";
import api from "../config/api.js";
import {
  getActiveToken,
  setActiveAccount,
  upsertAccount,
} from "../config/accounts.js";

/**
 * Kirish — token orqali.
 *
 * Token qaysi MFY ga tegishli bo'lsa, butun ish o'sha mahalla
 * ustida ketadi: alohida mahalla tanlash yo'q.
 */
const LoginPage = () => {
  const navigate = useNavigate();

  // Hook'lar har doim BIR XIL tartibda chaqirilishi shart — shuning
  // uchun ular erta `return` dan oldin turadi.
  const [accessToken, setAccessToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Hisob allaqachon bor — asosiy sahifaga.
  if (getActiveToken()) return <Navigate to="/" replace />;

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!accessToken.trim()) return;

    setIsSubmitting(true);

    api
      .get("/api/user", {
        headers: { Authorization: `Bearer ${accessToken.trim()}` },
      })
      .then((user) => {
        // Birinchi hisob ro'yxatga yoziladi va darhol faol
        // bo'ladi. Keyinchalik chap paneldan boshqa MFY tokeni
        // qo'shilishi mumkin.
        upsertAccount({
          uid: user.uid,
          username: user.username,
          token: accessToken.trim(),
        });
        setActiveAccount(user.uid);

        navigate("/", { state: { user } });
      })
      .catch(() => {
        toast.error("Access key noto'g'ri yoki foydalanuvchi topilmadi.");
      })
      .finally(() => setIsSubmitting(false));
  };

  return (
    <main className="flex min-h-svh items-center justify-center bg-canvas p-2">
      <div className="flex w-full max-w-md flex-col items-center gap-6 rounded-3xl bg-panel p-8">
        <img src={logo} alt="" className="size-16 object-contain" />

        <div className="text-center">
          <h1 className="text-xl font-bold text-ink">Onlayn mahalla</h1>
          <p className="text-sm text-muted">Davom etish uchun tokenni kiriting</p>
        </div>

        <form className="flex w-full flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex items-center gap-2 rounded-xl bg-canvas px-4 py-3">
            <input
              required
              name="accessToken"
              autoComplete="off"
              aria-label="Token"
              value={accessToken}
              placeholder="Tokenni kiriting"
              type={isVisible ? "text" : "password"}
              onChange={(event) => setAccessToken(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted"
            />

            <button
              type="button"
              onClick={() => setIsVisible((visible) => !visible)}
              aria-label={isVisible ? "Tokenni yashirish" : "Tokenni ko'rsatish"}
              className="shrink-0 text-muted transition-colors hover:text-ink"
            >
              {isVisible ? (
                <EyeOff className="size-5" aria-hidden="true" />
              ) : (
                <Eye className="size-5" aria-hidden="true" />
              )}
            </button>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-brand px-6 py-4 text-base font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isSubmitting ? "Kirish..." : "Kirish"}
          </button>
        </form>
      </div>
    </main>
  );
};

export default LoginPage;
