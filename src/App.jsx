import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import HomePage from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import MainLayout from "./layouts/MainLayout.jsx";
import { StoreProvider } from "./context/StoreContext.jsx";

const App = () => {
  return (
    <StoreProvider>
      <Toaster position="bottom-center" richColors className="font-sans" />
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
