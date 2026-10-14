import { useCallback, useEffect, useState } from "react";
import { Spinner } from "@heroui/react";
import { Navigate, Outlet } from "react-router-dom";
import api from "../config/api";
import {
  isLoggedIn,
  getActiveMahallaUid,
  setActiveMahallaUid,
} from "../config/accounts.js";
import Sidebar from "../components/Sidebar.jsx";

const MainLayout = () => {
  // MFY ro'yxati SERVERdan olinadi; faol MFY uid brauzerda.
  const [mahallas, setMahallas] = useState(null); // null — hali yuklanmagan
  const [activeUid, setActiveUid] = useState(() => getActiveMahallaUid());
  const [mahallaName, setMahallaName] = useState(null);
  const [nameLoadedFor, setNameLoadedFor] = useState(null);

  const loggedIn = isLoggedIn();

  // MFY ro'yxatini serverdan o'qiymiz.
  const refreshMahallas = useCallback(() => {
    return api
      .get("/api/mfy-tokens")
      .then((list) => {
        setMahallas(list);

        // Faol MFY tanlanmagan yoki o'chirilgan bo'lsa — birinchi
        // aktivni tanlaymiz.
        const current = getActiveMahallaUid();
        const stillExists = list.some((m) => m.uid === current);

        if (!stillExists) {
          const firstActive =
            list.find((m) => m.status === "active") ?? list[0] ?? null;
          setActiveMahallaUid(firstActive?.uid ?? null);
          setActiveUid(firstActive?.uid ?? null);
        } else {
          setActiveUid(current);
        }
      })
      .catch(() => setMahallas([]));
  }, []);

  useEffect(() => {
    if (loggedIn) refreshMahallas();
  }, [loggedIn, refreshMahallas]);

  // Faol MFY nomini (chap panelda ko'rsatish uchun) dashboard'dan
  // o'qiymiz. MFY almashsa qayta so'raladi.
  useEffect(() => {
    let cancelled = false;

    // MFY tanlanmagan — nom yo'q. setState'ni effekt tanasida
    // to'g'ridan-to'g'ri emas, mikrovazifada chaqiramiz (cascading
    // render ogohlantirishi bo'lmasin).
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

  if (!loggedIn) return <Navigate to="/login" replace />;

  // MFY ro'yxati hali yuklanmagan.
  if (mahallas === null) return <LoadingContent />;

  // Birorta MFY yo'q — ro'yxatni ochib qo'shishni kutamiz, lekin
  // sahifa baribir ko'rinadi (bo'sh holat).
  const active = mahallas.find((m) => m.uid === activeUid) ?? null;

  // MFY bor, lekin nomi hali yuklanmagan.
  const isNameLoading = activeUid && nameLoadedFor !== activeUid;
  if (isNameLoading) return <LoadingContent />;

  return (
    <div className="flex h-svh bg-canvas">
      <Sidebar
        mahallaName={mahallaName}
        active={active}
        mahallas={mahallas}
        onAccountChanged={refreshMahallas}
      />
      {/*
        `key` — MFY almashganda sahifa butunlay qaytadan quriladi.
        Aks holda eski mahallaning ko'rsatkichlari yangisi kelguncha
        ekranda qolib turardi.
      */}
      <Outlet key={activeUid ?? "none"} context={{ accountUid: activeUid }} />
    </div>
  );
};

const LoadingContent = () => (
  <main className="flex h-svh items-center justify-center bg-canvas">
    <Spinner size="lg" color="accent" aria-label="Yuklanmoqda" />
  </main>
);

export default MainLayout;
