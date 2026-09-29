import { useEffect, useState } from "react";
import { ProgressBar } from "@heroui/react";

/**
 * Ommaviy yuklash progressi: foiz, va nechta yozuv (done/total)
 * yuklanganini ko'rsatadi. Xonadon tafsiloti, GCP sinxronizatsiyasi
 * kabi bir nechta joyda qayta ishlatiladi.
 */
const HomesDetailsSyncProgress = ({
  progress,
  percent,
  runningLabel = "Xonadonlar tafsiloti yuklanmoqda...",
  doneLabel = "Yuklandi",
}) => {
  // Date.now()ni render paytida emas, faqat effect ichida o'qiymiz —
  // aks holda "impure function during render" qoidasini buzadi.
  // waitingUntil borligida har soniyada yangilanib, qolgan vaqtni
  // hisoblash uchun ishlatiladi.
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!progress?.waitingUntil) return;

    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [progress?.waitingUntil]);

  if (!progress) return null;

  const waitingSeconds = progress.waitingUntil
    ? Math.max(0, Math.ceil((progress.waitingUntil - now) / 1000))
    : null;

  return (
    <div className="mb-5 rounded-xl border border-border bg-surface p-4">
      <ProgressBar value={percent} minValue={0} maxValue={100}>
        <div className="mb-2 flex items-center justify-between text-sm text-foreground">
          <span>
            {progress.status === "done"
              ? doneLabel
              : waitingSeconds !== null
                ? `Rate limitga yetildi, ${waitingSeconds} soniya kutilmoqda...`
                : runningLabel}
          </span>
          <span className="text-foreground/60">
            {progress.done}/{progress.total} ({percent}%)
            {progress.failed > 0 && ` — ${progress.failed} ta xato`}
          </span>
        </div>
        <ProgressBar.Track>
          <ProgressBar.Fill />
        </ProgressBar.Track>
      </ProgressBar>
    </div>
  );
};

export default HomesDetailsSyncProgress;
