import api from "../config/api";
import { Spinner } from "@heroui/react";
import { useEffect, useState } from "react";
import { useStore } from "../context/useStore.js";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";

const MainLayout = () => {
  const navigate = useNavigate();
  const { set, remove } = useStore();

  const hasToken = localStorage.getItem("accessToken");

  // State variables for managing form input and submission status
  //
  // Hook'lar erta `return` dan OLDIN turadi: React ularning har
  // doim bir xil tartibda chaqirilishini talab qiladi. Token
  // yo'qolganda (masalan chiqishda) tartib buzilib, ilova
  // qulashi mumkin edi.
  const [isLoading, setIsLoading] = useState(true);

  // Check if the user is already logged in and redirect to the home page if they are
  useEffect(() => {
    // Token bo'lmasa so'rov yubormaymiz — pastda login'ga
    // yo'naltiriladi.
    if (!hasToken) return;

    api
      .get("/api/user")
      .then((user) => set("user", user))
      .catch(() => {
        remove("user");
        navigate("/login");
        localStorage.removeItem("accessToken");
      })
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasToken]);

  if (!hasToken) return <Navigate to="/login" replace />;
  if (isLoading) return <LoadingContent />;

  return (
    <div className="flex min-h-svh">
      <Sidebar />
      <main className="min-w-0 flex-1 bg-surface">
        <Outlet />
      </main>
    </div>
  );
};

const LoadingContent = () => {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background">
      <Spinner size="lg" color="accent" aria-label="Yuklanmoqda" />
    </main>
  );
};

export default MainLayout;
