import { useCallback, useEffect, useState } from "react";
import { Button, InputGroup, Spinner, TextField } from "@heroui/react";
import { AlertTriangle, MapPinned, Search } from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";
import api from "../config/api";
import MahallasTable from "../components/MahallasTable.jsx";
import HomesPagination from "../components/HomesPagination.jsx";
import HomesStats from "../components/HomesStats.jsx";
import HomesDetailsSyncProgress from "../components/HomesDetailsSyncProgress.jsx";
import HomesSyncErrorsModal from "../components/HomesSyncErrorsModal.jsx";
import { useHomesDetailsSync } from "../hooks/useHomesDetailsSync.js";

const MahallasPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;
  const search = searchParams.get("search") ?? "";

  const [mahallasPage, setMahallasPage] = useState({
    items: [],
    page: 1,
    totalPages: 1,
    total: 0,
    pageSize: 100,
  });
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(search);
  // Qaysi mahalla yangilanayotganini ko'rsatish uchun
  const [syncing, setSyncing] = useState(null);

  const loadMahallas = useCallback(
    () =>
      Promise.all([
        api.get("/api/mahallas", { params: { page, search } }),
        api.get("/api/mahallas/stats"),
      ]).then(([listData, statsData]) => {
        setMahallasPage(listData);
        setStats(statsData);
      }),
    [page, search],
  );

  const sync = useHomesDetailsSync("/api/citizens/sync", loadMahallas, {
    statusUrl: "/api/citizens/sync/status",
    doneMessage: "Mahalla ma'lumotlari yangilandi",
    partialMessage: (failed) =>
      `Yangilandi, lekin ${failed} ta yozuvda xatolik bo'ldi`,
    startFailedMessage: "Yangilashni boshlashda xatolik yuz berdi.",
    runningMessage: "Yangilashda xatolik yuz berdi.",
  });

  useEffect(() => {
    loadMahallas()
      .catch(() => {
        toast.error("Mahallalarni yuklashda xatolik yuz berdi.");
      })
      .finally(() => setIsLoading(false));
  }, [loadMahallas]);

  const handleSync = (mahalla) => {
    setSyncing(mahalla.key);
    // Boshlanmasa (xato yoki yangilanadigan yozuv yo'q) — belgini
    // darhol tozalaymiz, tugma "Yangilanmoqda..." bo'lib qolmasin.
    sync
      .start({ params: { mahalla: mahalla.key } })
      .then((started) => {
        if (!started) setSyncing(null);
      });
  };

  // Tugma "Yangilanmoqda..." deb turadi: so'rov yuborilgandan boshlab
  // (progress hali kelmagan payt ham) jarayon tugagunicha. Tugagach
  // yoki xato bo'lgach o'zi so'nadi — alohida effect kerak emas.
  const syncingKey =
    syncing && (!sync.progress || sync.progress.status === "running")
      ? syncing
      : null;

  const applySearch = (value) => {
    const next = value.trim();
    setSearchParams(next ? { search: next } : {});
  };

  return (
    <div className="py-5">
      <div className="container">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              Mahallalar ro'yxati
            </h1>
            <p className="text-sm text-foreground/60">
              Umumiy fuqarolar bazasidagi manzillar asosida
            </p>
          </div>

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
          </div>

          <TextField aria-label="Qidirish" className="w-full sm:w-80">
            <InputGroup className="w-full">
              <InputGroup.Prefix>
                <Search className="size-4" aria-hidden="true" />
              </InputGroup.Prefix>
              <InputGroup.Input
                className="w-full"
                value={searchInput}
                placeholder="Mahalla nomi yoki kadastr kodi"
                onChange={(event) => setSearchInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") applySearch(searchInput);
                }}
              />
            </InputGroup>
          </TextField>
        </div>

        <HomesStats
          stats={stats}
          totalLabel="Jami mahallalar"
          positiveLabel="Jami fuqarolar"
          negativeLabel="Aniqlanmagan"
          positiveKey="citizens"
          negativeKey="unresolved"
          negativeClassName="text-foreground/60"
        />

        <HomesDetailsSyncProgress
          progress={sync.progress}
          percent={sync.percent}
          runningLabel="Mahalla fuqarolari yangilanmoqda..."
          doneLabel="Yangilandi"
        />

        <HomesSyncErrorsModal
          isOpen={sync.showErrors}
          onOpenChange={sync.setShowErrors}
          errors={sync.progress?.errors}
        />

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" color="accent" aria-label="Yuklanmoqda" />
          </div>
        ) : mahallasPage.items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <MapPinned
              className="size-8 text-foreground/30"
              aria-hidden="true"
            />
            <p className="text-sm text-foreground/60">
              {search
                ? `"${search}" bo'yicha hech narsa topilmadi.`
                : "Hozircha ma'lumot yo'q. Avval \"Umumiy fuqarolar bazasi\" bo'limiga Excel fayl yuklang."}
            </p>
          </div>
        ) : (
          <>
            <MahallasTable
              mahallas={mahallasPage.items}
              startIndex={(mahallasPage.page - 1) * mahallasPage.pageSize}
              onSync={handleSync}
              syncingKey={syncingKey}
              isSyncDisabled={sync.isRunning}
            />

            <HomesPagination
              page={mahallasPage.page}
              totalPages={mahallasPage.totalPages}
              total={mahallasPage.total}
              onPageChange={(nextPage) => {
                const next = { page: String(nextPage) };
                if (search) next.search = search;
                setSearchParams(next);
              }}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default MahallasPage;
