import { useEffect, useRef, useState } from "react";
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
const STATUS_LABEL = {
  added: "Kiritildi",
  exists: "Allaqachon bor",
  skipped: "O'tkazildi",
  failed: "Xatolik",
};

const DOT_COLOR = {
  added: "#10b981",
  exists: "#6366f1",
  skipped: "#f59e0b",
  failed: "#ef4444",
};

const RegistrationTimingChart = ({ runId, isRunning }) => {
  const [data, setData] = useState(null);
  // Kursor turgan nuqta indeksi.
  const [hover, setHover] = useState(null);
  const svgRef = useRef(null);

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

  /**
   * Kursor chart ustida yurganda eng yaqin nuqtani topadi.
   *
   * Nuqtalarning o'zini ushlash qiyin (kichik, ba'zilari umuman
   * chizilmaydi), shuning uchun butun maydon bo'ylab x koordinata
   * bo'yicha eng yaqini tanlanadi — chiziqli chartlarda odatiy yo'l.
   */
  const handleMove = (event) => {
    const svg = svgRef.current;
    if (!svg) return;

    const box = svg.getBoundingClientRect();
    // Ekrandagi o'lcham viewBox'dan farq qiladi — nisbatga
    // o'tkazamiz.
    const svgX = ((event.clientX - box.left) / box.width) * WIDTH;

    const ratio = (svgX - PAD.left) / innerW;
    const index = Math.round(ratio * (points.length - 1));

    if (index < 0 || index >= points.length) {
      setHover(null);
      return;
    }

    setHover(index);
  };

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

      <div className="relative overflow-x-auto">
        {/*
          Tooltip — nuqta yonida suzib turadi. SVG ichida emas,
          ustida: shunda matn o'lchami viewBox masshtabiga
          bog'lanmaydi va har doim bir xil o'qiladi.
        */}
        {hover != null && points[hover] && (
          <div
            className="pointer-events-none absolute z-10 min-w-36 -translate-x-1/2 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs shadow-lg"
            style={{
              left: `${(x(hover) / WIDTH) * 100}%`,
              // Nuqtadan sal tepada. Juda yuqori bo'lsa pastga
              // tushiramiz, aks holda chartdan chiqib ketadi.
              top: `${Math.max(2, (y(points[hover].seconds) / HEIGHT) * 100 - 32)}%`,
            }}
          >
            <div className="flex items-center gap-1.5">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{
                  background: DOT_COLOR[points[hover].status] ?? "#94a3b8",
                }}
              />
              <span className="font-semibold text-foreground">
                {points[hover].seconds} s
              </span>
              <span className="ml-auto text-foreground/50">
                {time(points[hover].at)}
              </span>
            </div>

            <div className="mt-0.5 text-foreground/60">
              {STATUS_LABEL[points[hover].status] ?? points[hover].status}
            </div>

            {points[hover].name && (
              <div className="mt-0.5 max-w-48 truncate text-foreground/50">
                {points[hover].name}
              </div>
            )}
          </div>
        )}

        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="h-48 w-full min-w-[520px]"
          role="img"
          aria-label="Har bir so'rovga ketgan vaqt"
          onMouseMove={handleMove}
          onMouseLeave={() => setHover(null)}
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
              sezilarli (sekin) so'rovlar belgilanadi, lekin kursor
              turgan nuqta doim ko'rinadi. */}
          {points.map((p, i) => {
            const isSlow = p.seconds > data.stats.avg * 1.5;
            if (points.length > 60 && !isSlow && hover !== i) return null;

            return (
              <circle
                key={`${p.at}-${i}`}
                cx={x(i)}
                cy={y(p.seconds)}
                r={hover === i ? 4 : 2.5}
                fill={DOT_COLOR[p.status] ?? "#94a3b8"}
              />
            );
          })}

          {/* Kursor turgan joydagi vertikal chiziq — qaysi nuqta
              tanlanganini aniq ko'rsatadi. */}
          {hover != null && points[hover] && (
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={PAD.top}
              y2={PAD.top + innerH}
              stroke="currentColor"
              className="text-foreground/25"
              strokeWidth="1"
            />
          )}

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


    </div>
  );
};

export default RegistrationTimingChart;
