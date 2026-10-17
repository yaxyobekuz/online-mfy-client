import { useCallback, useEffect, useState } from "react";
import { Spinner } from "@heroui/react";
import { Navigate, Outlet, useNavigate, useParams } from "react-router-dom";
import api from "../config/api";
import {
  isLoggedIn,
  getActiveMahallaUid,
  setActiveMahallaUid,
} from "../config/accounts.js";
import { findMfyBySlug, uniqueSlugs } from "../config/slug.js";
import Sidebar from "../components/Sidebar.jsx";
import EmptyState from "./EmptyState.jsx";

/**
 * Qaysi mahalla ustida ishlayotganimiz MANZILDAN keladi
 * (`/kiyali/...`), localStorage'dan emas. localStorage endi faqat
 * ikki narsa uchun kerak:
 *
 *   1. `api.js` har so'rovga `X-Mahalla-Uid` qo'shadi — shuning
 *      uchun manzildan topilgan uid u yerga ham yoziladi;
 *   2. mahallasiz manzil ochilganda ("/") qayerga yo'naltirishni
 *      bilish uchun — "oxirgi ko'rilgan mahalla".
 */
const MainLayout = () => {
  const { mahallaSlug } = useParams();
  const navigate = useNavigate();

  // MFY ro'yxati SERVERdan olinadi.
  const [mahallas, setMahallas] = useState(null); // null — hali yuklanmagan
  const [mahallaName, setMahallaName] = useState(null);
  const [nameLoadedFor, setNameLoadedFor] = useState(null);

  const loggedIn = isLoggedIn();

  // MFY ro'yxatini serverdan o'qiymiz.
  const refreshMahallas = useCallback(() => {
    return api
      .get("/api/mfy-tokens")
      .then(setMahallas)
      .catch(() => setMahallas([]));
  }, []);

  useEffect(() => {
    if (loggedIn) refreshMahallas();
  }, [loggedIn, refreshMahallas]);

  // Manzildagi nom bo'yicha MFY. Ro'yxat kelmaguncha — `undefined`.
  const active = mahallas ? findMfyBySlug(mahallas, mahallaSlug) : undefined;
  const activeUid = active?.uid ?? null;

  // Faol MFY ni `api.js` uchun yozib qo'yamiz (u har so'rovga
  // `X-Mahalla-Uid` qo'shadi) va "oxirgi ko'rilgan" sifatida
  // eslab qolamiz.
  //
  // Render paytida yozamiz, effektda emas: effekt renderdan KEYIN
  // ishlaydi, pastdagi sahifalar esa o'z so'rovlarini shu render
  // ichidayoq yuborishi mumkin — u holda so'rov eski mahalla uid'i
  // bilan ketardi.
  if (activeUid && getActiveMahallaUid() !== activeUid) {
    setActiveMahallaUid(activeUid);
  }

  // Faol MFY nomini (chap panelda ko'rsatish uchun) dashboard'dan
  // o'qiymiz. MFY almashsa qayta so'raladi.
  useEffect(() => {
    let cancelled = false;

    if (!activeUid) {
      Promise.resolve().then(() => {
        if (!cancelled) {
          setMahallaName(null);
          setNameLoadedFor(null);
        }
      });
      return () => {
        cancelled = true;
      };
    }

    api
      .get("/api/dashboard")
      .then((data) => {
        if (!cancelled) {
          setMahallaName(data.mahalla?.name ?? null);
          setNameLoadedFor(activeUid);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMahallaName(null);
          setNameLoadedFor(activeUid);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeUid]);

  /**
   * MFY almashtirgich chaqiradi: boshqa mahallaga o'tish — endi bu
   * MANZILNI almashtirish. Joriy bo'lim saqlanadi: statistikada
   * turib mahalla almashtirilsa, yangi mahallaning statistikasiga
   * tushadi.
   */
  const handleSwitchMahalla = useCallback(
    (uid) => {
      const slug = uniqueSlugs(mahallas ?? []).get(uid);
      if (!slug) return;

      // "/kiyali/statistika" -> "statistika"
      const section = window.location.pathname
        .split("/")
        .filter(Boolean)
        .slice(1)
        .join("/");

      navigate(`/${slug}${section ? `/${section}` : ""}`);
    },
    [mahallas, navigate],
  );

  if (!loggedIn) return <Navigate to="/login" replace />;

  // MFY ro'yxati hali yuklanmagan.
  if (mahallas === null) return <LoadingContent />;

  // Manzildagi nom bo'yicha mahalla topilmadi.
  if (!active) {
    // Birorta MFY bo'lmasa — bo'sh holat: panel ko'rinadi, undan
    // MFY qo'shiladi. Aks holda manzil noto'g'ri: mavjudiga
    // yo'naltiramiz.
    if (!mahallas.length) {
      return (
        <EmptyState
          mahallas={mahallas}
          onAccountChanged={refreshMahallas}
          onSwitchMahalla={handleSwitchMahalla}
        />
      );
    }
    return <Navigate to="/" replace />;
  }

  // MFY bor, lekin nomi hali yuklanmagan.
  if (nameLoadedFor !== activeUid) return <LoadingContent />;

  return (
    <div className="flex h-svh bg-canvas">
      <Sidebar
        mahallaName={mahallaName}
        active={active}
        mahallas={mahallas}
        onAccountChanged={refreshMahallas}
        onSwitchMahalla={handleSwitchMahalla}
      />
      {/*
        `key` — MFY almashganda sahifa butunlay qaytadan quriladi.
        Aks holda eski mahallaning ko'rsatkichlari yangisi kelguncha
        ekranda qolib turardi.
      */}
      <Outlet key={activeUid} context={{ accountUid: activeUid }} />
    </div>
  );
};

const LoadingContent = () => (
  <main className="flex h-svh items-center justify-center bg-canvas">
    <Spinner size="lg" color="accent" aria-label="Yuklanmoqda" />
  </main>
);

export default MainLayout;
