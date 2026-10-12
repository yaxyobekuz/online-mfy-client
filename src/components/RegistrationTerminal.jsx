import { useEffect, useRef } from "react";

const LEVEL_STYLES = {
  info: "text-sky-400",
  home: "text-violet-400",
  request: "text-white/50",
  success: "text-emerald-400",
  error: "text-rose-400",
  skip: "text-amber-400",
  wait: "text-orange-400",
};

const LEVEL_LABELS = {
  info: "INFO",
  home: "XONADON",
  request: "→",
  success: "OK",
  error: "XATO",
  skip: "O'TKAZILDI",
  wait: "KUTISH",
};

const formatTime = (ms) =>
  new Date(ms).toLocaleTimeString("uz-UZ", { hour12: false });

/**
 * Jarayonni real vaqtda kuzatish uchun terminal ko'rinishidagi oyna.
 * Yangi qator qo'shilganda avtomatik pastga suriladi — foydalanuvchi
 * o'zi yuqoriga aylantirsa, to'xtatiladi.
 */
const RegistrationTerminal = ({ logs, title = "Ro'yxatga olish jurnali" }) => {
  const scrollRef = useRef(null);
  const pinnedRef = useRef(true);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !pinnedRef.current) return;

    el.scrollTop = el.scrollHeight;
  }, [logs]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;

    // Pastga 40px dan yaqin bo'lsa "yopishgan" deb hisoblaymiz.
    pinnedRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-neutral-950">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2">
        <span className="size-2.5 rounded-full bg-rose-500/70" />
        <span className="size-2.5 rounded-full bg-amber-500/70" />
        <span className="size-2.5 rounded-full bg-emerald-500/70" />
        <span className="ml-2 text-xs text-white/50">{title}</span>
        <span className="ml-auto text-xs text-white/30">
          {logs.length} qator
        </span>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-96 overflow-y-auto px-4 py-3 font-mono text-xs leading-relaxed"
      >
        {logs.length === 0 ? (
          <p className="text-white/40">Jarayon boshlanishini kutmoqda...</p>
        ) : (
          logs.map((entry, index) => (
            <div
              key={`${entry.at}-${index}`}
              className={`flex gap-2 ${entry.level === "home" ? "mt-2 border-t border-white/10 pt-2" : ""}`}
            >
              <span className="shrink-0 text-white/30">
                {formatTime(entry.at)}
              </span>

              <span
                className={`shrink-0 font-semibold ${LEVEL_STYLES[entry.level] ?? "text-white/60"}`}
              >
                {LEVEL_LABELS[entry.level] ?? entry.level}
              </span>

              <span className="min-w-0 flex-1 break-words text-white/80">
                {entry.fullName && (
                  <span className="text-white/60">{entry.fullName} — </span>
                )}
                {entry.message}
                {entry.status && (
                  <span className="text-rose-300/70">
                    {" "}
                    [HTTP {entry.status}]
                  </span>
                )}
              </span>

              {entry.ms != null && (
                <span className="shrink-0 text-white/30">{entry.ms}ms</span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RegistrationTerminal;
