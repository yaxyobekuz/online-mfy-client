import { Check, TriangleAlert, X } from "lucide-react";

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
 */
const TONES = {
  added: { icon: Check, dot: "bg-ok", label: "Kiritildi" },
  exists: { icon: Check, dot: "bg-ok", label: "Allaqachon ro'yxatda" },
  failed: { icon: X, dot: "bg-bad", label: "Xatolik" },
  skipped: { icon: TriangleAlert, dot: "bg-warn", label: "O'tkazildi" },
  pending: { icon: TriangleAlert, dot: "bg-muted", label: "Navbatda" },
};

/** Millisekundni maketdagidek "2.1s" ko'rinishiga keltiradi. */
const formatDuration = (ms) => {
  if (!ms && ms !== 0) return "—";
  return `${(ms / 1000).toFixed(1)}s`;
};

const LiveFeed = ({ members, onDetails, emptyHint, note }) => (
  <div className="flex min-h-0 flex-1 flex-col gap-2.5 rounded-xl bg-canvas p-3">
    <div className="flex shrink-0 items-baseline justify-between gap-4 text-sm text-muted">
      <p className="shrink-0">Jonli kuzatuv</p>
      <div className="min-w-0 truncate text-right">{note}</div>
    </div>

    <div className="min-h-0 flex-1 overflow-y-auto rounded-sm bg-panel p-3">
      {members.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted">
          {emptyHint ?? "Hozircha yozuv yo'q"}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {members.map((member) => {
            const tone = TONES[member.status] ?? TONES.pending;
            const Icon = tone.icon;

            return (
              <li
                key={member.id}
                className="flex w-full items-center justify-between"
              >
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
          })}
        </ul>
      )}
    </div>
  </div>
);

export default LiveFeed;
