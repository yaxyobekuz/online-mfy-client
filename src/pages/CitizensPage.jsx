import { useCallback, useEffect, useRef, useState } from "react";
import { Button, InputGroup, Spinner, TextField } from "@heroui/react";
import {
  AlertTriangle,
  ListChecks,
  Search,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";
import api from "../config/api";
import CitizensTable from "../components/CitizensTable.jsx";
import HomesPagination from "../components/HomesPagination.jsx";
import HomesStats from "../components/HomesStats.jsx";
import HomesDetailsSyncProgress from "../components/HomesDetailsSyncProgress.jsx";
import HomesSyncErrorsModal from "../components/HomesSyncErrorsModal.jsx";
import { useHomesDetailsSync } from "../hooks/useHomesDetailsSync.js";

const CitizensPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;
  const search = searchParams.get("search") ?? "";
  const fileInputRef = useRef(null);

  const [citizensPage, setCitizensPage] = useState({
    items: [],
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchInput, setSearchInput] = useState(search);

  const loadCitizens = useCallback(
    () =>
      Promise.all([
        api.get("/api/citizens", { params: { page, search } }),
        api.get("/api/citizens/stats"),
      ]).then(([citizensData, statsData]) => {
        setCitizensPage(citizensData);
        setStats(statsData);
      }),
    [page, search],
  );

  const sync = useHomesDetailsSync("/api/citizens/sync", loadCitizens, {
    statusUrl: "/api/citizens/sync/status",
    doneMessage: "Ma'lumotlar so'nggi holatga yangilandi",
    partialMessage: (failed) =>
      `Yangilandi, lekin ${failed} ta yozuvda xatolik bo'ldi`,
    startFailedMessage: "Yangilashni boshlashda xatolik yuz berdi.",
    runningMessage: "Yangilashda xatolik yuz berdi.",
  });

  useEffect(() => {
    loadCitizens()
      .catch(() => {
        toast.error("Ma'lumotlarni yuklashda xatolik yuz berdi.");
      })
      .finally(() => setIsLoading(false));
  }, [loadCitizens]);

  // Qidiruv o'zgarganda 1-sahifaga qaytamiz: 10-sahifada turib yangi
  // so'z qidirsak, natija bo'sh ko'rinib qolardi.
  const applySearch = (value) => {
    const next = value.trim();
    setSearchParams(next ? { search: next } : {});
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(true);

    api
      .post("/api/citizens/upload", formData)
      .then((data) => {
        toast.success(`${data.total} ta yozuv yuklandi`);
        setSearchParams({});
        setSearchInput("");
        loadCitizens();
      })
      .catch((err) => {
        toast.error(err?.message || "Faylni yuklashda xatolik yuz berdi.");
      })
      .finally(() => setIsUploading(false));
  };

  const handleDelete = () => {
    setIsDeleting(true);

    api
      .delete("/api/citizens")
      .then(() => {
        toast.success("Ma'lumotlar o'chirildi");
        setSearchParams({});
        setSearchInput("");
        loadCitizens();
      })
      .catch(() => {
        toast.error("O'chirishda xatolik yuz berdi.");
      })
      .finally(() => setIsDeleting(false));
  };

  return (
    <div className="py-5">
      <div className="container">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              Umumiy fuqarolar bazasi
            </h1>
            <p className="text-sm text-foreground/60">
              Barcha foydalanuvchilar uchun umumiy ma'lumot
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {stats?.total > 0 && (
              <>
                {sync.progress?.failed > 0 && (
                  <Button
                    onPress={() => sync.setShowErrors(true)}
                    variant="ghost"
                  >
                    <AlertTriangle
                      className="size-4 text-danger"
                      aria-hidden="true"
                    />
                    {sync.progress.failed} ta xatolik
                  </Button>
                )}

                <Button
                  onPress={() => sync.start({ onlyMissing: true })}
                  isDisabled={sync.isRunning}
                  variant="ghost"
                >
                  <ListChecks className="size-4" aria-hidden="true" />
                  Yangilanmaganlarini yangilash
                </Button>

                <Button
                  onPress={() => sync.start()}
                  isDisabled={sync.isRunning}
                  variant="ghost"
                >
                  <ListChecks className="size-4" aria-hidden="true" />
                  So'nggi ma'lumotlarga yangilash
                </Button>

                <Button
                  onPress={handleDelete}
                  isDisabled={isDeleting || isUploading}
                  variant="ghost"
                >
                  <Trash2 className="size-4 text-danger" aria-hidden="true" />
                  Barchasini o'chirish
                </Button>
              </>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileChange}
            />

            <Button
              onPress={() => fileInputRef.current?.click()}
              isDisabled={isUploading}
              variant="secondary"
            >
              <Upload className="size-4" aria-hidden="true" />
              {isUploading ? "Yuklanmoqda..." : "Excel fayl yuklash"}
            </Button>
          </div>
        </div>

        <div className="mb-5">
          <TextField aria-label="Qidirish" className="w-full sm:w-96">
            <InputGroup className="w-full">
              <InputGroup.Prefix>
                <Search className="size-4" aria-hidden="true" />
              </InputGroup.Prefix>
              <InputGroup.Input
                className="w-full"
                value={searchInput}
                placeholder="F.I.Sh., JSHSHIR, hujjat, kadastr yoki manzil"
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
          totalLabel="Jami fuqarolar"
          positiveLabel="Yangilangan"
          negativeLabel="Yangilanmagan"
          positiveKey="synced"
          negativeKey="notSynced"
          negativeClassName="text-foreground/60"
          extraLabel="Hujjati eskirgan"
          extraKey="expired"
        />

        <HomesDetailsSyncProgress
          progress={sync.progress}
          percent={sync.percent}
          runningLabel="Ma'lumotlar so'nggi holatga yangilanmoqda..."
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
        ) : citizensPage.items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Users className="size-8 text-foreground/30" aria-hidden="true" />
            <p className="text-sm text-foreground/60">
              {search
                ? `"${search}" bo'yicha hech narsa topilmadi.`
                : 'Hozircha ma\'lumot mavjud emas. "Excel fayl yuklash" tugmasini bosing.'}
            </p>
          </div>
        ) : (
          <>
            <CitizensTable citizens={citizensPage.items} />

            <HomesPagination
              page={citizensPage.page}
              totalPages={citizensPage.totalPages}
              total={citizensPage.total}
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

export default CitizensPage;
