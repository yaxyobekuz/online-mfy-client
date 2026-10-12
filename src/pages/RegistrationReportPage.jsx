import { useCallback, useEffect, useState } from "react";
import { Button, Chip, Spinner } from "@heroui/react";
import {
  ArrowLeft,
  BarChart3,
  CircleSlash,
  Clock,
  Home,
  TriangleAlert,
  UserCheck,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../config/api";

const RUN_LABELS = {
  pending: "Boshlanmagan",
  preparing: "Tayyorlanmoqda",
  running: "Ketmoqda",
  paused: "To'xtatib turildi",
  done: "Tugadi",
  stopped: "To'xtatildi",
  error: "Xatolik",
};

const Card = ({ icon: Icon, label, value, hint, className }) => (
  <div className="rounded-xl border border-border bg-background p-4">
    <div className="flex items-center gap-2 text-xs text-foreground/60">
      <Icon className="size-3.5" aria-hidden="true" />
      {label}
    </div>
    <p className={`mt-1 text-2xl font-semibold ${className ?? "text-foreground"}`}>
      {typeof value === "number" ? value.toLocaleString("uz-UZ") : value}
    </p>
    {hint && <p className="mt-0.5 text-xs text-foreground/50">{hint}</p>}
  </div>
);

// Nisbatlarni gorizontal chiziqcha bilan ko'rsatadi — sonlar
// yonida ulush ham ko'rinib turishi uchun.
const Bar = ({ label, count, total, color = "bg-accent", sample, onClick }) => {
  const percent = total > 0 ? Math.round((count / total) * 100) : 0;

  const content = (
    <>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="min-w-0 truncate text-sm text-foreground">{label}</span>
        <span className="shrink-0 text-sm text-foreground/60">
          {count.toLocaleString("uz-UZ")}
          <span className="ml-1 text-xs text-foreground/40">{percent}%</span>
        </span>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-border">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} />
      </div>

      {sample && (
        <p className="mt-1 truncate text-xs text-foreground/40" title={sample}>
          {sample}
        </p>
      )}
    </>
  );

  return onClick ? (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-surface"
    >
      {content}
    </button>
  ) : (
    <div className="px-2 py-1.5">{content}</div>
  );
};

/**
 * Statistika va hisobotlar.
 *
 * `runId` berilsa — bitta yurish bo'yicha, berilmasa barcha
 * yurishlar bo'yicha umumiy. Asosiy savollar: qanchasi kiritildi,
 * qanchasi kiritilmadi va NEGA kiritilmadi.
 */
const RegistrationReportPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const runId = searchParams.get("runId") ?? "";

  // Yuklangan hisobot qaysi yurishga tegishli ekani state'ning
  // o'zida turadi — boshqa yurish tanlanganda eskisi ko'rinmaydi va
  // effect boshida tozalash (setState) kerak bo'lmaydi.
  const [loaded, setLoaded] = useState({ key: null, report: null, runs: [] });

  const load = useCallback(
    () =>
      Promise.all([
        api.get("/api/registration/report", {
          params: runId ? { runId } : undefined,
        }),
        api.get("/api/registration/runs"),
      ])
        .then(([reportData, runData]) =>
          setLoaded({
            key: runId || "umumiy",
            report: reportData,
            runs: runData.items ?? [],
          }),
        )
        .catch(() => {
          toast.error("Hisobotni yuklashda xatolik yuz berdi.");
          setLoaded({ key: runId || "umumiy", report: null, runs: [] });
        }),
    [runId],
  );

  useEffect(() => {
    load();
  }, [load]);

  const isLoading = loaded.key !== (runId || "umumiy");
  const report = isLoading ? null : loaded.report;
  const runs = loaded.runs;

  if (isLoading) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <Spinner size="lg" color="accent" aria-label="Yuklanmoqda" />
      </div>
    );
  }

  const members = report?.members ?? {};
  const homes = report?.homes ?? {};

  // Kiritilmaganlar = xatolik + o'tkazilgan. "Allaqachon bor" buning
  // ichiga kirmaydi: u muammo emas, odam allaqachon ro'yxatda.
  const notAdded = (members.failed ?? 0) + (members.skipped ?? 0);
  const attempted = members.total ?? 0;
  const successPercent =
    attempted > 0 ? Math.round(((members.added ?? 0) / attempted) * 100) : 0;

  return (
    <div className="py-5">
      <div className="container">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <Button variant="ghost" onPress={() => navigate("/registration")}>
            <ArrowLeft className="size-4" aria-hidden="true" />
            Mahallalar
          </Button>

          <div>
            <h1 className="text-xl font-semibold text-foreground">
              Statistika va hisobotlar
            </h1>
            <p className="text-sm text-foreground/60">
              {report?.run
                ? `"${report.run.mahallaName}" — ${RUN_LABELS[report.run.status] ?? report.run.status}`
                : "Barcha yurishlar bo'yicha umumiy"}
            </p>
          </div>
        </div>

        {/* Yurish tanlash */}
        <div className="mb-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSearchParams({})}
            className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
              !runId
                ? "bg-accent text-accent-foreground"
                : "bg-background text-foreground/70 hover:text-foreground"
            }`}
          >
            Umumiy
          </button>

          {runs.map((run) => (
            <button
              key={run.id}
              type="button"
              onClick={() => setSearchParams({ runId: run.id })}
              className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                runId === run.id
                  ? "bg-accent text-accent-foreground"
                  : "bg-background text-foreground/70 hover:text-foreground"
              }`}
            >
              {run.mahallaName ?? run.mahallaKey}
            </button>
          ))}
        </div>

        {/* Asosiy ko'rsatkichlar */}
        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Card
            icon={UserCheck}
            label="Ro'yxatga olindi"
            value={members.added ?? 0}
            hint={`${successPercent}% muvaffaqiyat`}
            className="text-success"
          />
          <Card
            icon={TriangleAlert}
            label="Kiritilmadi"
            value={notAdded}
            hint={`${members.failed ?? 0} xatolik, ${members.skipped ?? 0} o'tkazildi`}
            className={notAdded > 0 ? "text-danger" : undefined}
          />
          <Card
            icon={Users}
            label="Allaqachon ro'yxatda"
            value={members.exists ?? 0}
            hint="Qayta kiritilmadi"
            className="text-foreground/60"
          />
          <Card
            icon={Clock}
            label="O'rtacha vaqt"
            value={report?.avgMs ? `${(report.avgMs / 1000).toFixed(1)} s` : "—"}
            hint="Bitta odam uchun"
          />
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Card icon={Home} label="Xonadon — tugadi" value={homes.done ?? 0} className="text-success" />
          <Card icon={Home} label="Qisman" value={homes.partial ?? 0} className={homes.partial > 0 ? "text-warning" : undefined} />
          <Card icon={CircleSlash} label="O'tkazildi" value={homes.skipped ?? 0} className="text-foreground/60" />
          <Card icon={Home} label="Xatolik" value={homes.failed ?? 0} className={homes.failed > 0 ? "text-danger" : undefined} />
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {/* Nega kiritilmadi — eng muhim bo'lim */}
          <div className="rounded-xl border border-border bg-background">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <TriangleAlert className="size-4 text-warning" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-foreground">
                Nega kiritilmadi — sabablar
              </h2>
              <span className="ml-auto text-xs text-foreground/50">
                {notAdded.toLocaleString("uz-UZ")} yozuv
              </span>
            </div>

            <div className="p-2">
              {!report?.reasons?.length ? (
                <p className="px-2 py-6 text-sm text-foreground/50">
                  Hozircha sabab yo'q — hammasi kiritilgan.
                </p>
              ) : (
                report.reasons.map((reason) => (
                  <Bar
                    key={reason.code}
                    label={reason.label}
                    count={reason.count}
                    total={notAdded}
                    color="bg-warning"
                    sample={reason.sample}
                    // Sababga bosilganda shu sabab bo'yicha odamlar
                    // ro'yxati ochiladi — tafsilotga o'tish uchun.
                    onClick={
                      runId
                        ? () =>
                            navigate(
                              `/registration/runs/${runId}?tab=members&status=${
                                reason.code === "allaqachon_mavjud" ? "exists" : ""
                              }`,
                            )
                        : undefined
                    }
                  />
                ))
              )}
            </div>
          </div>

          {/* Ta'lim darajasi taqsimoti */}
          <div className="rounded-xl border border-border bg-background">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <BarChart3 className="size-4 text-accent" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-foreground">
                Ta'lim darajasi taqsimoti
              </h2>
            </div>

            <div className="p-2">
              {!report?.byStudyLevel?.length ? (
                <p className="px-2 py-6 text-sm text-foreground/50">
                  Hozircha ma'lumot yo'q.
                </p>
              ) : (
                report.byStudyLevel.map((level) => (
                  <Bar
                    key={level.code}
                    label={level.label}
                    count={level.count}
                    total={members.added ?? 0}
                    color="bg-accent"
                  />
                ))
              )}
            </div>

            <p className="border-t border-border px-4 py-2.5 text-xs text-foreground/50">
              Ta'lim darajasi na bazada, na davlat reyestrida bor — yosh va
              jinsga qarab O'zbekiston statistikasiga yaqin taqsimot bilan
              belgilanadi. 7–17 yosh har doim "O'rta", 7 yoshgacha
              "Ma'lumoti yo'q".
            </p>
          </div>
        </div>

        {/* Ko'cha kesimida */}
        {report?.byStreet?.length > 0 && (
          <div className="mt-5 rounded-xl border border-border bg-background">
            <div className="border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold text-foreground">
                Ko'chalar kesimida
              </h2>
            </div>

            <div className="divide-y divide-border">
              {report.byStreet.map((street) => (
                <div
                  key={street.street}
                  className="flex flex-wrap items-center gap-3 px-4 py-2.5"
                >
                  <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                    {street.street}
                  </span>

                  <span className="text-xs text-foreground/50">
                    {street.homes} xonadon
                  </span>

                  <Chip size="sm" color="success">
                    +{street.added}
                  </Chip>

                  {street.failed > 0 && (
                    <Chip size="sm" color="danger">
                      {street.failed} xato
                    </Chip>
                  )}

                  {street.skipped > 0 && (
                    <Chip size="sm" variant="ghost">
                      {street.skipped} o'tdi
                    </Chip>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegistrationReportPage;
