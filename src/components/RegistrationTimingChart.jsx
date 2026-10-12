import { useEffect, useState } from "react";
import { Spinner } from "@heroui/react";
import { toast } from "sonner";
import api from "../config/api";

/**
 * Har bir so'rovga ketgan vaqt — chart.
 *
 * Nega kerak: tezlik bir tekis emas. Baland cho'qqilar — tashqi API
 * limitidagi kutish (56 soniyagacha), past qism — tez ishlagan payt.
 * Mahalla xodimi shundan jarayon qachon sekinlashganini ko'radi.
 *
 * Chart kutubxonasiz, oddiy SVG bilan chizilgan: bitta chiziq uchun
 * qo'shimcha bog'liqlik qo'shish ortiqcha bo'lardi.
 */

const WIDTH = 900;
const HEIGHT = 180;
const PAD = { top: 12, right: 8, bottom: 20, left: 38 };

// Holatga qarab nuqta rangi — xato qayerda bo'lgani ko'rinsin.
const DOT_COLOR = {
  added: "#10b981",
  exists: "#6366f1",
  skipped: "#f59e0b",
  failed: "#ef4444",
};

const RegistrationTimingChart = ({ runId, isRunning }) => {
  const [data, setData] = useState(null);
  const [hover, setHover] = useState(null);

  useEffect(() => {
    if (!runId) return undefined;

    let cancelled = false;

    const load = () =>
      api
        .get(`/api/registration/runs/${runId}/timings`, {
          params: { limit: 200 },
        })
        .then((result) => {
          if (!cancelled) setData(result);
        })
        .catch(() => {
          if (!cancelled) toast.error("Chart ma'lumotini yuklashda xatolik");
        });

    load();

    // Jarayon ketayotgan bo'lsa yangilanib turadi.
    if (!isRunning) return () => {
      cancelled = true;
    };

    const timer = setInterval(load, 5000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [runId, isRunning]);

  if (!data) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Spinner size="sm" color="accent" aria-label="Yuklanmoqda" />
      </div>
    );
  }

  const points = data.points ?? [];

  if (points.length < 2) {
    return (
      <p className="py-10 text-center text-sm text-foreground/50">
        Chart uchun hali yetarli ma'lumot yo'q.
      </p>
    );
  }

  const innerW = WIDTH - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;

  // Y o'qi: 0 dan eng kattagacha. Biroz bo'sh joy qoldiramiz.
  const maxY = Math.max(data.stats.max, 1) * 1.1;

  const x = (i) => PAD.left + (i / (points.length - 1)) * innerW;
  const y = (v) => PAD.top + innerH - (v / maxY) * innerH;

  const line = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p.seconds).toFixed(1)}`)
    .join(" ");

  // Chiziq ostidagi to'ldirish — o'sish/tushishni ko'rsatish uchun.
  const area =
    `${line} L ${x(points.length - 1).toFixed(1)} ${(PAD.top + innerH).toFixed(1)}` +
    ` L ${x(0).toFixed(1)} ${(PAD.top + innerH).toFixed(1)} Z`;

  // Y o'qi belgilari.
  const ticks = [0, maxY / 2, maxY];

  const time = (ms) =>
    new Date(ms).toLocaleTimeString("uz-UZ", { hour12: false });

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs">
        <span className="text-foreground/60">
          o'rtacha{" "}
          <span className="font-medium text-foreground">
            {data.stats.avg} s
          </span>
        </span>
        <span className="text-foreground/60">
          eng tez{" "}
          <span className="font-medium text-success">{data.stats.min} s</span>
        </span>
        <span className="text-foreground/60">
          eng sekin{" "}
          <span className="font-medium text-danger">{data.stats.max} s</span>
        </span>
        <span className="ml-auto text-foreground/40">
          oxirgi {data.stats.count} so'rov
        </span>
      </div>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="h-48 w-full min-w-[520px]"
          role="img"
          aria-label="Har bir so'rovga ketgan vaqt"
        >
          {/* Y o'qi chiziqlari */}
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={PAD.left}
                x2={WIDTH - PAD.right}
                y1={y(t)}
                y2={y(t)}
                stroke="currentColor"
                className="text-border"
                strokeDasharray="3 3"
              />
              <text
                x={PAD.left - 6}
                y={y(t) + 3}
                textAnchor="end"
                className="fill-current text-[10px] text-foreground/40"
              >
                {t.toFixed(t >= 10 ? 0 : 1)}s
              </text>
            </g>
          ))}

          <path d={area} className="fill-accent/10" />
          <path
            d={line}
            fill="none"
            className="stroke-accent"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />

          {/* Nuqtalar — holatga qarab rangli. Ko'p bo'lsa faqat
              sezilarli (sekin) so'rovlar belgilanadi. */}
          {points.map((p, i) => {
            const isSlow = p.seconds > data.stats.avg * 1.5;
            if (points.length > 60 && !isSlow) return null;

            return (
              <circle
                key={`${p.at}-${i}`}
                cx={x(i)}
                cy={y(p.seconds)}
                r={hover === i ? 4 : 2.5}
                fill={DOT_COLOR[p.status] ?? "#94a3b8"}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                className="cursor-pointer"
              />
            );
          })}

          {/* X o'qi: boshlanish va tugash vaqti */}
          <text
            x={PAD.left}
            y={HEIGHT - 4}
            className="fill-current text-[10px] text-foreground/40"
          >
            {time(points[0].at)}
          </text>
          <text
            x={WIDTH - PAD.right}
            y={HEIGHT - 4}
            textAnchor="end"
            className="fill-current text-[10px] text-foreground/40"
          >
            {time(points[points.length - 1].at)}
          </text>
        </svg>
      </div>

      {hover != null && points[hover] && (
        <p className="mt-1 truncate text-xs text-foreground/60">
          <span className="font-medium text-foreground">
            {points[hover].seconds} s
          </span>
          {" · "}
          {time(points[hover].at)}
          {points[hover].name && ` · ${points[hover].name}`}
        </p>
      )}

      <p className="mt-2 text-xs text-foreground/50">
        Baland cho'qqilar — tashqi API limitidagi kutish (56 soniyagacha),
        past qism — tez ishlagan payt. Nuqta rangi: yashil kiritildi,
        qizil xatolik, sariq o'tkazildi.
      </p>
    </div>
  );
};

export default RegistrationTimingChart;
