/**
 * Ko'rsatkich kartasi — Figma maketidagi "KPI card" (node 1:79).
 *
 * Yuqorida kulrang izoh, pastda qiymat. Foiz berilsa, qiymatning
 * o'ng tomonida ko'rinadi.
 */
const KpiCard = ({ label, value, percent, tone = "ink" }) => {
  const toneClass = {
    ink: "text-ink",
    ok: "text-ok",
    bad: "text-bad",
    pending: "text-pending",
    brand: "text-brand",
  }[tone];

  return (
    <div className="flex flex-col gap-2.5 rounded-xl bg-canvas p-3">
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
    </div>
  );
};

export default KpiCard;
