import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Spinner } from "@heroui/react";
import { AlertTriangle, ListChecks, RefreshCw, Users } from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../config/api";
import HomesTable from "../components/HomesTable.jsx";
import HomesPagination from "../components/HomesPagination.jsx";
import HomesStats from "../components/HomesStats.jsx";
import HomesDetailsSyncProgress from "../components/HomesDetailsSyncProgress.jsx";
import HomesSyncErrorsModal from "../components/HomesSyncErrorsModal.jsx";
import { useHomesDetailsSync } from "../hooks/useHomesDetailsSync.js";

const HomesPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;

  const [homesPage, setHomesPage] = useState({
    items: [],
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [streets, setStreets] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const loadHomes = useCallback(
    () =>
      Promise.all([
        api.get("/api/homes", { params: { page } }),
        api.get("/api/streets"),
        api.get("/api/homes/stats"),
      ]).then(([homesData, streetsData, statsData]) => {
        setHomesPage(homesData);
        setStreets(streetsData);
        setStats(statsData);
      }),
    [page],
  );

  const detailsSync = useHomesDetailsSync("/api/homes/details/sync", loadHomes);

  const familySync = useHomesDetailsSync("/api/homes/family/sync", loadHomes, {
    statusUrl: "/api/family/sync/status",
    doneMessage: "Oila a'zolari yuklandi",
    partialMessage: (failed) =>
      `Oila a'zolari yuklandi, lekin ${failed} ta xonadonda xatolik bo'ldi`,
    startFailedMessage: "Oila a'zolarini yuklashni boshlashda xatolik.",
    runningMessage: "Oila a'zolarini yuklashda xatolik yuz berdi.",
  });

  useEffect(() => {
    loadHomes()
      .catch(() => {
        toast.error("Xonadonlarni yuklashda xatolik yuz berdi.");
      })
      .finally(() => setIsLoading(false));
  }, [loadHomes]);

  const streetsById = useMemo(
    () => Object.fromEntries(streets.map((street) => [street.streetId, street])),
    [streets],
  );

  const updateAllHomes = () => {
    setIsUpdating(true);

    api
      .post("/api/homes/update")
      .then(() => {
        if (page === 1) {
          loadHomes();
        } else {
          setSearchParams({ page: "1" });
        }
        toast.success("Barcha xonadonlar yangilandi");
      })
      .catch(() => {
        toast.error("Xonadonlarni yangilashda xatolik yuz berdi.");
      })
      .finally(() => setIsUpdating(false));
  };

  return (
    <div className="py-5">
      <div className="container">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-xl font-semibold text-foreground">
            Xonadonlar
          </h1>

          <div className="flex flex-wrap items-center gap-2">
            {detailsSync.progress?.failed > 0 && (
              <Button
                onPress={() => detailsSync.setShowErrors(true)}
                variant="ghost"
              >
                <AlertTriangle
                  className="size-4 text-danger"
                  aria-hidden="true"
                />
                {detailsSync.progress.failed} ta xatolik
              </Button>
            )}

            {familySync.progress?.failed > 0 && (
              <Button
                onPress={() => familySync.setShowErrors(true)}
                variant="ghost"
              >
                <AlertTriangle
                  className="size-4 text-danger"
                  aria-hidden="true"
                />
                Oila: {familySync.progress.failed} ta xatolik
              </Button>
            )}

            <Button
              onPress={() => detailsSync.start({ onlyMissing: true })}
              isDisabled={detailsSync.isRunning}
              variant="ghost"
            >
              <ListChecks className="size-4" aria-hidden="true" />
              Yuklanmaganlarini yuklash
            </Button>

            <Button
              onPress={() => detailsSync.start()}
              isDisabled={detailsSync.isRunning}
              variant="ghost"
            >
              <ListChecks className="size-4" aria-hidden="true" />
              Barcha tafsilotlarni yuklash
            </Button>

            <Button
              onPress={() => familySync.start({ onlyMissing: true })}
              isDisabled={familySync.isRunning}
              variant="ghost"
            >
              <Users className="size-4" aria-hidden="true" />
              Oila a'zolarini yuklash
            </Button>

            <Button
              onPress={updateAllHomes}
              isDisabled={isUpdating}
              variant="secondary"
            >
              <RefreshCw
                className={`size-4 ${isUpdating ? "animate-spin" : ""}`}
                aria-hidden="true"
              />
              Barcha xonadonlarni yangilash
            </Button>
          </div>
        </div>

        <HomesStats stats={stats} />

        <HomesDetailsSyncProgress
          progress={detailsSync.progress}
          percent={detailsSync.percent}
        />

        <HomesDetailsSyncProgress
          progress={familySync.progress}
          percent={familySync.percent}
          runningLabel="Oila a'zolari yuklanmoqda..."
        />

        <HomesSyncErrorsModal
          isOpen={detailsSync.showErrors}
          onOpenChange={detailsSync.setShowErrors}
          errors={detailsSync.progress?.errors}
        />

        <HomesSyncErrorsModal
          isOpen={familySync.showErrors}
          onOpenChange={familySync.setShowErrors}
          errors={familySync.progress?.errors}
        />

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" color="accent" aria-label="Yuklanmoqda" />
          </div>
        ) : homesPage.items.length === 0 ? (
          <p className="py-10 text-center text-sm text-foreground/60">
            Hozircha xonadonlar mavjud emas. "Barcha xonadonlarni yangilash"
            tugmasini bosing.
          </p>
        ) : (
          <>
            <HomesTable
              homes={homesPage.items}
              streetsById={streetsById}
              withStreetColumn
              onRowPress={(home) =>
                navigate(`/streets/${home.streetId}/homes/${home.homeId}`)
              }
            />

            <HomesPagination
              page={homesPage.page}
              totalPages={homesPage.totalPages}
              total={homesPage.total}
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

export default HomesPage;
