import { useCallback, useEffect, useState } from "react";
import { Button, Spinner } from "@heroui/react";
import { AlertTriangle, ArrowLeft, ListChecks } from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import api from "../config/api";
import CitizensTable from "../components/CitizensTable.jsx";
import HomesPagination from "../components/HomesPagination.jsx";
import HomesStats from "../components/HomesStats.jsx";
import HomesDetailsSyncProgress from "../components/HomesDetailsSyncProgress.jsx";
import HomesSyncErrorsModal from "../components/HomesSyncErrorsModal.jsx";
import { useHomesDetailsSync } from "../hooks/useHomesDetailsSync.js";

const MahallaDetailsPage = () => {
  const { key } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;

  const [data, setData] = useState({
    mahalla: null,
    items: [],
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(
    () =>
      api
        .get(`/api/mahallas/${encodeURIComponent(key)}/citizens`, {
          params: { page },
        })
        .then(setData),
    [key, page],
  );

  // Faqat shu mahalla fuqarolarini yangilaydi.
  const sync = useHomesDetailsSync("/api/citizens/sync", load, {
    statusUrl: "/api/citizens/sync/status",
    doneMessage: "Mahalla ma'lumotlari yangilandi",
    partialMessage: (failed) =>
      `Yangilandi, lekin ${failed} ta yozuvda xatolik bo'ldi`,
    startFailedMessage: "Yangilashni boshlashda xatolik yuz berdi.",
    runningMessage: "Yangilashda xatolik yuz berdi.",
  });

  useEffect(() => {
    load()
      .catch((err) => {
        if (err?.message === "Mahalla topilmadi") {
          setNotFound(true);
          return;
        }
        toast.error(err?.message || "Ma'lumotni yuklashda xatolik yuz berdi.");
      })
      .finally(() => setIsLoading(false));
  }, [load]);

  const mahalla = data.mahalla;

  return (
    <div className="py-5">
      <div className="container">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <Button
            onPress={() => navigate("/mahallas")}
            variant="ghost"
            isIconOnly
            aria-label="Ortga"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Button>

          <div>
            <h1 className="text-xl font-semibold text-foreground">
              {mahalla?.name ?? "Mahalla"}
            </h1>
            <p className="text-sm text-foreground/60">
              {mahalla?.cadasterPrefix
                ? `Kadastr kodi: ${mahalla.cadasterPrefix}`
                : "Mahalla fuqarolari"}
              {mahalla?.nameVariants?.length > 0 &&
                ` · Boshqa yozilishi: ${mahalla.nameVariants.join(", ")}`}
            </p>
          </div>

          {mahalla && (
            <div className="ml-auto flex flex-wrap items-center gap-2">
              {sync.progress?.failed > 0 && (
                <Button onPress={() => sync.setShowErrors(true)} variant="ghost">
                  <AlertTriangle
                    className="size-4 text-danger"
                    aria-hidden="true"
                  />
                  {sync.progress.failed} ta xatolik
                </Button>
              )}

              <Button
                onPress={() =>
                  sync.start({ onlyMissing: true, params: { mahalla: key } })
                }
                isDisabled={sync.isRunning}
                variant="ghost"
              >
                <ListChecks className="size-4" aria-hidden="true" />
                Yangilanmaganlarini yangilash
              </Button>

              <Button
                onPress={() => sync.start({ params: { mahalla: key } })}
                isDisabled={sync.isRunning}
                variant="secondary"
              >
                <ListChecks className="size-4" aria-hidden="true" />
                {sync.isRunning
                  ? "Yangilanmoqda..."
                  : "So'nggi ma'lumotlarga yangilash"}
              </Button>
            </div>
          )}
        </div>

        <HomesDetailsSyncProgress
          progress={sync.progress}
          percent={sync.percent}
          runningLabel={`${mahalla?.name ?? "Mahalla"} yangilanmoqda...`}
          doneLabel="Yangilandi"
        />

        <HomesSyncErrorsModal
          isOpen={sync.showErrors}
          onOpenChange={sync.setShowErrors}
          errors={sync.progress?.errors}
        />

        {mahalla && (
          <HomesStats
            stats={mahalla}
            totalLabel="Jami fuqarolar"
            positiveLabel="JSHSHIR'i bor"
            negativeLabel="JSHSHIR'i yo'q"
            positiveKey="withPinfl"
            negativeKey="withoutPinfl"
            negativeClassName="text-warning"
            extraLabel="Kadastrlar"
            extraKey="cadasterCount"
          />
        )}

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" color="accent" aria-label="Yuklanmoqda" />
          </div>
        ) : notFound ? (
          <p className="py-10 text-center text-sm text-foreground/60">
            Bunday mahalla topilmadi. Ro'yxatdan tanlang.
          </p>
        ) : data.items.length === 0 ? (
          <p className="py-10 text-center text-sm text-foreground/60">
            Bu mahallada fuqaro topilmadi.
          </p>
        ) : (
          <>
            <CitizensTable citizens={data.items} />

            <HomesPagination
              page={data.page}
              totalPages={data.totalPages}
              total={data.total}
              onPageChange={(nextPage) =>
                setSearchParams({ page: String(nextPage) })
              }
            />
          </>
        )}
      </div>
    </div>
  );
};

export default MahallaDetailsPage;
