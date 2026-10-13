import { useEffect, useRef, useState } from "react";
import { Check, ChevronsUpDown, LogOut, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import api from "../config/api.js";
import {
  clearAccounts,
  removeAccount,
  setActiveAccount,
  upsertAccount,
} from "../config/accounts.js";

/**
 * Hisoblar almashtirgichi — chap panelning tepasida.
 *
 * Har token bitta MFY ga tegishli, shuning uchun "boshqa mahallaga
 * o'tish" = "boshqa hisobni tanlash". O'tish paytida oldingi
 * mahallaning jarayoni TO'XTAMAYDI: u serverda orqa fonda
 * ketaveradi, bu yerda faqat ko'rinish almashadi.
 */
const AccountSwitcher = ({ active, accounts, onChanged, mahallaName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [token, setToken] = useState("");
  const [isChecking, setIsChecking] = useState(false);

  const boxRef = useRef(null);

  // Tashqariga bosilganda yopiladi.
  useEffect(() => {
    if (!isOpen) return undefined;

    const onPointerDown = (event) => {
      if (!boxRef.current?.contains(event.target)) {
        setIsOpen(false);
        setIsAdding(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [isOpen]);

  /**
   * Yangi hisob qo'shish.
   *
   * Token darhol tekshiriladi: yaroqsiz token ro'yxatga tushsa,
   * foydalanuvchi keyinroq "nega ishlamayapti" deb boshi qotardi.
   *
   * Sarlavha ataylab aniq beriladi — interceptor bunday holatda
   * faol hisob tokenini qo'ymaydi, ya'ni tekshiruv aynan YANGI
   * token bilan ketadi.
   */
  const handleAdd = (event) => {
    event.preventDefault();

    const value = token.trim();
    if (!value) return;

    setIsChecking(true);

    api
      .get("/api/user", { headers: { Authorization: `Bearer ${value}` } })
      .then((user) => {
        const exists = accounts.some((account) => account.uid === user.uid);

        upsertAccount({
          uid: user.uid,
          username: user.username,
          token: value,
        });

        // Yangi qo'shilgan hisob darhol faol bo'ladi — odam uni
        // qo'shdi, demak o'shanda ishlamoqchi.
        setActiveAccount(user.uid);

        toast.success(
          exists
            ? `"${user.username}" hisobi yangilandi`
            : `"${user.username}" hisobi qo'shildi`,
        );

        setToken("");
        setIsAdding(false);
        setIsOpen(false);
        onChanged();
      })
      .catch(() => {
        toast.error("Token yaroqsiz yoki foydalanuvchi topilmadi");
      })
      .finally(() => setIsChecking(false));
  };

  const handleSwitch = (uid) => {
    if (uid === active?.uid) {
      setIsOpen(false);
      return;
    }

    setActiveAccount(uid);
    setIsOpen(false);
    onChanged();
  };

  const handleRemove = (event, account) => {
    // Qator bosilishi (hisobga o'tish) bilan chalkashmasin.
    event.stopPropagation();

    if (!window.confirm(`"${account.username}" hisobi olib tashlansinmi?`)) {
      return;
    }

    const left = removeAccount(account.uid);
    onChanged();

    if (!left.length) window.location.assign("/login");
  };

  const handleLogout = () => {
    clearAccounts();
    window.location.assign("/login");
  };

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex w-full items-center gap-4 rounded-2xl p-2.5 text-left transition-colors hover:bg-black/5"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="truncate text-xl font-bold text-ink">
            {mahallaName ?? "Mahalla tanlanmagan"}
          </p>
          <p className="truncate text-sm text-muted">
            {active?.username ?? "Hisob tanlanmagan"}
          </p>
        </div>

        <ChevronsUpDown className="size-5 shrink-0 text-muted" aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute inset-x-0 top-full z-20 mt-1 flex flex-col gap-1 rounded-2xl bg-canvas p-2 shadow-lg"
        >
          {accounts.map((account) => {
            const isActive = account.uid === active?.uid;

            return (
              <div
                key={account.uid ?? "legacy"}
                role="menuitem"
                tabIndex={0}
                onClick={() => handleSwitch(account.uid)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleSwitch(account.uid);
                  }
                }}
                className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                  isActive ? "bg-brand-soft" : "hover:bg-panel"
                }`}
              >
                <div className="flex min-w-0 flex-1 flex-col">
                  <p
                    className={`truncate text-sm font-medium ${
                      isActive ? "text-brand" : "text-ink"
                    }`}
                  >
                    {account.mahallaName ?? "MFY aniqlanmagan"}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {account.username ?? "—"}
                  </p>
                </div>

                {isActive ? (
                  <Check className="size-4 shrink-0 text-brand" aria-hidden="true" />
                ) : (
                  <button
                    type="button"
                    onClick={(event) => handleRemove(event, account)}
                    aria-label={`${account.username} hisobini olib tashlash`}
                    className="shrink-0 text-muted transition-colors hover:text-bad"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            );
          })}

          {isAdding ? (
            <form onSubmit={handleAdd} className="flex flex-col gap-2 p-1">
              <input
                autoFocus
                type="password"
                value={token}
                placeholder="Boshqa MFY tokeni"
                aria-label="Token"
                autoComplete="off"
                onChange={(event) => setToken(event.target.value)}
                className="w-full rounded-xl bg-panel px-3 py-2.5 text-sm text-ink outline-none placeholder:text-muted"
              />

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isChecking || !token.trim()}
                  className="flex-1 rounded-xl bg-brand px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {isChecking ? "Tekshirilmoqda..." : "Qo'shish"}
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
              Hisob qo&rsquo;shish
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
