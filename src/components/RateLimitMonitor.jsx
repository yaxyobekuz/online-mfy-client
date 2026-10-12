import { useEffect, useState } from "react";
import { Chip } from "@heroui/react";
import { Activity, Clock, Gauge, Wifi, WifiOff } from "lucide-react";

/**
 * Tashqi API limitining jonli holati.
 *
 * Nega kerak: jarayon ko'pincha "qotib qolgandek" ko'rinadi — aslida
 * u tashqi API limiti tufayli kutayotgan bo'ladi. Bu panel nima
 * bo'layotganini ko'rsatadi: hozirgi tezlik, limitga yetgan-
 * yetmagani va qachon bo'shashi.
 *
 * Har MFY o'z oqimiga ega (o'z tokeni = o'z limiti), shuning uchun
 * har biri alohida ko'rsatiladi.
 */

// Kutish sekundlab sanalib turadi — hisoblanadi, state emas:
// effect ichida setState ortiqcha render keltiradi.
const useNow = (isTicking) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!isTicking) return undefined;

    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, [isTicking]);

  return now;
};

// Tanaffus qancha katta bo'lsa, limitga shuncha yaqin ishlayapti.
const speedColor = (delayMs) => {
  if (delayMs == null) return "text-foreground/50";
  if (delayMs <= 1000) return "text-success";
  if (delayMs <= 5000) return "text-foreground";
  if (delayMs <= 15000) return "text-warning";
  return "text-danger";
};

const RateLimitMonitor = ({ runs, isConnected }) => {
  // Kutayotgan oqim bo'lsa, sekundomer ishlaydi.
  const isWaiting = runs.some(
    (run) => run.waitingUntil || run.rateLimit?.waitingUntil,
  );
  const now = useNow(isWaiting);

  const active = runs.filter((run) => run.isActive);
  if (!active.length) return null;

  // Umumiy o'tkazuvchanlik — barcha oqimlar qo'shilib.
  const totalPerMinute = active.reduce(
    (sum, run) => sum + (run.rateLimit?.lastMinute ?? 0),
    0,
  );

  return (
    <div className="mb-5 rounded-xl border border-border bg-background">
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
        <Activity className="size-4 text-accent" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-foreground">
          Tashqi API holati
        </h2>

        <span className="text-xs text-foreground/50">
          har MFY o'z limitiga ega
        </span>

        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-foreground/60">
            jami{" "}
            <span className="font-medium text-foreground">
              {totalPerMinute}
            </span>{" "}
            so'rov/daqiqa
          </span>

          {/* Jonli ulanish holati — uzilsa darhol ko'rinadi. */}
          <Chip size="sm" color={isConnected ? "success" : "warning"}>
            {isConnected ? (
              <Wifi className="size-3.5" aria-hidden="true" />
            ) : (
              <WifiOff className="size-3.5" aria-hidden="true" />
            )}
            {isConnected ? "Jonli" : "Ulanmoqda..."}
          </Chip>
        </div>
      </div>

      <div className="divide-y divide-border">
        {active.map((run) => {
          const limit = run.rateLimit;
          const waitUntil = run.waitingUntil ?? limit?.waitingUntil ?? null;
          const waitSeconds = waitUntil
            ? Math.max(0, Math.ceil((waitUntil - now) / 1000))
            : 0;

          // Limitga oxirgi marta qachon urilgan.
          const sinceLimit = limit?.lastLimitAt
            ? Math.round((now - limit.lastLimitAt) / 1000)
            : null;

          return (
            <div
              key={run.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-2.5"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-foreground">
                  {run.mahallaName}
                </span>
                <span className="block truncate text-xs text-foreground/50">
                  {run.stage ?? "—"}
                </span>
              </span>

              {/* Hozirgi tezlik */}
              <span className="flex items-center gap-1.5 text-xs">
                <Gauge
                  className={`size-3.5 ${speedColor(limit?.delayMs)}`}
                  aria-hidden="true"
                />
                <span className="text-foreground/50">tanaffus</span>
                <span className={`font-medium ${speedColor(limit?.delayMs)}`}>
                  {limit?.delayMs != null
                    ? `${(limit.delayMs / 1000).toFixed(1)} s`
                    : "—"}
                </span>
              </span>

              {/* Haqiqiy o'tkazuvchanlik */}
              <span className="text-xs text-foreground/60">
                <span className="font-medium text-foreground">
                  {limit?.lastMinute ?? 0}
                </span>{" "}
                so'rov/daq
              </span>

              {/* Kutish holati */}
              {waitSeconds > 0 ? (
                <Chip size="sm" color="warning">
                  <Clock className="size-3.5" aria-hidden="true" />
                  {waitSeconds} s kutilmoqda
                </Chip>
              ) : sinceLimit != null && sinceLimit < 120 ? (
                <Chip size="sm" variant="ghost" color="warning">
                  {sinceLimit} s oldin limitga yetdi
                </Chip>
              ) : (
                <Chip size="sm" color="success">
                  Ishlamoqda
                </Chip>
              )}
            </div>
          );
        })}
      </div>

      <p className="border-t border-border px-4 py-2.5 text-xs text-foreground/50">
        Tashqi API ~5 so'rov / 56 soniya limitini qo'llaydi. Tizim
        so'rovlarni shu oynaga teng taqsimlaydi — shuning uchun tanaffus
        o'zgarib turadi. Limitga yetilganda kutiladi, so'rov yo'qolmaydi.
      </p>
    </div>
  );
};

export default RateLimitMonitor;
