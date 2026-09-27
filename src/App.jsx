import { Navigate, Route, Routes } from "react-router-dom";
import { ToastProvider } from "@heroui/react";
import HomePage from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import MainLayout from "./layouts/MainLayout.jsx";
import { StoreProvider } from "./context/StoreContext.jsx";

const App = () => {
  return (
    <StoreProvider>
      <ToastProvider placement="bottom-center" />
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<MainLayout />}>
          <Route index element={<HomePage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </StoreProvider>
  );
};

export default App;
