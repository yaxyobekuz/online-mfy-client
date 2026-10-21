import { useEffect, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Loader,
  Search,
  TriangleAlert,
  X,
} from "lucide-react";
import api from "../config/api.js";

/**
 * Jonli kuzatuv ro'yxati — Figma maketidagi "Card" (node 1:128).
 *
 * Har qator: holat belgisi (yashil/qizil/sariq doira), ism, sarflangan
 * vaqt va "Ba'tafsil" tugmasi.
 *
 * Holatlar maketda uchta rang bilan ko'rsatilgan, shuning uchun
 * beshta server holati shu uchtaga keltiriladi:
 *   added / exists  -> yashil  (odam bazada)
 *   failed          -> qizil   (platforma rad etdi)
 *   skipped         -> sariq   (yubormadik — sababi bor)
 *
 * Ikki rejim:
 *   - JONLI: SSE'dan kelgan oxirgi 40 urinish (default);
 *   - QIDIRUV: xodim matn yozsa yoki holat tanlasa, server bo'ylab
 *     (barcha yurishlar — ESKI natijalar ham) qidirib, sahifalab
 *     ko'rsatadi.
 */
const TONES = {
  added: { icon: Check, dot: "bg-ok", label: "Kiritildi" },
  exists: { icon: Check, dot: "bg-ok", label: "Allaqachon ro'yxatda" },
  failed: { icon: X, dot: "bg-bad", label: "Xatolik" },
  skipped: { icon: TriangleAlert, dot: "bg-warn", label: "O'tkazildi" },
  pending: { icon: TriangleAlert, dot: "bg-muted", label: "Navbatda" },
};

// Holat filtri variantlari. "" — jonli ko'rinish (default), "all" —
// eski natijalarni ham qamrab barcha holatlar bo'yicha qidiruv.
const STATUS_OPTIONS = [
  { value: "", label: "Jonli" },
  { value: "all", label: "Barchasi (eski natijalar)" },
  { value: "added", label: "Kiritildi" },
  { value: "exists", label: "Allaqachon bor" },
  { value: "failed", label: "Xatolik" },
  { value: "skipped", label: "O'tkazildi" },
  { value: "movedAway", label: "Boshqa MFY da" },
];

/** Millisekundni maketdagidek "2.1s" ko'rinishiga keltiradi. */
const formatDuration = (ms) => {
  if (!ms && ms !== 0) return "—";
  return `${(ms / 1000).toFixed(1)}s`;
};

/** Sana — qidiruvda yozuv qachon bo'lgani ko'rinib tursin. */
const dateFmt = new Intl.DateTimeFormat("uz-UZ", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
const formatAt = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return dateFmt.format(date);
};

/** Bitta odam qatori — jonli va qidiruv ro'yxatida bir xil. */
const MemberRow = ({ member, onDetails, showDate }) => {
  const tone = TONES[member.status] ?? TONES.pending;
  const Icon = tone.icon;
  const at = showDate ? formatAt(member.at) : null;

  return (
    <li className="flex w-full items-center justify-between">
      <div
        className={`flex size-12 shrink-0 items-center justify-center rounded-full ${tone.dot}`}
        title={tone.label}
      >
        <Icon className="size-6 text-white" aria-hidden="true" />
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-between gap-3 pl-3">
        <div className="min-w-0">
          <p className="truncate text-base font-medium text-ink">
            {member.fullName}
          </p>
          {/*
            Sabab faqat muammo bo'lganda ko'rsatiladi —
            muvaffaqiyatli qatorlar toza qolsin.
          */}
          {member.status !== "added" &&
            member.status !== "exists" &&
            member.reasonLabel && (
              <p className="truncate text-xs text-muted">
                {member.reasonLabel}
              </p>
            )}
          {/* Qidiruvda yozuv sanasi — eski natijalarni ajratish uchun. */}
          {at && <p className="truncate text-xs text-muted">{at}</p>}
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          <p className="text-base whitespace-nowrap text-muted">
            {formatDuration(member.durationMs)}
          </p>

          <button
            type="button"
            onClick={() => onDetails(member)}
            className="rounded-full bg-brand-soft px-4 py-2 text-sm font-medium text-brand transition-colors hover:bg-brand/20"
          >
            Ba&rsquo;tafsil
          </button>
        </div>
      </div>
    </li>
  );
};

const LiveFeed = ({ members, onDetails, emptyHint, note }) => {
  // Qidiruv matni (input) va 300ms kechikkan qiymati — har harf
  // uchun serverga so'rov yubormaslik uchun.
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  // Yuklangan natija kaliti bilan birga saqlanadi (MemberDetailsModal
  // kabi): shunda "qaysi so'rov yuklangan" state'ning o'zidan ko'rinadi
  // va effekt ichida alohida "yuklanmoqda" setState'i kerak bo'lmaydi.
  const [feed, setFeed] = useState({ key: null, data: null });

  // Qidiruv rejimi: matn kiritilgan yoki holat tanlangan bo'lsa.
  const feedMode = search.trim() !== "" || status !== "";

  // Joriy so'rovning kaliti — natija shu bilan solishtiriladi.
  const feedKey = `${search.trim()}|${status}|${page}`;
  const isLoaded = feed.key === feedKey;
  const isSearching = feedMode && !isLoaded;
  const result = isLoaded ? feed.data : null;

  // Matnni kechiktirish (debounce). Matn o'zgarsa birinchi sahifaga
  // qaytamiz — aks holda eski sahifada bo'sh natija ko'rinardi.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(query);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Qidiruv so'rovi. Jonli rejimда umuman urmaymiz — SSE ro'yxati
  // ko'rsatiladi (feed natijasi faqat feedMode'da o'qiladi, shuning
  // uchun uni bu yerda tozalash shart emas).
  useEffect(() => {
    if (!feedMode) return undefined;

    let cancelled = false;

    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    // "all" — barcha holatlar; serverга bo'sh yuboramiz.
    if (status && status !== "all") params.set("status", status);
    params.set("page", String(page));

    api
      .get(`/api/dashboard/feed?${params.toString()}`)
      .then((data) => {
        if (!cancelled) setFeed({ key: feedKey, data });
      })
      .catch(() => {
        if (!cancelled) {
          setFeed({
            key: feedKey,
            data: { items: [], total: 0, page: 1, totalPages: 1 },
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [feedMode, feedKey, search, status, page]);

  const clearSearch = () => {
    setQuery("");
    setSearch("");
    setStatus("");
    setPage(1);
  };

  // Ekranda ko'rsatiladigan qatorlar.
  const rows = feedMode ? (result?.items ?? []) : members;
  // Sahifalar soni — yangi sahifa yuklanayotganda tugmalar
  // yo'qolib qolmasligi uchun oxirgi ma'lum natijadan olinadi.
  const totalPages = (result ?? feed.data)?.totalPages ?? 1;

  // Sarlavhaning o'ng tomoni: qidiruvda natija soni, jonli rejimда
  // esa odatdagi holat qatori.
  const rightNote = feedMode ? (
    <span className="truncate">
      {isSearching ? "Qidirilmoqda..." : `${result?.total ?? 0} ta natija`}
    </span>
  ) : (
    note
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2.5 rounded-xl bg-canvas p-3">
      <div className="flex shrink-0 items-baseline justify-between gap-4 text-sm text-muted">
        <p className="shrink-0">Jonli kuzatuv</p>
        <div className="min-w-0 truncate text-right">{rightNote}</div>
      </div>

      {/* --- Ba'tafsil qidiruv --- */}
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ism, JSHSHIR yoki kadastr bo'yicha qidirish..."
            aria-label="Jonli kuzatuvda qidirish"
            className="w-full rounded-full bg-panel py-2 pr-4 pl-9 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/40"
          />
        </div>

        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
          aria-label="Holat bo'yicha filtr"
          className="shrink-0 rounded-full bg-panel px-4 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/40"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {feedMode && (
          <button
            type="button"
            onClick={clearSearch}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-panel px-4 py-2 text-sm text-muted transition-colors hover:text-ink"
          >
            <X className="size-4" aria-hidden="true" />
            Jonliga qaytish
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto rounded-sm bg-panel p-3">
        {rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">
            {feedMode
              ? isSearching
                ? "Qidirilmoqda..."
                : "Mos natija topilmadi"
              : (emptyHint ?? "Hozircha yozuv yo'q")}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {rows.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                onDetails={onDetails}
                showDate={feedMode}
              />
            ))}
          </ul>
        )}
      </div>

      {/* --- Sahifalash — faqat qidiruvda va bir nechta sahifa bo'lsa --- */}
      {feedMode && totalPages > 1 && (
        <div className="flex shrink-0 items-center justify-center gap-4 text-sm text-muted">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || isSearching}
            className="flex items-center gap-1 rounded-full bg-panel px-3 py-1.5 transition-colors hover:text-ink disabled:opacity-40"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
            Oldingi
          </button>

          <span className="flex items-center gap-1.5">
            {isSearching && (
              <Loader className="size-4 animate-spin" aria-hidden="true" />
            )}
            {page} / {totalPages}
          </span>

          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || isSearching}
            className="flex items-center gap-1 rounded-full bg-panel px-3 py-1.5 transition-colors hover:text-ink disabled:opacity-40"
          >
            Keyingi
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
};

export default LiveFeed;
