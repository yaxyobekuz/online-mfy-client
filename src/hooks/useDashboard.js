import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import api, { apiBaseUrl } from "../config/api.js";
import { getSession, getActiveMahallaUid } from "../config/accounts.js";

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

  // Optimistik holat: tugma bosilganda tugmani DARHOL almashtiramiz,
  // server tasdig'ini kutmaymiz. Aks holda jarayon to'xtaguncha
  // (bir necha soniya) tugma eski holatda qolib, foydalanuvchi uni
  // qayta-qayta bosardi. null — optimistik holat yo'q, SSE'dagi
  // haqiqiy holat ko'rsatiladi.
  const [optimisticRunning, setOptimisticRunning] = useState(null);
  const optimisticTimerRef = useRef(null);

  // "Hisoblash" holati: null — hali so'ralmagan.
  const [scan, setScan] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

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
            // Sessiya va MFY ulanish paytida o'qiladi — MFY
            // almashsa, qayta ulanishda yangisi ishlatiladi.
            Authorization: `Bearer ${getSession()}`,
            "X-Mahalla-Uid": getActiveMahallaUid() ?? "",
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

    // Tugmani darhol almashtiramiz (optimistik). "start" -> ishlamoqda,
    // "pause"/"stop" -> to'xtagan. Haqiqiy holat SSE orqali kelgach,
    // yoki 12 soniyadan keyin, optimistik holat bekor qilinadi.
    if (action === "start") setOptimisticRunning(true);
    else setOptimisticRunning(false);

    if (optimisticTimerRef.current) clearTimeout(optimisticTimerRef.current);
    optimisticTimerRef.current = setTimeout(
      () => setOptimisticRunning(null),
      12000,
    );

    return api
      .post("/api/dashboard/control", { action })
      .then((data) => {
        toast.success(data.message ?? "Bajarildi");
        return true;
      })
      .catch((err) => {
        // Xato bo'lsa optimistik holatni darhol bekor qilamiz.
        setOptimisticRunning(null);
        toast.error(err?.message ?? "Amalni bajarishda xatolik yuz berdi");
        return false;
      })
      .finally(() => setIsBusy(false));
  }, []);

  const randomStart = useCallback(
    (target) => {
      setIsBusy(true);

      return api
        .post("/api/dashboard/random-start", { target })
        .then((data) => {
          toast.success(data.message ?? "Random rejim boshlandi");
          return true;
        })
        .catch((err) => {
          toast.error(err?.message ?? "Random rejimni boshlashda xatolik");
          return false;
        })
        .finally(() => setIsBusy(false));
    },
    [],
  );

  // --- "Hisoblash" ---
  //
  // Mahallani aniqlash: platformadagi xonadonlar yuklanib, kadastri
  // bo'yicha fuqarolar bazasi bilan solishtiriladi. Bir martalik
  // amal, lekin bir necha daqiqa davom etadi (har ko'cha uchun
  // alohida so'rov + tashqi API limiti), shuning uchun server fonda
  // bajaradi va holat so'rab turiladi.
  const scanTimerRef = useRef(null);

  const pollScan = useCallback(() => {
    api
      .get("/api/mahalla-scan/status")
      .then((data) => {
        setScan(data);

        if (data.status === "running") {
          scanTimerRef.current = setTimeout(pollScan, 2000);
          return;
        }

        setIsScanning(false);

        if (data.status === "done" && data.result) {
          const { homesMatched, peopleTotal, mahalla } = data.result;
          toast.success(
            `${mahalla?.name ?? "Mahalla"} — ${homesMatched} xonadon, ${peopleTotal} fuqaro topildi`,
          );

          // Panel endi mahallani ko'radi — holatni yangilaymiz.
          api.get("/api/dashboard").then(setState).catch(() => {});
        }

        if (data.status === "error") {
          toast.error(data.error ?? "Hisoblashda xatolik");
        }
      })
      .catch(() => {
        setIsScanning(false);
        toast.error("Hisoblash holatini o'qishda xatolik");
      });
  }, []);

  const scanMahalla = useCallback(() => {
    setIsScanning(true);

    return api
      .post("/api/mahalla-scan")
      .then((data) => {
        toast.info(data.message ?? "Hisoblash boshlandi");
        pollScan();
        return true;
      })
      .catch((err) => {
        setIsScanning(false);
        toast.error(err?.message ?? "Hisoblashni boshlashda xatolik");
        return false;
      });
  }, [pollScan]);

  // Sahifa ochilganda hisoblash allaqachon ketayotgan bo'lishi
  // mumkin (boshqa tabda boshlangan yoki sahifa yangilangan).
  useEffect(() => {
    api
      .get("/api/mahalla-scan/status")
      .then((data) => {
        setScan(data);

        if (data.status === "running") {
          setIsScanning(true);
          pollScan();
        }
      })
      .catch(() => {});

    return () => {
      if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
    };
  }, [accountUid, pollScan]);

  const run = state.run;

  // Komponent yopilganda taymerni tozalaymiz.
  useEffect(
    () => () => {
      if (optimisticTimerRef.current) clearTimeout(optimisticTimerRef.current);
    },
    [],
  );

  const realRunning = Boolean(run?.isActive);

  // Optimistik holat haqiqiyга yetib kelgan bo'lsa — uni e'tiborsiz
  // qoldiramiz (effektda setState chaqirmaslik uchun hisoblab
  // olamiz). Taymer baribir 12s dan keyin uni tozalaydi.
  const effectiveRunning =
    optimisticRunning !== null && optimisticRunning !== realRunning
      ? optimisticRunning
      : realRunning;

  return {
    ...state,
    scan,
    isScanning,
    scanMahalla,
    // Xonadonlar hali yuklanmagan bo'lsa, "Hisoblash" kerak.
    needsScan: scan !== null && !scan.homesStored,
    isLoading,
    isConnected,
    isBusy,
    // Jarayon haqiqatan ketyaptimi: "running" deb turgan, lekin
    // ishchisi yo'q yurish ham bor (server qayta ishga tushganda).
    // Optimistik holat bo'lsa — o'sha ko'rsatiladi (tugma darhol
    // almashsin).
    isRunning: effectiveRunning,
    start: () => control("start"),
    pause: () => control("pause"),
    stop: () => control("stop"),
    randomStart,
  };
};
