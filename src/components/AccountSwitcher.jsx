import { useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronsUpDown,
  Eye,
  EyeOff,
  LogOut,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import api from "../config/api.js";
import {
  getActiveMahallaUid,
  setActiveMahallaUid,
  logout,
} from "../config/accounts.js";

/**
 * MFY almashtirgich — chap panel tepasida.
 *
 * MFY tokenlari SERVERda. Bu komponent ularni `/api/mfy-tokens` dan
 * oladi, qo'shadi / yangilaydi / o'chiradi. Muddati o'tgan
 * ("expired") MFY lar so'nik (disabled) ko'rinadi va ularda
 * "yangilash" tugmasi bo'ladi.
 *
 * MFY almashganda jarayon TO'XTAMAYDI: u serverda orqa fonda
 * ketaveradi, bu yerda faqat ko'rinish almashadi. Token O'CHIRILSA
 * esa server shu MFY jarayonlarini to'xtatadi.
 *
 * Har MFY ning JONLI holati platforma statistikasidan olinib
 * ko'rsatiladi: faollik nuqtasi (yashil pulse = ishlayapti) va
 * progress bar.
 */

// Faollik nuqtasi: yashil (pulse) = faol, qizil = token eskirgan,
// kulrang = to'xtagan.
const StatusDot = ({ active, expired }) => (
  <span className="relative flex size-2.5 shrink-0" aria-hidden="true">
    {active && (
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-ok opacity-60" />
    )}
    <span
      className={`relative inline-flex size-2.5 rounded-full ${
        active ? "bg-ok" : expired ? "bg-bad" : "bg-muted/50"
      }`}
    />
  </span>
);

const AccountSwitcher = ({ active, mahallas, onChanged, mahallaName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [token, setToken] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  // Muddati o'tgan tokenni yangilash — qaysi uid ochiq.
  const [refreshUid, setRefreshUid] = useState(null);
  // Har MFY ning JONLI holati (uid -> { active, percent, stage }).
  const [live, setLive] = useState({});
  // Yashirilgan MFY lar ham ko'rsatilsinmi.
  const [showHidden, setShowHidden] = useState(false);

  const boxRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const onPointerDown = (event) => {
      if (!boxRef.current?.contains(event.target)) {
        setIsOpen(false);
        setIsAdding(false);
        setRefreshUid(null);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [isOpen]);

  // Jonli progress — platforma statistikasidan. Doim ishlaydi (10s):
  // yig'ilgan panel sarlavhasida ham faollik ko'rinib tursin, ro'yxat
  // ochilsa har MFY progress bari real vaqtda yangilanadi.
  useEffect(() => {
    let cancelled = false;

    const poll = () => {
      api
        .get("/api/platform-stats")
        .then((data) => {
          if (cancelled) return;
          const map = {};
          for (const m of data.mahallas ?? []) {
            map[m.uid] = {
              active: m.active,
              percent: m.percent,
              stage: m.stage,
              added: m.added,
              homesTotal: m.homesTotal,
              homesDone: m.homesDone,
            };
          }
          setLive(map);
        })
        .catch(() => {});
    };

    poll();
    const timer = setInterval(poll, 10000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const activeUid = active?.uid ?? getActiveMahallaUid();

  // Yangi MFY qo'shish.
  const handleAdd = (event) => {
    event.preventDefault();
    const value = token.trim();
    if (!value) return;

    setIsBusy(true);
    api
      .post("/api/mfy-tokens", { token: value })
      .then((mfy) => {
        toast.success(`"${mfy.username}" MFY qo'shildi`);
        setActiveMahallaUid(mfy.uid);
        setToken("");
        setIsAdding(false);
        setIsOpen(false);
        onChanged();
      })
      .catch((err) => toast.error(err?.message ?? "Token yaroqsiz"))
      .finally(() => setIsBusy(false));
  };

  // Muddati o'tgan tokenni yangilash.
  const handleRefresh = (event, uid) => {
    event.preventDefault();
    const value = token.trim();
    if (!value) return;

    setIsBusy(true);
    api
      .put(`/api/mfy-tokens/${uid}`, { token: value })
      .then((mfy) => {
        toast.success(`"${mfy.username}" tokeni yangilandi`);
        setToken("");
        setRefreshUid(null);
        onChanged();
      })
      .catch((err) => toast.error(err?.message ?? "Yangilashda xatolik"))
      .finally(() => setIsBusy(false));
  };

  const handleSwitch = (mfy) => {
    // Muddati o'tgan MFY ga o'tib bo'lmaydi — avval yangilash kerak.
    if (mfy.status === "expired") {
      setRefreshUid(mfy.uid);
      setToken("");
      return;
    }

    if (mfy.uid !== activeUid) {
      setActiveMahallaUid(mfy.uid);
      onChanged();
    }
    setIsOpen(false);
  };

  const handleRemove = (event, mfy) => {
    event.stopPropagation();
    if (
      !window.confirm(
        `"${mfy.username}" MFY o'chirilsinmi? Uning barcha jarayonlari to'xtaydi.`,
      )
    ) {
      return;
    }

    setIsBusy(true);
    api
      .delete(`/api/mfy-tokens/${mfy.uid}`)
      .then(() => {
        toast.success("MFY o'chirildi");
        // Faol MFY o'chirilsa — boshqasiga o'tamiz.
        if (mfy.uid === activeUid) {
          const next = mahallas.find((m) => m.uid !== mfy.uid);
          setActiveMahallaUid(next?.uid ?? null);
        }
        onChanged();
      })
      .catch((err) => toast.error(err?.message ?? "O'chirishda xatolik"))
      .finally(() => setIsBusy(false));
  };

  // Yashirish / qayta ochish — faqat ko'rinish (serverda saqlanadi).
  const handleToggleHidden = (event, mfy) => {
    event.stopPropagation();

    const nextHidden = !mfy.hidden;
    api
      .patch(`/api/mfy-tokens/${mfy.uid}/visibility`, { hidden: nextHidden })
      .then(() => {
        // Faol MFY yashirilsa — ko'rinadigan boshqasiga o'tamiz.
        if (nextHidden && mfy.uid === activeUid) {
          const next = mahallas.find((m) => m.uid !== mfy.uid && !m.hidden);
          if (next) setActiveMahallaUid(next.uid);
        }
        onChanged();
      })
      .catch((err) => toast.error(err?.message ?? "Amal bajarilmadi"));
  };

  const handleLogout = () => {
    logout();
    window.location.assign("/login");
  };

  const activeMfy = mahallas.find((m) => m.uid === activeUid) ?? null;
  const activeLive = activeUid ? live[activeUid] : null;

  // Yashirilgan MFY lar — soni va ko'rsatiladigan ro'yxat.
  const hiddenCount = mahallas.filter((m) => m.hidden).length;
  const visibleMahallas = showHidden
    ? mahallas
    : mahallas.filter((m) => !m.hidden || m.uid === activeUid);

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex w-full items-center gap-2.5 rounded-2xl p-2.5 text-left transition-colors hover:bg-black/5"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        {/* Faollik belgisi */}
        <StatusDot
          active={activeLive?.active}
          expired={activeMfy?.status === "expired"}
        />

        {/* Nom — qalin, lekin qisqa; qolgan joyni progress egallaydi */}
        <p className="max-w-[45%] shrink-0 truncate text-xl font-bold text-ink">
          {mahallaName ?? activeMfy?.mahallaName ?? "Mahalla tanlanmagan"}
        </p>

        {/* Jonli progress — nom bilan bir qatorda (dropdown kabi) */}
        {activeLive?.active && activeLive.homesTotal > 0 ? (
          <>
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-black/10">
              <div
                className="h-full rounded-full bg-ok transition-[width] duration-500"
                style={{ width: `${activeLive.percent}%` }}
              />
            </div>
            <span className="shrink-0 text-xs font-medium text-ok">
              {activeLive.percent}%
            </span>
          </>
        ) : (
          // Faol emas — username'ni o'rta joyda ko'rsatamiz.
          <span className="min-w-0 flex-1 truncate text-sm text-muted">
            {activeMfy?.username ?? "MFY tanlanmagan"}
          </span>
        )}

        <ChevronsUpDown
          className="size-5 shrink-0 text-muted"
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute inset-x-0 top-full z-20 mt-1 flex flex-col gap-1 rounded-2xl bg-canvas p-2 shadow-lg"
        >
          {visibleMahallas.map((mfy) => {
            const isActive = mfy.uid === activeUid;
            const isExpired = mfy.status === "expired";

            // Shu MFY uchun yangilash formasi ochiq.
            if (refreshUid === mfy.uid) {
              return (
                <form
                  key={mfy.uid}
                  onSubmit={(event) => handleRefresh(event, mfy.uid)}
                  className="flex flex-col gap-2 rounded-xl bg-panel p-2"
                >
                  <p className="px-1 text-xs text-muted">
                    &ldquo;{mfy.username}&rdquo; uchun yangi token
                  </p>
                  <input
                    autoFocus
                    type="password"
                    value={token}
                    placeholder="Yangi token"
                    aria-label="Yangi token"
                    autoComplete="off"
                    onChange={(event) => setToken(event.target.value)}
                    className="w-full rounded-xl bg-canvas px-3 py-2.5 text-sm text-ink outline-none placeholder:text-muted"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={isBusy || !token.trim()}
                      className="flex-1 rounded-xl bg-brand px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                      {isBusy ? "..." : "Yangilash"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRefreshUid(null);
                        setToken("");
                      }}
                      aria-label="Bekor qilish"
                      className="rounded-xl bg-canvas px-3 py-2 text-muted transition-colors hover:text-ink"
                    >
                      <X className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                </form>
              );
            }

            const mfyLive = live[mfy.uid];
            const showProgress =
              mfyLive && mfyLive.homesTotal > 0 && !isExpired;

            return (
              <div
                key={mfy.uid}
                role="menuitem"
                tabIndex={0}
                onClick={() => handleSwitch(mfy)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleSwitch(mfy);
                  }
                }}
                className={`flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 transition-colors ${
                  isActive ? "bg-brand-soft" : "hover:bg-panel"
                } ${isExpired || mfy.hidden ? "opacity-60" : ""}`}
              >
                <StatusDot active={mfyLive?.active} expired={isExpired} />

                {/* Nom — qisqa, qolgan joyni progress egallaydi */}
                <p
                  className={`max-w-[42%] shrink-0 truncate text-sm font-medium ${
                    isActive ? "text-brand" : "text-ink"
                  }`}
                >
                  {mfy.mahallaName ?? mfy.username ?? "MFY"}
                </p>

                {/* Progress bar — nom bilan bir qatorda */}
                {isExpired ? (
                  <span className="flex-1 truncate text-xs text-bad">
                    Token muddati o&rsquo;tgan
                  </span>
                ) : showProgress ? (
                  <>
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-black/10">
                      <div
                        className={`h-full rounded-full transition-[width] duration-500 ${
                          mfyLive.active ? "bg-ok" : "bg-brand"
                        }`}
                        style={{ width: `${mfyLive.percent}%` }}
                      />
                    </div>
                    <span className="shrink-0 text-xs font-medium text-muted">
                      {mfyLive.percent}%
                    </span>
                  </>
                ) : (
                  <span className="flex-1" />
                )}

                {/* Muddati o'tgan — yangilash tugmasi */}
                {isExpired && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setRefreshUid(mfy.uid);
                      setToken("");
                    }}
                    aria-label={`${mfy.username} tokenini yangilash`}
                    className="shrink-0 text-warn transition-colors hover:opacity-80"
                  >
                    <RefreshCw className="size-4" aria-hidden="true" />
                  </button>
                )}

                {/* Yashirish / qayta ochish */}
                <button
                  type="button"
                  onClick={(event) => handleToggleHidden(event, mfy)}
                  aria-label={
                    mfy.hidden
                      ? `${mfy.username} ni qayta ko'rsatish`
                      : `${mfy.username} ni yashirish`
                  }
                  title={mfy.hidden ? "Qayta ko'rsatish" : "Yashirish"}
                  className="shrink-0 text-muted transition-colors hover:text-ink"
                >
                  {mfy.hidden ? (
                    <EyeOff className="size-4" aria-hidden="true" />
                  ) : (
                    <Eye className="size-4" aria-hidden="true" />
                  )}
                </button>

                {isActive && !isExpired ? (
                  <Check
                    className="size-4 shrink-0 text-brand"
                    aria-hidden="true"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={(event) => handleRemove(event, mfy)}
                    aria-label={`${mfy.username} MFY ni o'chirish`}
                    className="shrink-0 text-muted transition-colors hover:text-bad"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            );
          })}

          {/* Yashirilganlarni ko'rsatish/yopish — faqat yashirin MFY
              bo'lsa chiqadi. */}
          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setShowHidden((v) => !v)}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-muted transition-colors hover:bg-panel hover:text-ink"
            >
              {showHidden ? (
                <EyeOff className="size-3.5 shrink-0" aria-hidden="true" />
              ) : (
                <Eye className="size-3.5 shrink-0" aria-hidden="true" />
              )}
              {showHidden
                ? "Yashirilganlarni yopish"
                : `Yashirilganlar (${hiddenCount})`}
            </button>
          )}

          {isAdding ? (
            <form onSubmit={handleAdd} className="flex flex-col gap-2 p-1">
              <input
                autoFocus
                type="password"
                value={token}
                placeholder="MFY tokeni"
                aria-label="Token"
                autoComplete="off"
                onChange={(event) => setToken(event.target.value)}
                className="w-full rounded-xl bg-panel px-3 py-2.5 text-sm text-ink outline-none placeholder:text-muted"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isBusy || !token.trim()}
                  className="flex-1 rounded-xl bg-brand px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {isBusy ? "Tekshirilmoqda..." : "Qo'shish"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setToken("");
                  }}
                  aria-label="Bekor qilish"
                  className="rounded-xl bg-panel px-3 py-2 text-muted transition-colors hover:text-ink"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-brand transition-colors hover:bg-panel"
            >
              <Plus className="size-4 shrink-0" aria-hidden="true" />
              MFY qo&rsquo;shish
            </button>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-panel hover:text-bad"
          >
            <LogOut className="size-4 shrink-0" aria-hidden="true" />
            Chiqish
          </button>
        </div>
      )}
    </div>
  );
};

export default AccountSwitcher;
