import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import api from "../config/api";

// Jonli kuzatuv — sekundda bir marta so'raymiz. Jarayon tashqi API
// limiti tufayli baribir sekin ketadi, tez-tez so'rashning foydasi yo'q.
const POLL_MS = 1000;

// Jurnalda nechta qator saqlanadi (serverdagi chegara bilan bir xil).
const LOG_LIMIT = 400;

// Jarayon shu holatlarda tugagan hisoblanadi — kuzatish to'xtatiladi.
const FINISHED = ["done", "stopped", "error", "paused"];

/**
 * Bitta yurishni (MFY ro'yxatga olish jarayonini) jonli kuzatadi:
 * holat, joriy xonadon, oxirgi odamlar va jurnal.
 *
 * Holat SERVERDA (DB'da) saqlanadi, shuning uchun sahifa yangilansa
 * ham kuzatuv yo'qolmaydi: hook ochilganda joriy holatni o'qib,
 * jarayon ketayotgan bo'lsa kuzatuvni o'zi davom ettiradi.
 */
export const useRegistrationRun = (runId) => {
  // Holat yurish ID'si bilan birga saqlanadi: boshqa yurish ochilsa,
  // eskisining ma'lumoti ko'rinmaydi va effect ichida tozalash
  // (setState) kerak bo'lmaydi.
  const [state, setState] = useState({
    runId: null,
    status: null,
    logs: [],
  });

  const pollRef = useRef(null);
  // Oxirgi olingan jurnal qatorining vaqti — faqat yangilarini
  // so'raymiz, shunda har pollingda butun jurnal uzatilmaydi.
  const sinceRef = useRef(0);
  // Tugaganda bir marta xabar berish uchun.
  const notifiedRef = useRef(false);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const fetchStatus = useCallback(() => {
    if (!runId) return Promise.resolve(null);

    return api
      .get(`/api/registration/runs/${runId}/status`, {
        params: { since: sinceRef.current },
      })
      .then((data) => {
        if (data.logs?.length) {
          sinceRef.current = data.logs[data.logs.length - 1].at;
        }

        setState((previous) => {
          // Shu orada boshqa yurish ochilgan bo'lsa, kechikkan
          // javobni yozmaymiz.
          const base = previous.runId === runId ? previous.logs : [];
          const merged = data.logs?.length ? [...base, ...data.logs] : base;

          return {
            runId,
            status: data,
            logs:
              merged.length > LOG_LIMIT
                ? merged.slice(merged.length - LOG_LIMIT)
                : merged,
          };
        });

        const runStatus = data.run?.status;

        // "running" deb turgan, lekin ishchisi yo'q (server qayta
        // ishga tushgan) — kuzatishni davom etirishning ma'nosi yo'q.
        if (FINISHED.includes(runStatus) || data.run?.isStale) {
          stopPolling();

          if (!notifiedRef.current) {
            notifiedRef.current = true;

            if (runStatus === "done") {
              toast.success(
                `Tugadi — ${data.run.membersAdded} odam ro'yxatga olindi`,
              );
            } else if (runStatus === "error") {
              toast.error(data.run.error ?? "Jarayonda xatolik yuz berdi");
            } else if (data.run?.isStale) {
              toast.warning(
                'Jarayon uzilgan — "Davom ettirish" bilan tiklang',
              );
            }
          }
        }

        return data;
      })
      .catch(() => {
        stopPolling();
        return null;
      });
  }, [runId, stopPolling]);

  const startPolling = useCallback(() => {
    stopPolling();
    notifiedRef.current = false;
    pollRef.current = setInterval(fetchStatus, POLL_MS);
  }, [fetchStatus, stopPolling]);

  // Yurish ochilganda holatni o'qiymiz va kerak bo'lsa kuzatuvni
  // o'zimiz boshlaymiz — sahifa yangilangan bo'lsa ham.
  useEffect(() => {
    sinceRef.current = 0;
    notifiedRef.current = false;

    if (!runId) return stopPolling;

    fetchStatus().then((data) => {
      const runStatus = data?.run?.status;
      if (
        (runStatus === "running" || runStatus === "preparing") &&
        !data.run.isStale
      ) {
        startPolling();
      }
    });

    return stopPolling;
  }, [runId, fetchStatus, startPolling, stopPolling]);

  // --- Boshqaruv ---

  const control = useCallback(
    (action) =>
      api
        .post(`/api/registration/runs/${runId}/control`, { action })
        .then((data) => {
          if (action === "resume") {
            startPolling();
          } else {
            // To'xtatish darhol emas: ishchi joriy xonadonni tugatib
            // bo'ysunadi. Shu sababli tugaganda qayta xabar
            // bermaymiz — foydalanuvchi o'zi so'ragan.
            notifiedRef.current = true;
            fetchStatus();
          }

          toast.success(data.message ?? "Bajarildi");
          return true;
        })
        .catch((err) => {
          toast.error(err?.message ?? "Amalni bajarishda xatolik");
          return false;
        }),
    [runId, startPolling, fetchStatus],
  );

  // Boshqa yurishning (kechikkan) ma'lumotini ko'rsatmaymiz.
  const status = state.runId === runId ? state.status : null;
  const run = status?.run ?? null;
  const isRunning = run?.status === "running" || run?.status === "preparing";

  return {
    run,
    currentHome: status?.currentHome ?? null,
    recentMembers: status?.recentMembers ?? [],
    logs: state.runId === runId ? state.logs : [],
    // Hali birinchi javob kelmagan payt.
    isLoading: Boolean(runId) && !status,
    isRunning: isRunning && !run?.isStale,
    isStale: Boolean(run?.isStale),
    refresh: fetchStatus,
    pause: () => control("pause"),
    resume: () => control("resume"),
    stop: () => control("stop"),
  };
};
