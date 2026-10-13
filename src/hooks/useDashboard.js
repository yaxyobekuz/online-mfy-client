import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import api, { apiBaseUrl } from "../config/api.js";
import { getActiveToken } from "../config/accounts.js";

/**
 * Asosiy sahifaning jonli holati.
 *
 * Holat SERVERDA saqlanadi: jarayon orqa fonda ketaveradi, client
 * panel faqat kuzatish uchun. Shuning uchun sahifa yopilib qayta
 * ochilsa ham hech narsa yo'qolmaydi — hook ulanib, joriy holatni
 * o'qiydi va oqimni tinglay boshlaydi.
 *
 * Nega `EventSource` emas: u custom header yubora olmaydi, ya'ni
 * tokenni URL'ga qo'yish kerak bo'lardi — u esa brauzer tarixi va
 * server loglariga tushadi. `fetch` bilan oqimni o'qisak, token
 * odatdagidek `Authorization` header'ida ketadi.
 */
export const useDashboard = (accountUid = null) => {
  const [state, setState] = useState({
    user: null,
    mahalla: null,
    run: null,
    stats: null,
    currentHome: null,
    members: [],
    rateLimit: null,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  const abortRef = useRef(null);
  const retryRef = useRef(null);

  // Birinchi holat — oqim ulanguncha sahifa bo'sh turmasin.
  //
  // `accountUid` o'zgarsa qaytadan so'raladi: boshqa mahallaga
  // o'tilganda eski ko'rsatkichlar ekranda qolib ketmasligi kerak.
  useEffect(() => {
    let cancelled = false;

    api
      .get("/api/dashboard")
      .then((data) => {
        if (!cancelled) setState(data);
      })
      .catch(() => {
        if (!cancelled) toast.error("Ma'lumotlarni yuklashda xatolik yuz berdi");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [accountUid]);

  // Jonli oqim (SSE).
  useEffect(() => {
    let stopped = false;

    const connect = async () => {
      if (stopped) return;

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch(`${apiBaseUrl}/api/dashboard/stream`, {
          headers: {
            // Token ulanish paytida o'qiladi — hisob almashsa,
            // qayta ulanishda yangisi ishlatiladi.
            Authorization: `Bearer ${getActiveToken()}`,
          },
          signal: controller.signal,
        });

        if (!response.ok || !response.body) throw new Error("ulanmadi");

        setIsConnected(true);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        for (;;) {
          const { done, value } = await reader.read();
          if (done || stopped) break;

          buffer += decoder.decode(value, { stream: true });

          // SSE xabarlari bo'sh qator bilan ajratiladi.
          const chunks = buffer.split("\n\n");
          buffer = chunks.pop() ?? "";

          for (const chunk of chunks) {
            // ": ping" — ulanishni tirik ushlab turish uchun.
            if (chunk.startsWith(":")) continue;

            const dataLine = chunk
              .split("\n")
              .find((line) => line.startsWith("data:"));

            if (!dataLine) continue;

            try {
              const payload = JSON.parse(dataLine.slice(5).trim());

              // Oqim MFY va foydalanuvchini qayta yubormaydi —
              // ular o'zgarmaydi, shuning uchun saqlab qolamiz.
              setState((previous) => ({ ...previous, ...payload }));
            } catch {
              // Buzilgan xabar — tashlab yuboramiz.
            }
          }
        }
      } catch {
        // Uzilish yoki xato — pastda qayta ulanamiz.
      }

      setIsConnected(false);

      // Qayta ulanish: darhol emas, 3 soniyadan keyin — server
      // qayta ishga tushayotgan bo'lsa bo'sh urinishlar ko'paymasin.
      if (!stopped) retryRef.current = setTimeout(connect, 3000);
    };

    connect();

    return () => {
      stopped = true;
      abortRef.current?.abort();
      if (retryRef.current) clearTimeout(retryRef.current);
    };
  }, [accountUid]);

  const control = useCallback((action) => {
    setIsBusy(true);

    return api
      .post("/api/dashboard/control", { action })
      .then((data) => {
        toast.success(data.message ?? "Bajarildi");
        return true;
      })
      .catch((err) => {
        toast.error(err?.message ?? "Amalni bajarishda xatolik yuz berdi");
        return false;
      })
      .finally(() => setIsBusy(false));
  }, []);

  const run = state.run;

  return {
    ...state,
    isLoading,
    isConnected,
    isBusy,
    // Jarayon haqiqatan ketyaptimi: "running" deb turgan, lekin
    // ishchisi yo'q yurish ham bor (server qayta ishga tushganda).
    isRunning: Boolean(run?.isActive),
    start: () => control("start"),
    pause: () => control("pause"),
    stop: () => control("stop"),
  };
};
