import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import LoginPage from "./pages/LoginPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import StatisticsPage from "./pages/StatisticsPage.jsx";
import DatabasePage from "./pages/DatabasePage.jsx";
import HomeMembersPage from "./pages/HomeMembersPage.jsx";
import MainLayout from "./layouts/MainLayout.jsx";
import { StoreProvider } from "./context/StoreContext.jsx";

const App = () => {
  return (
    <StoreProvider>
      <Toaster position="bottom-center" richColors className="font-sans" />
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<MainLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="/statistika" element={<StatisticsPage />} />
          <Route path="/baza" element={<DatabasePage />} />
          <Route path="/xonadonlar" element={<HomeMembersPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </StoreProvider>
  );
};

export default App;
