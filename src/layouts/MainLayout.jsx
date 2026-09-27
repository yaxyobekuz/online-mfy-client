import api from "../config/api";
import { useEffect, useState } from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { Spinner } from "@heroui/react";
import { useStore } from "../context/useStore.js";

const MainLayout = () => {
  const navigate = useNavigate();
  const { set, remove } = useStore();

  const hasToken = localStorage.getItem("accessToken");
  if (!hasToken) return <Navigate to="/login" replace />;

  // State variables for managing form input and submission status
  const [isLoading, setIsLoading] = useState(true);

  // Check if the user is already logged in and redirect to the home page if they are
  useEffect(() => {
    api
      .get("/api/user")
      .then((user) => set("user", user))
      .catch(() => {
        remove("user");
        navigate("/login");
        localStorage.removeItem("accessToken");
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <LoadingContent />;

  return <Outlet />;
};

const LoadingContent = () => {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background">
      <Spinner size="lg" color="accent" aria-label="Yuklanmoqda" />
    </main>
  );
};

export default MainLayout;
