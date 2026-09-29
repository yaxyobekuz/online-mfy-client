import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import HomePage from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import StreetHomesPage from "./pages/StreetHomesPage.jsx";
import HomesPage from "./pages/HomesPage.jsx";
import HomeDetailsPage from "./pages/HomeDetailsPage.jsx";
import RawRecordsPage from "./pages/RawRecordsPage.jsx";
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
          <Route path="/streets/:streetId" element={<StreetHomesPage />} />
          <Route
            path="/streets/:streetId/homes/:homeId"
            element={<HomeDetailsPage />}
          />
          <Route path="/homes" element={<HomesPage />} />
          <Route path="/raw-records" element={<RawRecordsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </StoreProvider>
  );
};

export default App;
