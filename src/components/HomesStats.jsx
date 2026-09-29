import { Card } from "@heroui/react";

/**
 * Kichik KPI kartochkalari: jami, faol va nofaol xonadonlar soni.
 * Butun to'plam bo'yicha (sahifalashdan mustaqil) DB darajasida
 * hisoblangan statistikani ko'rsatadi. Balandligi header tugmalariga
 * mos (~h-10) bo'lishi uchun label va qiymat yonma-yon joylashtirilgan.
 */
const StatCard = ({ label, value, valueClassName }) => (
  <Card className="flex h-10 flex-1 flex-row items-center gap-2 px-4 py-0 md:h-9">
    <span className="text-xs text-foreground/60">{label}</span>
    <span className={`text-sm font-semibold ${valueClassName ?? "text-foreground"}`}>
      {value}
    </span>
  </Card>
);

const HomesStats = ({
  stats,
  totalLabel = "Jami xonadonlar",
  positiveLabel = "Faol",
  negativeLabel = "Nofaol",
  positiveKey = "active",
  negativeKey = "inactive",
}) => {
  if (!stats) return null;

  return (
    <div className="mb-5 flex flex-wrap gap-3">
      <StatCard label={totalLabel} value={stats.total} />
      <StatCard
        label={positiveLabel}
        value={stats[positiveKey]}
        valueClassName="text-success"
      />
      <StatCard
        label={negativeLabel}
        value={stats[negativeKey]}
        valueClassName="text-danger"
      />
    </div>
  );
};

export default HomesStats;
