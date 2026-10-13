import { useEffect, useState } from "react";
import { Spinner } from "@heroui/react";
import { toast } from "sonner";
import api from "../config/api";
import KpiCard from "../components/KpiCard.jsx";

/**
 * Statistika — "nechta kirdi, nechta kirmadi va NEGA".
 *
 * Asosiy savol sabablar jadvali bilan javob topadi: har bir sabab
 * nechta odamga tegishli va platforma aynan qanday matn qaytargani
 * ko'rinib turadi.
 */

/** Nisbatni ko'rsatuvchi oddiy gorizontal chiziq. */
const Bar = ({ value, total, tone = "bg-brand" }) => (
  <div className="h-2 w-full overflow-hidden rounded-full bg-panel">
    <div
      className={`h-full rounded-full ${tone}`}
      style={{ width: `${total > 0 ? (value / total) * 100 : 0}%` }}
    />
  </div>
);

const Card = ({ title, children }) => (
  <div className="flex flex-col gap-2.5 rounded-xl bg-canvas p-3">
    <p className="text-sm text-muted">{title}</p>
    {children}
  </div>
);

const StatisticsPage = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    api
      .get("/api/statistics")
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch(() => {
        if (!cancelled) toast.error("Hisobotni yuklashda xatolik yuz berdi");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-svh min-w-0 flex-1 items-center justify-center py-2 pr-2">
        <Spinner size="lg" color="accent" aria-label="Yuklanmoqda" />
      </div>
    );
  }

  const members = data?.members;
  const homes = data?.homes;
  const reasons = data?.reasons ?? [];
  const byStudyLevel = data?.byStudyLevel ?? [];
  const byDay = data?.byDay ?? [];
  const elsewhere = data?.elsewhere ?? [];

  // Hech qachon ish boshlanmagan bo'lsa, bo'sh jadvallarni
  // ko'rsatishdan ma'no yo'q.
  if (!members || members.total === 0) {
    return (
      <div className="flex h-svh min-w-0 flex-1 flex-col py-2 pr-2">
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-3xl bg-panel px-6 py-2">
          <p className="text-sm text-muted">
            Hozircha hisobot yo&rsquo;q — avval &ldquo;Asosiy&rdquo; bo&rsquo;limida
            jarayonni boshlang.
          </p>
        </div>
      </div>
    );
  }

  const maxDay = Math.max(...byDay.map((row) => row.count), 1);

  return (
    <div className="flex h-svh min-w-0 flex-1 flex-col py-2 pr-2">
      <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto rounded-3xl bg-panel px-6 py-2">
        <header className="shrink-0 py-2">
          <p className="text-xl font-bold text-ink">Statistika</p>
          {data.mahallaName && (
            <p className="text-sm text-muted">{data.mahallaName}</p>
          )}
        </header>

        {/* --- Umumiy ko'rsatkichlar --- */}
        <div className="grid shrink-0 grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-5">
          <KpiCard label="Ko'rib chiqilgan odam" value={`${members.people} ta`} />
          <KpiCard
            label="Ro'yxatga olingan"
            value={`${members.added} ta`}
            tone="ok"
          />
          <KpiCard
            label="Allaqachon ro'yxatda edi"
            value={`${members.exists} ta`}
          />
          <KpiCard
            label="Kirmadi"
            value={`${members.failed + members.skipped} ta`}
            tone="bad"
          />
          <KpiCard
            label="Tugagan xonadon"
            value={`${homes.done + homes.partial}/${homes.total} ta`}
          />
        </div>

        {data.avgMs && (
          <p className="shrink-0 px-1 text-sm text-muted">
            Bitta odamga o&rsquo;rtacha {(data.avgMs / 1000).toFixed(1)} soniya
            sarflangan.
          </p>
        )}

        <div className="grid gap-2.5 pb-2 lg:auto-rows-min lg:grid-cols-2">
          {/* --- Sabablar: eng muhim jadval --- */}
          <Card title="Nega kirmadi">
            {reasons.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">
                Xatolik yo&rsquo;q
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {reasons.map((reason) => (
                  <li key={reason.code} className="flex flex-col gap-1.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="min-w-0 truncate text-sm text-ink">
                        {reason.label}
                      </p>
                      <p className="shrink-0 text-sm font-bold text-ink">
                        {reason.count}
                      </p>
                    </div>

                    <Bar
                      value={reason.count}
                      total={members.failed + members.skipped}
                      tone="bg-bad"
                    />

                    {/*
                      Platformaning asl matni: kod ortida nima
                      turganini ko'rish uchun kerak.
                    */}
                    {reason.sample && (
                      <p
                        className="truncate text-xs text-muted"
                        title={reason.sample}
                      >
                        {reason.sample}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* --- Ta'lim darajasi --- */}
          <Card title="Ta'lim darajasi taqsimoti">
            {byStudyLevel.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">
                Ma&rsquo;lumot yo&rsquo;q
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {byStudyLevel.map((level) => (
                  <li key={level.code} className="flex flex-col gap-1.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-sm text-ink">{level.label}</p>
                      <p className="text-sm font-bold text-ink">
                        {level.count}
                      </p>
                    </div>
                    <Bar value={level.count} total={members.added} />
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* --- Kunlar kesimida --- */}
          <Card title="Kunlar kesimida kiritilganlar">
            {byDay.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">
                Ma&rsquo;lumot yo&rsquo;q
              </p>
            ) : (
              <div className="flex h-40 items-end gap-1.5 overflow-x-auto">
                {byDay.map((row) => (
                  <div
                    key={row.date}
                    className="flex min-w-6 flex-1 flex-col items-center gap-1"
                    title={`${row.date}: ${row.count} ta`}
                  >
                    <div
                      className="w-full rounded-t-sm bg-brand"
                      style={{ height: `${(row.count / maxDay) * 120}px` }}
                    />
                    <span className="text-[10px] whitespace-nowrap text-muted">
                      {row.date.slice(5)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* --- Boshqa joyda ro'yxatda turganlar --- */}
          <Card title="Boshqa joyda ro'yxatda turganlar">
            {elsewhere.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">
                Bunday yozuv yo&rsquo;q
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {elsewhere.map((row, index) => (
                  <li
                    key={`${row.region}-${row.mahalla}-${index}`}
                    className="flex items-baseline justify-between gap-3"
                  >
                    <p className="min-w-0 truncate text-sm text-ink">
                      {row.mahalla}
                      <span className="text-muted"> · {row.region}</span>
                    </p>
                    <p className="shrink-0 text-sm font-bold text-ink">
                      {row.count}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StatisticsPage;
