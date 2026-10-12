import { useEffect, useState } from "react";
import { Chip } from "@heroui/react";
import {
  RUN_STATUS_COLORS,
  RUN_STATUS_LABELS,
} from "../config/registration-labels.js";
import {
  CheckCircle2,
  CircleSlash,
  Clock,
  Home,
  TriangleAlert,
  UserCheck,
} from "lucide-react";

// Rate-limit kutishi sekundlab sanalib turadi — jarayon qotib
// qolgandek ko'rinmasligi uchun. Qolgan vaqt HISOBLANADI (state
// emas): effect ichida setState qilish ortiqcha render keltiradi.
// Timer faqat "hozir" ni surib boradi, qolgani shundan chiqadi.
const useNow = (isTicking) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!isTicking) return;

    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [isTicking]);

  return now;
};

const secondsLeft = (untilMs, now) =>
  untilMs ? Math.max(0, Math.ceil((untilMs - now) / 1000)) : 0;

const Metric = ({ icon: Icon, label, value, className }) => (
  <div className="rounded-xl border border-border bg-background p-4">
    <div className="flex items-center gap-2 text-xs text-foreground/60">
      <Icon className="size-3.5" aria-hidden="true" />
      {label}
    </div>
    <p className={`mt-1 text-2xl font-semibold ${className ?? "text-foreground"}`}>
      {value}
    </p>
  </div>
);

/**
 * Yurishning jonli holati: bosqich, foiz, hisoblagichlar va
 * hozir ishlanayotgan xonadon.
 */
const RegistrationProgress = ({ run, currentHome }) => {
  const now = useNow(Boolean(run?.waitingUntil));
  const waitSeconds = secondsLeft(run?.waitingUntil, now);

  if (!run) return null;

  const percent = run.homesPercent ?? 0;
  const isRunning = run.status === "running" || run.status === "preparing";

  return (
    <div className="mb-5 rounded-xl border border-border bg-surface p-5">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-foreground">
              {run.mahallaName ?? run.mahallaKey}
            </h2>
            <Chip
              size="sm"
              color={run.isStale ? "warning" : RUN_STATUS_COLORS[run.status]}
            >
              {run.isStale ? "Uzilgan" : RUN_STATUS_LABELS[run.status] ?? run.status}
            </Chip>
          </div>

          <p className="mt-1 text-sm text-foreground/60">
            {run.isStale
              ? "Jarayon uzilib qolgan (server qayta ishga tushgan) — davom ettirish mumkin"
              : (run.stage ?? "—")}
          </p>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {/*
            Tashqi API tezligi — jarayon "qotib qolgandek"
            ko'rinmasligi uchun. Tanaffus qancha katta bo'lsa,
            limitga shuncha yaqin ishlanmoqda.
          */}
          {run.rateLimit?.delayMs != null && (
            <span className="text-xs text-foreground/60">
              tanaffus{" "}
              <span className="font-medium text-foreground">
                {(run.rateLimit.delayMs / 1000).toFixed(1)} s
              </span>
              {run.rateLimit.lastMinute > 0 && (
                <>
                  {" · "}
                  <span className="font-medium text-foreground">
                    {run.rateLimit.lastMinute}
                  </span>{" "}
                  so'rov/daq
                </>
              )}
            </span>
          )}

          {waitSeconds > 0 && (
            <Chip size="sm" color="warning">
              <Clock className="size-3.5" aria-hidden="true" />
              Tashqi API limiti — {waitSeconds} s
            </Chip>
          )}
        </div>
      </div>

      {run.error && (
        <p className="mb-4 rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
          {run.error}
        </p>
      )}

      {/* Xonadonlar bo'yicha umumiy progress */}
      <div className="mb-4">
        <div className="mb-1.5 flex items-center justify-between text-xs text-foreground/60">
          <span>
            Xonadonlar: {run.homesDone} / {run.homesTotal}
          </span>
          <span>{percent}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-border">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              run.status === "error"
                ? "bg-danger"
                : run.status === "done"
                  ? "bg-success"
                  : "bg-accent"
            } ${isRunning ? "animate-pulse" : ""}`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric
          icon={UserCheck}
          label="Ro'yxatga olindi"
          value={run.membersAdded}
          className="text-success"
        />
        <Metric
          icon={TriangleAlert}
          label="Xatolik"
          value={run.membersFailed}
          className={run.membersFailed > 0 ? "text-danger" : undefined}
        />
        <Metric
          icon={CircleSlash}
          label="O'tkazildi"
          value={run.membersSkipped}
          className="text-foreground/60"
        />
        <Metric
          icon={Home}
          label="Xatolikli xonadon"
          value={run.homesFailed}
          className={run.homesFailed > 0 ? "text-warning" : undefined}
        />
      </div>

      {currentHome && (
        <div className="mt-4 rounded-xl border border-accent/30 bg-accent/5 p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-accent">
            <Home className="size-3.5" aria-hidden="true" />
            Hozir ishlanmoqda
          </div>

          <div className="mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
            <p className="text-foreground">
              <span className="text-foreground/50">Kadastr: </span>
              {currentHome.cadasterNumber ?? "—"}
            </p>
            <p className="text-foreground">
              <span className="text-foreground/50">Ko'cha: </span>
              {currentHome.streetName ?? "—"}
              {currentHome.homeNum ? `, ${currentHome.homeNum}-uy` : ""}
            </p>
            <p className="text-foreground">
              <span className="text-foreground/50">Xonadon egasi: </span>
              {currentHome.ownerFullName ?? "—"}
            </p>
            <p className="text-foreground">
              <span className="text-foreground/50">Navbatdagi o'rni: </span>
              {currentHome.queueIndex + 1} / {run.homesTotal}
            </p>
          </div>

          {currentHome.candidatesCount > 0 && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-foreground/60">
              <CheckCircle2 className="size-3.5" aria-hidden="true" />
              Bu xonadonda {currentHome.candidatesCount} nomzoddan{" "}
              {currentHome.addedCount} tasi kiritildi
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default RegistrationProgress;
