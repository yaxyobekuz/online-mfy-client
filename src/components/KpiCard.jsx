import { Link } from "react-router-dom";

/**
 * Ko'rsatkich kartasi — Figma maketidagi "KPI card" (node 1:79).
 *
 * Yuqorida kulrang izoh, pastda qiymat. Foiz berilsa, qiymatning
 * o'ng tomonida ko'rinadi. `to` berilsa — kartochka bosiladigan
 * havola: shu ko'rsatkichning ro'yxati ochiladi.
 */
const KpiCard = ({ label, value, percent, tone = "ink", to }) => {
  const toneClass = {
    ink: "text-ink",
    ok: "text-ok",
    bad: "text-bad",
    pending: "text-pending",
    brand: "text-brand",
    warn: "text-warn",
  }[tone];

  const content = (
    <>
      <p className="truncate text-sm text-muted" title={label}>
        {label}
      </p>

      <div className="flex items-center justify-between gap-2">
        <p className={`text-xl font-bold whitespace-nowrap ${toneClass}`}>
          {value}
        </p>

        {percent !== null && percent !== undefined && (
          <p className="text-sm whitespace-nowrap text-muted">{percent}%</p>
        )}
      </div>
    </>
  );

  if (!to) {
    return (
      <div className="flex flex-col gap-2.5 rounded-xl bg-canvas p-3">
        {content}
      </div>
    );
  }

  return (
    <Link
      to={to}
      title={`${label} — ro'yxatni ochish`}
      className="flex flex-col gap-2.5 rounded-xl bg-canvas p-3 transition-colors hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-brand"
    >
      {content}
    </Link>
  );
};

export default KpiCard;
