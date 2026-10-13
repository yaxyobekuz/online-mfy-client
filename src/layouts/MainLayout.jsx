import { useCallback, useEffect, useState } from "react";
import { Spinner } from "@heroui/react";
import { Navigate, Outlet } from "react-router-dom";
import api from "../config/api";
import {
  clearAccounts,
  getAccounts,
  getActiveAccount,
  setAccountMahalla,
  upsertAccount,
} from "../config/accounts.js";
import Sidebar from "../components/Sidebar.jsx";

const MainLayout = () => {
  // Hisoblar ro'yxati va faol hisob — butun ilovaning "kim
  // nomidan ishlayapmiz" savoliga javobi.
  const [accounts, setAccounts] = useState(() => getAccounts());
  const [active, setActive] = useState(() => getActiveAccount());

  // Yuklangan ma'lumot qaysi hisobga tegishli ekani kalit bilan
  // saqlanadi: shunda "yuklanyaptimi" savoli state'ning o'zidan
  // ko'rinadi va effect boshida setState chaqirish kerak
  // bo'lmaydi (React buni tavsiya qilmaydi).
  const [loaded, setLoaded] = useState({ uid: null, mahallaName: null });

  const hasAccount = Boolean(active?.token);
  const activeUid = active?.uid ?? null;

  // Hisob almashganda ro'yxatni ham, faolni ham qayta o'qiymiz.
  const refreshAccounts = useCallback(() => {
    setAccounts(getAccounts());
    setActive(getActiveAccount());
  }, []);

  useEffect(() => {
    if (!hasAccount) return undefined;

    let cancelled = false;

    api
      .get("/api/user")
      .then((user) => {
        // Hisob eski (`uid` siz) yozuvdan kelgan bo'lishi mumkin —
        // serverdan kelgan ma'lumot bilan to'ldiramiz.
        if (!activeUid && user?.uid) {
          upsertAccount({
            uid: user.uid,
            username: user.username,
            token: active.token,
          });
          if (!cancelled) refreshAccounts();
        }

        // MFY nomi chap panelda har sahifada ko'rinib turishi
        // kerak, shuning uchun uni sahifalar emas, layout o'qiydi.
        return api
          .get("/api/dashboard")
          .then((data) => {
            const name = data.mahalla?.name ?? null;
            const uid = user?.uid ?? activeUid;

            // Nomni hisobga yozib qo'yamiz: hisoblar ro'yxatida
            // qaysi biri qaysi mahalla ekani ko'rinib tursin.
            if (uid) setAccountMahalla(uid, name);

            if (!cancelled) {
              setLoaded({ uid: activeUid, mahallaName: name });
              refreshAccounts();
            }
          })
          .catch(() => {
            // MFY hali aniqlanmagan bo'lishi mumkin — bu xato emas.
            if (!cancelled) setLoaded({ uid: activeUid, mahallaName: null });
          });
      })
      .catch(() => {
        // Token yaroqsiz — hisoblarni tozalab, kirish sahifasiga.
        clearAccounts();
        if (!cancelled) refreshAccounts();
      });

    return () => {
      cancelled = true;
    };
  }, [hasAccount, activeUid, active?.token, refreshAccounts]);

  if (!hasAccount) return <Navigate to="/login" replace />;

  const isLoading = loaded.uid !== activeUid;
  if (isLoading) return <LoadingContent />;

  return (
    <div className="flex h-svh bg-canvas">
      <Sidebar
        mahallaName={loaded.mahallaName}
        active={active}
        accounts={accounts}
        onAccountChanged={refreshAccounts}
      />
      {/*
        `key` — hisob almashganda sahifa butunlay qaytadan
        quriladi. Aks holda eski mahallaning ko'rsatkichlari
        yangisi kelguncha ekranda qolib turardi.
      */}
      <Outlet key={activeUid ?? "default"} context={{ accountUid: activeUid }} />
    </div>
  );
};

const LoadingContent = () => (
  <main className="flex h-svh items-center justify-center bg-canvas">
    <Spinner size="lg" color="accent" aria-label="Yuklanmoqda" />
  </main>
);

export default MainLayout;
