import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import api from "../config/api";

/**
 * Background'da (server tomonda) ommaviy yuklashni boshlaydi va
 * progressni polling orqali kuzatib boradi. Xonadon tafsiloti, oila
 * a'zolari, GCP sinxronizatsiyasi kabi bir nechta joyda qayta
 * ishlatiladi — har biri o'z `startUrl`/`statusUrl` juftini beradi.
 */
export const useHomesDetailsSync = (
  startUrl,
  onFinished,
  {
    statusUrl = "/api/homes/details/sync/status",
    doneMessage = "Yuklandi",
    partialMessage = (failed) => `Yuklandi, lekin ${failed} ta yozuvda xatolik bo'ldi`,
    startFailedMessage = "Yuklashni boshlashda xatolik yuz berdi.",
    runningMessage = "Yuklashda xatolik yuz berdi.",
  } = {},
) => {
  const [progress, setProgress] = useState(null);
  const [showErrors, setShowErrors] = useState(false);
  const pollRef = useRef(null);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => stopPolling, []);

  const pollStatus = () => {
    pollRef.current = setInterval(() => {
      api
        .get(statusUrl)
        .then((data) => {
          setProgress(data);

          if (data.status === "done" || data.status === "error") {
            stopPolling();

            if (data.status === "done") {
              if (data.failed > 0) {
                toast.warning(partialMessage(data.failed));
                setShowErrors(true);
              } else {
                toast.success(doneMessage);
              }
              onFinished?.();
            } else {
              toast.error(runningMessage);
            }
          }
        })
        .catch(() => stopPolling());
    }, 1000);
  };

  // `params` orqali qo'shimcha cheklov berish mumkin (masalan
  // { mahalla: "KOL" } — faqat bitta mahallani yangilash).
  const start = ({ onlyMissing = false, params } = {}) => {
    const query = new URLSearchParams();
    if (onlyMissing) query.set("onlyMissing", "true");
    for (const [name, value] of Object.entries(params ?? {})) {
      if (value !== undefined && value !== null && value !== "") {
        query.set(name, String(value));
      }
    }

    const search = query.toString();
    const url = search ? `${startUrl}?${search}` : startUrl;

    // Promise qaytaramiz: chaqiruvchi jarayon haqiqatan boshlanganini
    // bilib, o'z holatini (masalan "qaysi mahalla yangilanmoqda")
    // to'g'ri tozalay olsin.
    return api
      .post(url)
      .then((data) => {
        if (
          data?.message === "Yuklanadigan xonadon yo'q" ||
          data?.message === "Yangilanadigan yozuv yo'q"
        ) {
          toast.info("Yangilanadigan yozuv yo'q — hammasi allaqachon yuklangan");
          return false;
        }

        setProgress({ status: "running", total: 0, done: 0, failed: 0 });
        pollStatus();
        return true;
      })
      .catch((err) => {
        // Serverdan tushunarli xabar kelgan bo'lsa, o'shani
        // ko'rsatamiz ("Mahalla topilmadi" kabi).
        const known = [
          "Yuklash allaqachon ketmoqda",
          "Mahalla topilmadi",
        ].includes(err?.message);

        toast.error(known ? err.message : startFailedMessage);
        return false;
      });
  };

  const isRunning = progress?.status === "running";
  const percent =
    progress?.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return {
    start,
    isRunning,
    progress,
    percent,
    showErrors,
    setShowErrors,
  };
};
