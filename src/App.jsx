import { Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import LoginPage from "./pages/LoginPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import StatisticsPage from "./pages/StatisticsPage.jsx";
import DatabasePage from "./pages/DatabasePage.jsx";
import HomeMembersPage from "./pages/HomeMembersPage.jsx";
import MainLayout from "./layouts/MainLayout.jsx";
import MahallaRedirect from "./layouts/MahallaRedirect.jsx";
import { StoreProvider } from "./context/StoreContext.jsx";

/**
 * Manzillar mahalla NOMI ustiga qurilgan — `instagram.com/{user}`
 * kabi:
 *
 *   /kiyali              — Asosiy
 *   /kiyali/statistika   — Statistika
 *   /kiyali/baza         — Umumiy ma'lumotlar ba'zasi
 *   /kiyali/xonadonlar   — Qo'shimcha a'zolar
 *
 * Shu sababli qaysi mahalladaligimiz MANZILDAN o'qiladi, oldingidek
 * localStorage'dan emas: havolani ulashish, yangi oynada ochish va
 * "orqaga" tugmasi tabiiy ishlaydi.
 *
 * Mahallasiz manzil (`/`, `/statistika`) — oxirgi ishlatilgan
 * mahallaga yo'naltiriladi (`MahallaRedirect`).
 */
const App = () => {
  return (
    <StoreProvider>
      <Toaster position="bottom-center" richColors className="font-sans" />
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/:mahallaSlug" element={<MainLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="statistika" element={<StatisticsPage />} />
          <Route path="baza" element={<DatabasePage />} />
          <Route path="xonadonlar" element={<HomeMembersPage />} />
        </Route>

        {/*
          Mahalla ko'rsatilmagan har qanday manzil — mahallali
          ko'rinishga o'tkaziladi. Ichki yo'l saqlanadi:
          "/statistika" -> "/kiyali/statistika".
        */}
        <Route path="*" element={<MahallaRedirect />} />
      </Routes>
    </StoreProvider>
  );
};

export default App;
