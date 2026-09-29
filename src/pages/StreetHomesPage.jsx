import { useCallback, useEffect, useState } from "react";
import { Button, Spinner } from "@heroui/react";
import { AlertTriangle, ArrowLeft, ListChecks, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import api from "../config/api";
import HomesTable from "../components/HomesTable.jsx";
import HomesPagination from "../components/HomesPagination.jsx";
import HomesStats from "../components/HomesStats.jsx";
import HomesDetailsSyncProgress from "../components/HomesDetailsSyncProgress.jsx";
import HomesSyncErrorsModal from "../components/HomesSyncErrorsModal.jsx";
import { useHomesDetailsSync } from "../hooks/useHomesDetailsSync.js";

const StreetHomesPage = () => {
  const { streetId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;

  const [homesPage, setHomesPage] = useState({
    items: [],
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const loadHomes = useCallback(
    () =>
      Promise.all([
        api.get(`/api/streets/${streetId}/homes`, { params: { page } }),
        api.get(`/api/streets/${streetId}/homes/stats`),
      ]).then(([homesData, statsData]) => {
        setHomesPage(homesData);
        setStats(statsData);
      }),
    [streetId, page],
  );

  const detailsSync = useHomesDetailsSync(
    `/api/streets/${streetId}/homes/details/sync`,
    loadHomes,
  );

  useEffect(() => {
    loadHomes()
      .catch(() => {
        toast.error("Xonadonlarni yuklashda xatolik yuz berdi.");
      })
      .finally(() => setIsLoading(false));
  }, [loadHomes]);

  const updateHomes = () => {
    setIsUpdating(true);

    api
      .post(`/api/streets/${streetId}/homes/update`)
      .then(() => {
        if (page === 1) {
          loadHomes();
        } else {
          setSearchParams({ page: "1" });
        }
        toast.success("Xonadonlar yangilandi");
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
          <div className="flex items-center gap-3">
            <Button
              onPress={() => navigate("/")}
              variant="ghost"
              isIconOnly
              aria-label="Ortga"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
            </Button>

            <h1 className="text-xl font-semibold text-foreground">
              Xonadonlar
            </h1>
          </div>

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
              onPress={updateHomes}
              isDisabled={isUpdating}
              variant="secondary"
            >
              <RefreshCw
                className={`size-4 ${isUpdating ? "animate-spin" : ""}`}
                aria-hidden="true"
              />
              Xonadonlarni yangilash
            </Button>
          </div>
        </div>

        <HomesStats stats={stats} />

        <HomesDetailsSyncProgress
          progress={detailsSync.progress}
          percent={detailsSync.percent}
        />

        <HomesSyncErrorsModal
          isOpen={detailsSync.showErrors}
          onOpenChange={detailsSync.setShowErrors}
          errors={detailsSync.progress?.errors}
        />

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" color="accent" aria-label="Yuklanmoqda" />
          </div>
        ) : homesPage.items.length === 0 ? (
          <p className="py-10 text-center text-sm text-foreground/60">
            Hozircha xonadonlar mavjud emas. "Xonadonlarni yangilash"
            tugmasini bosing.
          </p>
        ) : (
          <>
            <HomesTable
              homes={homesPage.items}
              onRowPress={(home) =>
                navigate(`/streets/${streetId}/homes/${home.homeId}`)
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

export default StreetHomesPage;
