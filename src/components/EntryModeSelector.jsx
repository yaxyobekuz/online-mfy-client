import { Gauge, ScanSearch, Sparkles } from "lucide-react";

/**
 * Kiritish uslubini tanlash — "Boshlash", "Random" va "Kadastrsiz
 * boshlash" modallarida bir xil ko'rinadi.
 *
 * Nega umumiy komponent: uchala rejim ham bir xil uslub tanlovini
 * taklif qiladi (odatiy / ba'tafsil / aqilli), shuning uchun tanlov
 * bitta joyda turadi — matn yoki ko'rinish o'zgarsa uch joyda emas,
 * bitta faylda tuzatiladi.
 *
 * `value` — joriy tanlov ("odatiy" | "batafsil" | "aqilli"),
 * `onChange(mode)` — tanlov o'zgarganda.
 *
 * Qo'shimcha (ixtiyoriy): "JSHSHIR orqali ma'lumotni yaxshilash" belgisi.
 * `onEnrichChange` berilsa, uslub tanlovidan pastda (ya'ni "Boshlash"
 * tugmasi ustida) checkbox ko'rsatiladi.
 *   `enrich` — joriy holat (bool),
 *   `onEnrichChange(checked)` — belgilanganda.
 */

const MODES = [
  {
    id: "odatiy",
    label: "Odatiy",
    icon: Gauge,
    hint: "Hozirgidek — bazadagi ma'lumot bilan kiritiladi. Eng tez.",
  },
  {
    id: "batafsil",
    label: "Ba'tafsil",
    icon: ScanSearch,
    hint: "Har fuqaro avval davlat bazasidan (pasport, metrka, JSHSHIR) yangilanadi, so'ng kiritiladi. Aniqroq, lekin sekinroq.",
  },
  {
    id: "aqilli",
    label: "Aqilli",
    icon: Sparkles,
    hint: "Avval bazadagi ma'lumot bilan urinadi; xatolik bo'lsa davlat bazasidan yangilab, qayta uriniladi.",
  },
];

const EntryModeSelector = ({
  value = "odatiy",
  onChange,
  enrich = false,
  onEnrichChange,
}) => (
  <div>
    <p className="mb-2 text-xs font-medium text-muted">Kiritish uslubi</p>

    <div className="flex flex-col gap-1.5">
      {MODES.map((mode) => {
        const Icon = mode.icon;
        const active = value === mode.id;

        return (
          <button
            key={mode.id}
            type="button"
            onClick={() => onChange?.(mode.id)}
            aria-pressed={active}
            className={`flex items-start gap-3 rounded-xl px-4 py-3 text-left transition-colors ${
              active
                ? "bg-brand text-white"
                : "bg-canvas text-ink hover:bg-black/5"
            }`}
          >
            <Icon
              className={`mt-0.5 size-5 shrink-0 ${
                active ? "text-white" : "text-brand"
              }`}
              aria-hidden="true"
            />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">{mode.label}</span>
              <span
                className={`mt-0.5 block text-xs ${
                  active ? "text-white/80" : "text-muted"
                }`}
              >
                {mode.hint}
              </span>
            </span>
          </button>
        );
      })}
    </div>

    {onEnrichChange ? (
      <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-xl bg-canvas px-4 py-3 transition-colors hover:bg-black/5">
        <input
          type="checkbox"
          checked={enrich}
          onChange={(event) => onEnrichChange(event.target.checked)}
          className="mt-0.5 size-4 shrink-0 accent-brand"
        />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-ink">
            JSHSHIR orqali ma&rsquo;lumotni yaxshilash
          </span>
          <span className="mt-0.5 block text-xs text-muted">
            Tug&rsquo;ilgan sanasi yo&rsquo;q, lekin JSHSHIR&rsquo;i bor
            fuqaroning sanasi JSHSHIR&rsquo;dan tiklanadi. Aks holda bunday
            odam &ldquo;sana yo&rsquo;q&rdquo; deb o&rsquo;tkazib yuboriladi.
          </span>
        </span>
      </label>
    ) : null}
  </div>
);

export default EntryModeSelector;
