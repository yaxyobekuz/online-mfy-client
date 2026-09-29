import { ProgressBar } from "@heroui/react";

/**
 * Xonadonlar tafsilotini ommaviy yuklash progressi: foiz, va nechta
 * uy raqami (done/total) yuklanganini ko'rsatadi.
 */
const HomesDetailsSyncProgress = ({ progress, percent }) => {
  if (!progress) return null;

  return (
    <div className="mb-5 rounded-xl border border-border bg-surface p-4">
      <ProgressBar value={percent} minValue={0} maxValue={100}>
        <div className="mb-2 flex items-center justify-between text-sm text-foreground">
          <span>
            {progress.status === "done"
              ? "Yuklandi"
              : "Xonadonlar tafsiloti yuklanmoqda..."}
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
