import { useEffect, useMemo, useState } from "react";
import { Spinner } from "@heroui/react";
import { toast } from "sonner";
import {
  Activity,
  Building2,
  CheckCircle2,
  Clock,
  Database,
  MapPin,
  TrendingUp,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "../config/api";
import { C, PALETTE, tooltipStyle } from "../config/chart-theme.js";

/**
 * Statistika — BUTUN PLATFORMA bo'yicha jonli dashboard.
 *
 * Barcha MFY lar birgalikda: jami kiritilgan odamlar, faol MFY lar,
 * jarayon dinamikasi, kirmaganlik sabablari, ta'lim taqsimoti,
 * ko'chib ketganlar geografiyasi va MFY reytingi — grafiklar bilan.
 */

const nf = new Intl.NumberFormat("uz-UZ");
const fmt = (n) => nf.format(n ?? 0);
const pct = (part, total) =>
  total > 0 ? Math.round((part / total) * 100) : 0;

// --- Kichik komponentlar ---

const Panel = ({ title, subtitle, icon: Icon, children, className = "" }) => (
  <div
    className={`flex min-w-0 flex-col gap-4 rounded-2xl bg-canvas p-5 ${className}`}
  >
    {title && (
      <div className="flex items-center gap-2.5">
        {Icon && (
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
            <Icon className="size-4.5" aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{title}</p>
          {subtitle && (
            <p className="truncate text-xs text-muted">{subtitle}</p>
          )}
        </div>
      </div>
    )}
    {children}
  </div>
);

const StatTile = ({ label, value, sub, icon: Icon, tone = "brand" }) => {
  const toneMap = {
    brand: "bg-brand-soft text-brand",
    ok: "bg-ok-soft text-ok",
    bad: "bg-bad-soft text-bad",
    warn: "bg-warn-soft text-warn",
    ink: "bg-panel text-ink",
  };
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-canvas p-4">
      <span
        className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${toneMap[tone]}`}
      >
        <Icon className="size-5.5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xl font-bold text-ink xl:text-2xl">
          {value}
        </p>
        <p className="truncate text-xs text-muted">{label}</p>
        {sub && <p className="truncate text-xs text-muted/70">{sub}</p>}
      </div>
    </div>
  );
};

// Gorizontal reyting qatori (sabablar, geografiya).
const RankRow = ({ label, value, max, tone = C.brand, hint }) => (
  <div className="flex flex-col gap-1">
    <div className="flex items-baseline justify-between gap-2">
      <span className="truncate text-sm text-ink">{label}</span>
      <span className="shrink-0 text-sm font-semibold text-ink">
        {fmt(value)}
      </span>
    </div>
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-panel">
      <div
        className="h-full rounded-full"
        style={{
          width: `${max > 0 ? (value / max) * 100 : 0}%`,
          background: tone,
        }}
      />
    </div>
    {hint && <p className="truncate text-xs text-muted">{hint}</p>}
  </div>
);

const StatisticsPage = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const reload = () => {
    api
      .get("/api/platform-stats")
      .then(setData)
      .catch(() => toast.error("Hisobotni yuklashda xatolik"))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    reload();
    // Jonli: faol MFY lar o'zgarib tursin.
    const timer = setInterval(reload, 15000);
    return () => clearInterval(timer);
  }, []);

  const totals = data?.totals;

  // --- Chart ma'lumotlari (hook'lar shart bo'yicha chaqirilmasin) ---
  const statusPie = useMemo(() => {
    if (!totals) return [];
    return [
      { name: "Qo'shilgan", value: totals.added, color: C.ok },
      { name: "Platformada mavjud", value: totals.exists, color: C.brand },
      { name: "Kirmadi", value: totals.failed, color: C.bad },
      { name: "O'tkazildi", value: totals.skipped, color: C.warn },
    ].filter((s) => s.value > 0);
  }, [totals]);

  if (isLoading) {
    return (
      <div className="flex h-svh min-w-0 flex-1 items-center justify-center py-2 pr-2">
        <Spinner size="lg" color="accent" aria-label="Yuklanmoqda" />
      </div>
    );
  }

  if (!totals || totals.attempts === 0) {
    return (
      <div className="flex h-svh min-w-0 flex-1 flex-col py-2 pr-2">
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-3xl bg-panel px-6 py-2">
          <p className="text-sm text-muted">
            Hozircha platforma bo&rsquo;yicha hisobot yo&rsquo;q.
          </p>
        </div>
      </div>
    );
  }

  const mahallas = data.mahallas ?? [];
  const reasons = data.reasons ?? [];
  const byDay = data.byDay ?? [];
  const byStudyLevel = data.byStudyLevel ?? [];
  const elsewhere = data.elsewhere ?? [];
  const timing = data.timing ?? {};

  const maxReason = Math.max(...reasons.map((r) => r.count), 1);
  const maxElsewhere = Math.max(...elsewhere.map((e) => e.count), 1);
  const maxMahalla = Math.max(...mahallas.map((m) => m.added), 1);

  // Progress foizi (butun platforma).
  const resolved = totals.added + totals.exists + totals.failed;
  const overallPercent = pct(resolved, totals.attempts);

  return (
    <div className="flex h-svh min-w-0 flex-1 flex-col py-2 pr-2">
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto rounded-3xl bg-panel px-5 py-3">
        {/* --- Sarlavha --- */}
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 py-1">
          <div>
            <h1 className="text-2xl font-bold text-ink">Platforma statistikasi</h1>
            <p className="text-sm text-muted">
              Barcha {totals.mahallas} ta MFY bo&rsquo;yicha umumiy manzara
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-ok-soft px-4 py-2 text-sm font-medium text-ok">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-ok opacity-60" />
              <span className="relative inline-flex size-2.5 rounded-full bg-ok" />
            </span>
            {totals.activeMahallas} ta faol MFY
          </div>
        </header>

        {/* --- Asosiy KPI lar --- */}
        <div className="grid shrink-0 grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-6">
          <StatTile
            icon={UserCheck}
            tone="ok"
            label="Ro'yxatga olingan"
            value={fmt(totals.added)}
            sub={`${pct(totals.added, totals.people)}% umumiydan`}
          />
          <StatTile
            icon={Users}
            tone="brand"
            label="Ko'rib chiqilgan"
            value={fmt(totals.people)}
            sub={`${fmt(totals.attempts)} urinish`}
          />
          <StatTile
            icon={Database}
            tone="ink"
            label="Platformada mavjud"
            value={fmt(totals.exists)}
          />
          <StatTile
            icon={XCircle}
            tone="bad"
            label="Kiritilmadi"
            value={fmt(totals.failed)}
            sub={`${pct(totals.failed, totals.attempts)}%`}
          />
          <StatTile
            icon={Building2}
            tone="warn"
            label="Xonadonlar"
            value={fmt(totals.homes)}
          />
          <StatTile
            icon={Clock}
            tone="ink"
            label="Sarflangan vaqt, soat"
            value={fmt(timing.totalHours ?? 0)}
            sub={`o'rtacha ${((timing.avgMs ?? 0) / 1000).toFixed(1)}s/so'rov`}
          />
        </div>

        {/* --- Dinamika + Holat --- */}
        <div className="grid shrink-0 grid-cols-1 gap-3 xl:grid-cols-3">
          {/* Kunlik dinamika */}
          <Panel
            title="Kunlik dinamika"
            subtitle="Har kuni qo'shilgan va mavjud topilgan aholi"
            icon={TrendingUp}
            className="xl:col-span-2"
          >
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={byDay} margin={{ left: -18, right: 8, top: 6 }}>
                <defs>
                  <linearGradient id="gAdded" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.ok} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={C.ok} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gExists" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.brand} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={C.brand} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: C.muted }}
                  tickFormatter={(d) => d?.slice(5)}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: C.muted }}
                  axisLine={false}
                  tickLine={false}
                  width={44}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Area
                  type="monotone"
                  dataKey="added"
                  name="Qo'shilgan"
                  stroke={C.ok}
                  strokeWidth={2.5}
                  fill="url(#gAdded)"
                />
                <Area
                  type="monotone"
                  dataKey="exists"
                  name="Mavjud"
                  stroke={C.brand}
                  strokeWidth={2.5}
                  fill="url(#gExists)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Panel>

          {/* Holat donut */}
          <Panel
            title="Natijalar taqsimoti"
            subtitle={`${overallPercent}% ko'rib chiqilgan`}
            icon={Activity}
          >
            <div className="relative">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={statusPie}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={58}
                    outerRadius={85}
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {statusPie.map((s) => (
                      <Cell key={s.name} fill={s.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-ink">
                  {fmt(totals.added)}
                </span>
                <span className="text-xs text-muted">qo&rsquo;shilgan</span>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
              {statusPie.map((s) => (
                <span
                  key={s.name}
                  className="flex items-center gap-1.5 text-xs text-muted"
                >
                  <span
                    className="size-2.5 rounded-full"
                    style={{ background: s.color }}
                  />
                  {s.name}
                </span>
              ))}
            </div>
          </Panel>
        </div>

        {/* --- Sabablar + Ta'lim --- */}
        <div className="grid shrink-0 grid-cols-1 gap-3 xl:grid-cols-3">
          <Panel
            title="Nega kiritilmadi"
            subtitle="Eng ko'p uchragan sabablar"
            icon={XCircle}
            className="xl:col-span-2"
          >
            <div className="flex flex-col gap-3">
              {reasons.slice(0, 7).map((r) => (
                <RankRow
                  key={r.code}
                  label={r.label}
                  value={r.count}
                  max={maxReason}
                  tone={C.bad}
                />
              ))}
            </div>
          </Panel>

          <Panel
            title="Ta'lim darajasi"
            subtitle="Kiritilgan aholi bo'yicha"
            icon={Users}
          >
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={byStudyLevel}
                layout="vertical"
                margin={{ left: 12, right: 12 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="label"
                  tick={{ fontSize: 11, fill: C.ink }}
                  axisLine={false}
                  tickLine={false}
                  width={92}
                />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: C.panel }} />
                <Bar dataKey="count" name="Soni" radius={[0, 6, 6, 0]}>
                  {byStudyLevel.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        </div>

        {/* --- MFY reytingi + Ko'chib ketganlar --- */}
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
          {/* MFY reytingi — faollik bilan */}
          <Panel
            title="MFY reytingi"
            subtitle="Kiritilgan aholi va faollik holati"
            icon={Building2}
            className="xl:col-span-2"
          >
            <div className="flex flex-col gap-2.5">
              {mahallas.map((m) => (
                <div
                  key={m.uid}
                  className="flex items-center gap-3 rounded-xl bg-panel/60 px-3 py-2.5"
                >
                  {/* Faollik belgisi */}
                  <span
                    className={`relative flex size-2.5 shrink-0 ${
                      m.active ? "" : "opacity-40"
                    }`}
                    title={m.active ? "Faol" : "To'xtagan"}
                  >
                    {m.active && (
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-ok opacity-60" />
                    )}
                    <span
                      className="relative inline-flex size-2.5 rounded-full"
                      style={{
                        background: m.active
                          ? C.ok
                          : m.tokenStatus === "expired"
                            ? C.bad
                            : C.muted,
                      }}
                    />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-ink">
                        {m.name}
                      </span>
                      <span className="shrink-0 text-sm font-semibold text-ok">
                        {fmt(m.added)}
                      </span>
                    </div>
                    {/* Progress yoki holat */}
                    <div className="mt-1 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-panel">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(m.added / maxMahalla) * 100}%`,
                            background: m.active ? C.ok : C.brand,
                          }}
                        />
                      </div>
                      <span className="shrink-0 text-xs text-muted">
                        {m.active && m.stage
                          ? "ishlamoqda"
                          : m.tokenStatus === "expired"
                            ? "token eskirgan"
                            : m.homesTotal > 0
                              ? `${m.percent}%`
                              : "—"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          {/* Ko'chib ketganlar geografiyasi */}
          <Panel
            title="Boshqa joyda ro'yxatda"
            subtitle="Ko'chib ketganlar qayerda"
            icon={MapPin}
          >
            <div className="flex flex-col gap-3">
              {elsewhere.length === 0 ? (
                <p className="text-sm text-muted">Ma&rsquo;lumot yo&rsquo;q</p>
              ) : (
                elsewhere.slice(0, 10).map((e, i) => (
                  <RankRow
                    key={`${e.mahalla}-${i}`}
                    label={e.mahalla}
                    value={e.count}
                    max={maxElsewhere}
                    tone={C.warn}
                    hint={e.region}
                  />
                ))
              )}
            </div>
          </Panel>
        </div>

        {/* --- Pastki foydali ko'rsatkichlar --- */}
        <div className="grid shrink-0 grid-cols-2 gap-2.5 pb-1 md:grid-cols-4">
          <StatTile
            icon={Database}
            tone="brand"
            label="Umumiy baza"
            value={fmt(totals.citizens)}
            sub="fuqaro"
          />
          <StatTile
            icon={CheckCircle2}
            tone="ok"
            label="Muvaffaqiyat"
            value={`${pct(totals.added, totals.added + totals.failed)}%`}
            sub="qo'shilgan / urinilgan"
          />
          <StatTile
            icon={Building2}
            tone="ink"
            label="Ishlangan xonadon"
            value={fmt(data.homes?.done ?? 0)}
            sub={`${fmt(data.homes?.total ?? 0)} dan`}
          />
          <StatTile
            icon={Activity}
            tone="warn"
            label="Jami so'rov"
            value={fmt(timing.requests)}
            sub="davlat bazasiga"
          />
        </div>
      </div>
    </div>
  );
};

export default StatisticsPage;
