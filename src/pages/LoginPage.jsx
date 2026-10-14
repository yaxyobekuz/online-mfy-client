import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import logo from "../assets/logo.png";
import api from "../config/api.js";
import { isLoggedIn, setSession } from "../config/accounts.js";

/**
 * Kirish — SERVER paroli orqali.
 *
 * MFY tokenlari endi serverda; bu yerda faqat serverga kirish
 * (bitta parol) amalga oshadi. Muvaffaqiyatli bo'lsa sessiya
 * saqlanadi va asosiy sahifaga o'tiladi, u yerda MFY tanlanadi.
 */
const LoginPage = () => {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Allaqachon kirgan — asosiy sahifaga.
  if (isLoggedIn()) return <Navigate to="/" replace />;

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!password.trim()) return;

    setIsSubmitting(true);

    api
      .post("/api/auth/login", { password: password.trim() })
      .then((data) => {
        setSession(data.session);
        navigate("/", { replace: true });
      })
      .catch((err) => {
        toast.error(err?.message ?? "Parol noto'g'ri");
      })
      .finally(() => setIsSubmitting(false));
  };

  return (
    <main className="flex min-h-svh items-center justify-center bg-canvas p-2">
      <div className="flex w-full max-w-md flex-col items-center gap-6 rounded-3xl bg-panel p-8">
        <img src={logo} alt="" className="size-16 object-contain" />

        <div className="text-center">
          <h1 className="text-xl font-bold text-ink">Onlayn mahalla</h1>
          <p className="text-sm text-muted">Davom etish uchun parolni kiriting</p>
        </div>

        <form className="flex w-full flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex items-center gap-2 rounded-xl bg-canvas px-4 py-3">
            <input
              required
              name="password"
              autoComplete="current-password"
              aria-label="Parol"
              value={password}
              placeholder="Parolni kiriting"
              type={isVisible ? "text" : "password"}
              onChange={(event) => setPassword(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted"
            />

            <button
              type="button"
              onClick={() => setIsVisible((visible) => !visible)}
              aria-label={isVisible ? "Parolni yashirish" : "Parolni ko'rsatish"}
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
