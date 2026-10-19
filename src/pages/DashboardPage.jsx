import { useEffect, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { Calculator, Loader, Pause, Play, Settings, Shuffle, UserPlus } from "lucide-react";
import { useDashboard } from "../hooks/useDashboard.js";
import KpiCard from "../components/KpiCard.jsx";
import ReportDownloadCard from "../components/ReportDownloadCard.jsx";
import LiveFeed from "../components/LiveFeed.jsx";
import MemberDetailsModal from "../components/MemberDetailsModal.jsx";
import RandomStartModal from "../components/RandomStartModal.jsx";
import StreetSettingsModal from "../components/StreetSettingsModal.jsx";

/**
 * Asosiy sahifa — BOSHQARUV paneli (Figma node 1:2).
 *
 * Bu sahifa ishni o'zi bajarmaydi: start berilgandan keyin jarayon
 * SERVERDA orqa fonda ketaveradi. Client panel faqat kuzatish va
 * boshqarish uchun — sahifa yopilsa ham ish to'xtamaydi.
 */

/** Foizni butun songa keltiradi; bo'luvchi 0 bo'lsa — 0. */
const percentOf = (part, total) =>
  total > 0 ? Math.round((part / total) * 100) : 0;

const DashboardPage = () => {
  // Qaysi hisob nomidan ishlayapmiz — layout beradi. Hisob
  // almashsa, hook ma'lumotni qaytadan so'raydi.
  const { accountUid } = useOutletContext() ?? {};
  const { mahallaSlug } = useParams();
  const dashboard = useDashboard(accountUid);

  // Kartochka bosilganda — shu ko'rsatkichning ro'yxati.
  const reportTo = (kind) => `/${mahallaSlug}/hisobot/${kind}`;

  const [memberId, setMemberId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRandomModalOpen, setIsRandomModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const stats = dashboard.stats ?? {
    peopleTotal: 0,
    added: 0,
    exists: 0,
    movedAway: 0,
    failed: 0,
    pending: 0,
    homesTotal: 0,
    percent: 0,
  };

  const openDetails = (member) => {
    setMemberId(member.id);
    setIsModalOpen(true);
  };

  // Tashqi API limiti: so'rov o'rtacha qancha vaqt olayotgani.
  const delayMs = dashboard.rateLimit?.delayMs ?? null;

  // Limit tufayli kutish qoldi (sekund).
  const waitingUntil =
    dashboard.rateLimit?.waitingUntil ?? dashboard.run?.waitingUntil ?? null;

  return (
    <div className="flex h-svh min-w-0 flex-1 flex-col py-2 pr-2 pl-2">
      <div className="flex min-h-0 flex-1 flex-col gap-2.5 rounded-3xl bg-panel px-6 py-2">
        {/* --- Sarlavha va boshqaruv --- */}
        <header className="flex w-full shrink-0 flex-wrap items-center justify-between gap-4 py-2">
          <p className="text-xl font-bold text-ink">
            Xush kelibsiz
            {dashboard.user?.username ? `, ${dashboard.user.username}` : ""}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-6">
            {delayMs !== null && (
              <p className="px-6 py-4 text-base font-medium text-muted">
                O&rsquo;rtacha 1ta so&rsquo;rov{" "}
                {(delayMs / 1000).toFixed(1)}s
              </p>
            )}

            {/*
              "Hisoblash" — MFY xonadonlarini platformadan aniqlab
              olish. Tugma DOIMIY turadi: bir marta hisoblangach ham,
              jarayon boshlanib tugagach ham ekranda qoladi. Sabab:
              platformada xonadonlar o'zgaradi (yangi uy qo'shiladi,
              kadastr to'g'rilanadi), shuning uchun mahallani istalgan
              vaqtda qayta hisoblash kerak bo'ladi — server amalni
              `upsert` bilan bajaradi, qayta bosish xavfsiz. Faqat
              jarayon KETAYOTGANDA yashiriladi: o'sha paytda xonadonlar
              bazasiga ishchi tegib turadi, uni qayta yozish ziddiyat
              tug'dirardi.
            */}
            {!dashboard.isRunning && (
              <button
                type="button"
                onClick={dashboard.scanMahalla}
                disabled={dashboard.isScanning || dashboard.isBusy}
                className="flex items-center gap-4 rounded-full bg-brand px-6 py-4 text-base font-medium text-white transition-opacity hover:opacity-80 disabled:opacity-50"
              >
                {dashboard.isScanning ? (
                  <Loader className="size-6 animate-spin" aria-hidden="true" />
                ) : (
                  <Calculator className="size-6" aria-hidden="true" />
                )}
                {dashboard.isScanning ? "Hisoblanmoqda..." : "Hisoblash"}
              </button>
            )}

            {!dashboard.isRunning ? (
              <>
                <button
                  type="button"
                  onClick={dashboard.start}
                  disabled={dashboard.isBusy || dashboard.isScanning}
                  className="flex items-center gap-4 rounded-full bg-ok-soft px-6 py-4 text-base font-medium text-ok transition-opacity hover:opacity-80 disabled:opacity-50"
                >
                  <Play className="size-6" aria-hidden="true" />
                  Boshlash
                </button>

                <button
                  type="button"
                  onClick={() => setIsRandomModalOpen(true)}
                  disabled={dashboard.isBusy}
                  className="flex items-center gap-4 rounded-full bg-brand/10 px-6 py-4 text-base font-medium text-brand transition-opacity hover:opacity-80 disabled:opacity-50"
                >
                  <Shuffle className="size-6" aria-hidden="true" />
                  Random
                </button>

                {/*
                  Sozlama — random rejimda qaysi ko'chalarga ma'lumot
                  kiritish mumkinligini belgilaydi ("номаълум" kabi
                  texnik ko'chalarni chetlab o'tish uchun).
                */}
                <button
                  type="button"
                  onClick={() => setIsSettingsModalOpen(true)}
                  className="flex items-center justify-center rounded-full bg-brand/10 p-4 text-brand transition-opacity hover:opacity-80"
                  aria-label="Ko'chalar sozlamasi"
                  title="Ko'chalar sozlamasi"
                >
                  <Settings className="size-6" aria-hidden="true" />
                </button>

                {/* Qo'shimcha a'zolar — yuklangan a'zolarni kadastr
                    bo'yicha oila a'zosi sifatida qo'shadi. */}
                <button
                  type="button"
                  onClick={dashboard.extraStart}
                  disabled={dashboard.isBusy}
                  className="flex items-center gap-4 rounded-full bg-brand/10 px-6 py-4 text-base font-medium text-brand transition-opacity hover:opacity-80 disabled:opacity-50"
                >
                  <UserPlus className="size-6" aria-hidden="true" />
                  Qo&rsquo;shimcha
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={dashboard.stop}
                disabled={dashboard.isBusy}
                className="flex items-center gap-4 rounded-full bg-bad-soft px-6 py-4 text-base font-medium text-bad transition-opacity hover:opacity-80 disabled:opacity-50"
              >
                <Pause className="size-6" aria-hidden="true" />
                To&rsquo;xtatish
              </button>
            )}

            {/*
              Tashqi API limiti: so'rovlar soni oshib ketganda
              server kutadi. Buni yashirish noto'g'ri bo'lardi —
              foydalanuvchi "osilib qoldi" deb o'ylaydi.
            */}
            <WaitingBadge until={waitingUntil} />
          </div>
        </header>

        {/* --- Ko'rsatkichlar --- */}
        {dashboard.run?.randomMode ? (
          <div className="grid w-full shrink-0 grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-5">
            <KpiCard
              label="Maqsad"
              value={`${dashboard.run.randomTarget ?? 0} ta`}
            />
            <KpiCard
              label="Kiritildi"
              value={
                <span className="flex items-baseline gap-1.5">
                  <span className="text-ok">
                    {dashboard.run.randomAdded ?? 0} ta
                  </span>
                  {/* Barcha random yurishlar bo'yicha jami. */}
                  {(dashboard.run.randomAddedTotal ?? 0) >
                  (dashboard.run.randomAdded ?? 0) ? (
                    <span className="text-base text-warn">
                      / {dashboard.run.randomAddedTotal} ta
                    </span>
                  ) : null}
                </span>
              }
              percent={percentOf(
                dashboard.run.randomAdded ?? 0,
                dashboard.run.randomTarget ?? 0,
              )}
              tone="ok"
            />
            <KpiCard
              label="Xato"
              value={`${stats.failed} ta`}
              tone="bad"
            />
            <KpiCard
              label="O'tkazildi"
              value={`${stats.pending} ta`}
              tone="pending"
            />
            <KpiCard
              label="Rejim"
              value="Random"
            />
          </div>
        ) : (
          <div className="grid w-full shrink-0 grid-cols-2 gap-2.5 md:grid-cols-4">
            <KpiCard
              label="Jami aholi"
              value={`${stats.peopleTotal} ta`}
              to={reportTo("total")}
            />
            <KpiCard
              label="Ro'yxatga olingan aholi"
              value={`${stats.added} ta`}
              percent={percentOf(stats.added, stats.peopleTotal)}
              tone="ok"
              to={reportTo("added")}
            />
            {/*
              Platformada AVVALDAN turgan aholi — biz qo'shmaganmiz.
              Ilgari "ro'yxatga olingan" ichiga qo'shilib ketardi va
              natija bizning ishimizdan ko'proq ko'rinardi. Endi
              alohida: "qo'shilgan" faqat biz kiritganlar.
            */}
            <KpiCard
              label="Platformada mavjud aholi"
              value={`${stats.exists ?? 0} ta`}
              percent={percentOf(stats.exists ?? 0, stats.peopleTotal)}
              tone="brand"
              to={reportTo("exists")}
            />
            {/*
              Boshqa MFY da ro'yxatda turgani uchun kirita
              olmaganlar — odam ko'chib ketgan. Bu xato emas, shuning
              uchun "rad etilgan" dan ajratildi: mahalla xodimi
              "qancha odam boshqa joyda yashaydi" ni ko'rib tursin.
            */}
            <KpiCard
              label="Boshqa MFY da mavjud"
              value={`${stats.movedAway ?? 0} ta`}
              percent={percentOf(stats.movedAway ?? 0, stats.peopleTotal)}
              tone="warn"
              to={reportTo("movedAway")}
            />
            <KpiCard
              label="Ro'yxatga olib bo'lmagan aholi"
              value={`${stats.failed} ta`}
              percent={percentOf(stats.failed, stats.peopleTotal)}
              tone="bad"
              to={reportTo("failed")}
            />
            <KpiCard
              label="Ro'yxatga olinish kutilmoqda"
              value={`${stats.pending} ta`}
              percent={percentOf(stats.pending, stats.peopleTotal)}
              tone="pending"
              to={reportTo("pending")}
            />
            <KpiCard
              label="Jami xonadon"
              value={`${stats.homesTotal} ta`}
              to={reportTo("homes")}
            />
            <ReportDownloadCard disabled={!dashboard.run} />
          </div>
        )}

        {/* --- Jarayon chizig'i --- */}
        {(() => {
          const run = dashboard.run;
          const randomPercent =
            run?.randomMode && run.randomTarget > 0
              ? Math.round(((run.randomAdded ?? 0) / run.randomTarget) * 100)
              : null;
          const pct = randomPercent ?? stats.percent;

          return (
            <div
              className="flex h-2 w-full shrink-0 items-center overflow-hidden rounded-full bg-canvas"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={run?.randomMode ? "Random jarayon" : "Xonadonlar bo'yicha jarayon"}
            >
              <div
                className="h-full rounded-full bg-brand transition-[width] duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          );
        })()}

        {/* --- Jonli kuzatuv --- */}
        <LiveFeed
          members={dashboard.members}
          onDetails={openDetails}
          note={<StatusNote dashboard={dashboard} />}
          emptyHint={
            dashboard.isLoading
              ? "Yuklanmoqda..."
              : dashboard.run
                ? "Hozircha yozuv yo'q"
                : 'Jarayon hali boshlanmagan — "Boshlash" tugmasini bosing'
          }
        />
      </div>

      <MemberDetailsModal
        memberId={memberId}
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
      />

      <RandomStartModal
        isOpen={isRandomModalOpen}
        onOpenChange={setIsRandomModalOpen}
        isBusy={dashboard.isBusy}
        onStart={(target) => {
          dashboard.randomStart(target).then((ok) => {
            if (ok) setIsRandomModalOpen(false);
          });
        }}
      />

      <StreetSettingsModal
        isOpen={isSettingsModalOpen}
        onOpenChange={setIsSettingsModalOpen}
      />
    </div>
  );
};

/**
 * Limit tufayli kutish — qolgan sekundlar sanab turadi.
 *
 * Nega alohida komponent: har sekundda qayta render bo'ladi, shuni
 * butun sahifaga yoyish ortiqcha bo'lardi.
 */
const WaitingBadge = ({ until }) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!until) return undefined;

    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, [until]);

  if (!until) return null;

  const left = Math.ceil((new Date(until).getTime() - now) / 1000);
  if (left <= 0) return null;

  return (
    <div className="flex items-center gap-4 rounded-full bg-warn-soft px-6 py-4 text-base font-medium text-warn">
      <Loader className="size-6 animate-spin" aria-hidden="true" />
      Kutilmoqda
      <span>{left}s</span>
    </div>
  );
};

/**
 * Hozir nima bo'layotgani — jonli kuzatuv sarlavhasining o'ng
 * tomonida, bitta qisqa qator.
 *
 * Maketda bu yer bo'sh turadi, lekin jarayon qaysi xonadonda
 * ketayotganini ko'rsatmaslik kuzatuvning ma'nosini yo'qotardi.
 */
const StatusNote = ({ dashboard }) => {
  const { run, currentHome, stats, scan, isScanning } = dashboard;

  // Hisoblash ketayotgan bo'lsa — qaysi ko'chada ekani ko'rinadi.
  // Jarayon bir necha daqiqa oladi, shuning uchun jim turish
  // "osilib qoldi" degan taassurot qoldirardi.
  if (isScanning) {
    return (
      <span className="truncate text-brand">
        {scan?.stage ?? "Hisoblanmoqda..."}
      </span>
    );
  }

  if (scan?.status === "error") {
    return <span className="text-bad">{scan.error}</span>;
  }

  if (!run) {
    return dashboard.needsScan ? (
      <span className="text-warn">
        Mahalla hali hisoblanmagan — &ldquo;Hisoblash&rdquo; tugmasini bosing
      </span>
    ) : null;
  }

  if (run.isStale) {
    return (
      <span className="text-warn">
        Jarayon uzilgan — &ldquo;Boshlash&rdquo; bilan tiklang
      </span>
    );
  }

  if (run.error) return <span className="text-bad">{run.error}</span>;

  if (run.randomMode) {
    if (!run.isActive) {
      return (
        <span>
          Random · to&rsquo;xtatilgan · {run.randomAdded ?? 0}/{run.randomTarget ?? 0}
        </span>
      );
    }

    return (
      <span className="truncate">
        Random · {run.randomAdded ?? 0}/{run.randomTarget ?? 0} muvaffaqiyatli
      </span>
    );
  }

  if (!run.isActive) {
    return (
      <span>
        To&rsquo;xtatilgan · xonadon {stats?.homesDone}/{stats?.homesTotal}
      </span>
    );
  }

  return (
    <span className="truncate">
      Xonadon {stats?.homesDone}/{stats?.homesTotal}
      {currentHome
        ? ` · ${currentHome.streetName}, ${currentHome.homeNum}-uy`
        : ""}
    </span>
  );
};

export default DashboardPage;
