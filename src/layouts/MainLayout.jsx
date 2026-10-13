import { useEffect, useState } from "react";
import { Spinner } from "@heroui/react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import api from "../config/api";
import { useStore } from "../context/useStore.js";
import Sidebar from "../components/Sidebar.jsx";

const MainLayout = () => {
  const navigate = useNavigate();
  const { set, remove, store } = useStore();

  const hasToken = localStorage.getItem("accessToken");

  // Hook'lar erta `return` dan OLDIN turadi: React ularning har
  // doim bir xil tartibda chaqirilishini talab qiladi. Token
  // yo'qolganda (masalan chiqishda) tartib buzilib, ilova
  // qulashi mumkin edi.
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Token bo'lmasa so'rov yubormaymiz — pastda login'ga
    // yo'naltiriladi.
    if (!hasToken) return;

    api
      .get("/api/user")
      .then((user) => {
        set("user", user);

        // MFY nomi chap panelda har sahifada ko'rinib turishi
        // kerak, shuning uchun uni sahifalar emas, layout o'qiydi.
        return api
          .get("/api/dashboard")
          .then((data) => set("mahallaName", data.mahalla?.name ?? null))
          .catch(() => {
            // MFY hali aniqlanmagan bo'lishi mumkin — bu xato emas.
          });
      })
      .catch(() => {
        remove("user");
        localStorage.removeItem("accessToken");
        navigate("/login");
      })
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasToken]);

  if (!hasToken) return <Navigate to="/login" replace />;
  if (isLoading) return <LoadingContent />;

  return (
    <div className="flex h-svh bg-canvas">
      {/* MFY nomini Asosiy sahifa store'ga yozadi. */}
      <Sidebar mahallaName={store.mahallaName} />
      <Outlet />
    </div>
  );
};

const LoadingContent = () => (
  <main className="flex h-svh items-center justify-center bg-canvas">
    <Spinner size="lg" color="accent" aria-label="Yuklanmoqda" />
  </main>
);

export default MainLayout;
