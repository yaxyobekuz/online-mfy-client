import { useCallback, useEffect, useState } from "react";
import { Spinner } from "@heroui/react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import api from "../config/api.js";
import { isLoggedIn, getActiveMahallaUid } from "../config/accounts.js";
import { uniqueSlugs } from "../config/slug.js";
import EmptyState from "./EmptyState.jsx";

// Mahallali manzilga ko'chadigan ichki yo'llar. Boshqa hamma narsa
// (noma'lum manzil) Asosiyga tushadi.
const KNOWN_SECTIONS = ["statistika", "baza", "xonadonlar"];

/**
 * Mahallasiz manzilni mahallali manzilga o'tkazadi:
 *
 *   /             -> /kiyali
 *   /statistika   -> /kiyali/statistika
 *
 * Qaysi mahalla: oxirgi ishlatilgani (localStorage), u yo'q bo'lsa
 * ro'yxatdagi birinchi ishlaydigan mahalla. Shu sababli ilovani
 * oddiygina `mfy.mysrv.uz` deb ochish avvalgidek ishlaydi — faqat
 * endi manzil mahalla nomigacha to'ldiriladi.
 */
const MahallaRedirect = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mahallas, setMahallas] = useState(null);

  const loggedIn = isLoggedIn();

  const refreshMahallas = useCallback(
    () =>
      api
        .get("/api/mfy-tokens")
        .then(setMahallas)
        .catch(() => setMahallas([])),
    [],
  );

  useEffect(() => {
    if (loggedIn) refreshMahallas();
  }, [loggedIn, refreshMahallas]);

  // Bo'sh holatda MFY qo'shilsa — uning manziliga o'tamiz.
  const handleSwitchMahalla = useCallback(
    (uid) => {
      const slug = uniqueSlugs(mahallas ?? []).get(uid);
      if (slug) navigate(`/${slug}`);
    },
    [mahallas, navigate],
  );

  if (!loggedIn) return <Navigate to="/login" replace />;

  if (mahallas === null) {
    return (
      <main className="flex h-svh items-center justify-center bg-canvas">
        <Spinner size="lg" color="accent" aria-label="Yuklanmoqda" />
      </main>
    );
  }

  // Birorta MFY yo'q — yo'naltiradigan manzil yo'q. Bo'sh holat:
  // chap paneldan MFY qo'shiladi, qo'shilgach o'sha mahallaga
  // o'tiladi.
  if (!mahallas.length) {
    return (
      <EmptyState
        mahallas={mahallas}
        onAccountChanged={refreshMahallas}
        onSwitchMahalla={handleSwitchMahalla}
      />
    );
  }

  const current = getActiveMahallaUid();
  const target =
    mahallas.find((m) => m.uid === current) ??
    mahallas.find((m) => !m.hidden && m.status === "active") ??
    mahallas.find((m) => !m.hidden) ??
    mahallas[0];

  const slug = uniqueSlugs(mahallas).get(target.uid);

  // Ichki yo'lni saqlaymiz: "/statistika" -> "/kiyali/statistika".
  const section = location.pathname.replace(/^\/+|\/+$/g, "");
  const suffix = KNOWN_SECTIONS.includes(section) ? `/${section}` : "";

  return <Navigate to={`/${slug}${suffix}${location.search}`} replace />;
};

export default MahallaRedirect;
