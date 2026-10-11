import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Card, Spinner } from "@heroui/react";
import { AlertTriangle, PlayCircle, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import api from "../config/api";
import FamilyAddTerminal from "../components/FamilyAddTerminal.jsx";

const StatCard = ({ label, value, className }) => (
  <Card className="flex h-10 flex-1 flex-row items-center gap-2 px-4 py-0 md:h-9">
    <span className="text-xs text-foreground/60">{label}</span>
    <span className={`text-sm font-semibold ${className ?? "text-foreground"}`}>
      {value}
    </span>
  </Card>
);

const FamilyAddPage = () => {
  const [stats, setStats] = useState(null);
  const [progress, setProgress] = useState(null);
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);

  const pollRef = useRef(null);
  const sinceRef = useRef(0);

  const loadStats = useCallback(
    () => api.get("/api/family-add/stats").then(setStats),
    [],
  );

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => stopPolling, []);

  useEffect(() => {
    loadStats()
      .catch(() => toast.error("Statistikani yuklashda xatolik yuz berdi."))
      .finally(() => setIsLoading(false));
  }, [loadStats]);

  const poll = useCallback(() => {
    pollRef.current = setInterval(() => {
      api
        .get("/api/family-add/status", { params: { since: sinceRef.current } })
        .then((data) => {
          setProgress(data);

          if (data.logs?.length) {
            sinceRef.current = data.logs[data.logs.length - 1].at;
            setLogs((prev) => [...prev, ...data.logs]);
          }

          if (data.status === "done" || data.status === "error") {
            stopPolling();
            loadStats();

            if (data.status === "done") {
              const failed = data.failed ?? 0;
              if (failed > 0) {
                toast.warning(`Tugadi — ${failed} ta yozuvda xatolik bo'ldi`);
              } else {
                toast.success("Barcha oila a'zolari kiritildi");
              }
            } else {
              toast.error("Jarayon xatolik bilan to'xtadi.");
            }
          }
        })
        .catch(() => stopPolling());
    }, 1000);
  }, [loadStats]);

  const start = () => {
    setLogs([]);
    sinceRef.current = 0;

    api
      .post("/api/family-add/start")
      .then((data) => {
        if (data?.message === "Kiritiladigan yozuv yo'q") {
          toast.info("Kiritiladigan yozuv yo'q");
          return;
        }

        setProgress({ status: "running", total: data.total, done: 0, failed: 0 });
        poll();
      })
      .catch((err) => {
        toast.error(
          err?.message === "Jarayon allaqachon ketmoqda"
            ? "Jarayon allaqachon ketmoqda"
            : "Boshlashda xatolik yuz berdi.",
        );
      });
  };

  const resetFailed = () => {
    setIsResetting(true);

    api
      .post("/api/family-add/reset-failed")
      .then((data) => {
        toast.success(`${data.reset} ta yozuv qayta urinishga tayyorlandi`);
        loadStats();
      })
      .catch(() => toast.error("Tozalashda xatolik yuz berdi."))
      .finally(() => setIsResetting(false));
  };

  const isRunning = progress?.status === "running";
  const percent =
    progress?.total > 0
      ? Math.round((progress.done / progress.total) * 100)
      : 0;

  return (
    <div className="py-5">
      <div className="container">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              Oila a'zolarini kiritish
            </h1>
            <p className="text-sm text-foreground/60">
              Yangilangan xom ma'lumotlar Online Mahalla platformasiga
              qo'shiladi
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {stats?.failed > 0 && (
              <Button
                onPress={resetFailed}
                isDisabled={isResetting || isRunning}
                variant="ghost"
              >
                <RotateCcw className="size-4" aria-hidden="true" />
                Xatolarni qayta urinish
              </Button>
            )}

            <Button
              onPress={start}
              isDisabled={isRunning || !stats?.pending}
              variant="secondary"
            >
              <PlayCircle className="size-4" aria-hidden="true" />
              {isRunning ? "Kiritilmoqda..." : "Kiritishni boshlash"}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" color="accent" aria-label="Yuklanmoqda" />
          </div>
        ) : (
          <>
            <div className="mb-5 flex flex-wrap gap-3">
              <StatCard label="Jami yozuvlar" value={stats.total} />
              <StatCard
                label="Kiritishga tayyor"
                value={stats.pending}
                className="text-accent"
              />
              <StatCard
                label="Kiritilgan"
                value={stats.success}
                className="text-success"
              />
              <StatCard
                label="Xatolik"
                value={stats.failed}
                className="text-danger"
              />
              <StatCard
                label="O'tkazib yuborilgan"
                value={stats.skipped}
                className="text-warning"
              />
              <StatCard
                label="Yangilanmagan"
                value={stats.notSynced}
                className="text-foreground/60"
              />
              {stats.expired > 0 && (
                <StatCard
                  label="Hujjati eskirgan"
                  value={stats.expired}
                  className="text-foreground/60"
                />
              )}
            </div>

            {progress && (
              <div className="mb-5 rounded-xl border border-border bg-surface p-4">
                <div className="mb-2 flex items-center justify-between text-sm text-foreground">
                  <span>
                    {progress.status === "done"
                      ? "Yakunlandi"
                      : "Kiritilmoqda..."}
                  </span>
                  <span className="text-foreground/60">
                    {progress.done}/{progress.total} ({percent}%)
                    {progress.failed > 0 && ` — ${progress.failed} ta xato`}
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-border">
                  <div
                    className="h-full rounded-full bg-accent transition-all"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            )}

            <FamilyAddTerminal logs={logs} />

            {stats.notSynced > 0 && (
              <div className="flex items-start gap-2 rounded-xl border border-border bg-surface p-4 text-sm text-foreground/70">
                <AlertTriangle
                  className="mt-0.5 size-4 shrink-0 text-warning"
                  aria-hidden="true"
                />
                <p>
                  {stats.notSynced} ta yozuv hali so'nggi ma'lumotlarga
                  yangilanmagani uchun kiritilmaydi. Avval "Xom ma'lumot"
                  bo'limida yangilang.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FamilyAddPage;
