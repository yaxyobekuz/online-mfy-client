import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import api from "../config/api";

/**
 * Xonadonlar tafsilotini background'da (server tomonda) ommaviy
 * yuklashni boshlaydi va progressni polling orqali kuzatib boradi.
 * `startUrl` — sync boshlaydigan POST endpoint (ko'cha yoki hammasi).
 */
export const useHomesDetailsSync = (startUrl, onFinished) => {
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
        .get("/api/homes/details/sync/status")
        .then((data) => {
          setProgress(data);

          if (data.status === "done" || data.status === "error") {
            stopPolling();

            if (data.status === "done") {
              if (data.failed > 0) {
                toast.warning(
                  `Yuklandi, lekin ${data.failed} ta xonadonda xatolik bo'ldi`,
                );
                setShowErrors(true);
              } else {
                toast.success("Xonadonlar tafsiloti yuklandi");
              }
              onFinished?.();
            } else {
              toast.error("Tafsilotlarni yuklashda xatolik yuz berdi.");
            }
          }
        })
        .catch(() => stopPolling());
    }, 1000);
  };

  const start = ({ onlyMissing = false } = {}) => {
    const url = onlyMissing ? `${startUrl}?onlyMissing=true` : startUrl;

    api
      .post(url)
      .then((data) => {
        if (data?.message === "Yuklanadigan xonadon yo'q") {
          toast.info("Yuklanadigan xonadon yo'q — hammasi allaqachon yuklangan");
          return;
        }

        setProgress({ status: "running", total: 0, done: 0, failed: 0 });
        pollStatus();
      })
      .catch((err) => {
        toast.error(
          err?.message === "Yuklash allaqachon ketmoqda"
            ? "Yuklash allaqachon ketmoqda"
            : "Tafsilotlarni yuklashni boshlashda xatolik yuz berdi.",
        );
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
