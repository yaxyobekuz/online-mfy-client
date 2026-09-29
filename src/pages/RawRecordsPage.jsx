import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Spinner } from "@heroui/react";
import { AlertTriangle, ListChecks, Phone, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";
import api from "../config/api";
import RawRecordsTable from "../components/RawRecordsTable.jsx";
import HomesPagination from "../components/HomesPagination.jsx";
import HomesStats from "../components/HomesStats.jsx";
import HomesDetailsSyncProgress from "../components/HomesDetailsSyncProgress.jsx";
import HomesSyncErrorsModal from "../components/HomesSyncErrorsModal.jsx";
import { useHomesDetailsSync } from "../hooks/useHomesDetailsSync.js";

const RawRecordsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;
  const fileInputRef = useRef(null);

  const [recordsPage, setRecordsPage] = useState({
    items: [],
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFixingPhones, setIsFixingPhones] = useState(false);

  const loadRecords = useCallback(
    () =>
      Promise.all([
        api.get("/api/raw-records", { params: { page } }),
        api.get("/api/raw-records/stats"),
      ]).then(([recordsData, statsData]) => {
        setRecordsPage(recordsData);
        setStats(statsData);
      }),
    [page],
  );

  const gcpSync = useHomesDetailsSync("/api/raw-records/gcp-sync", loadRecords, {
    statusUrl: "/api/raw-records/gcp-sync/status",
    doneMessage: "Ma'lumotlar so'nggi holatga yangilandi",
    partialMessage: (failed) =>
      `Yangilandi, lekin ${failed} ta yozuvda xatolik bo'ldi`,
    startFailedMessage: "Yangilashni boshlashda xatolik yuz berdi.",
    runningMessage: "Yangilashda xatolik yuz berdi.",
  });

  useEffect(() => {
    loadRecords()
      .catch(() => {
        toast.error("Ma'lumotlarni yuklashda xatolik yuz berdi.");
      })
      .finally(() => setIsLoading(false));
  }, [loadRecords]);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(true);

    api
      .post("/api/raw-records/upload", formData)
      .then(() => {
        toast.success("Fayl muvaffaqiyatli yuklandi");
        if (page === 1) {
          loadRecords();
        } else {
          setSearchParams({ page: "1" });
        }
      })
      .catch((err) => {
        toast.error(err?.message || "Faylni yuklashda xatolik yuz berdi.");
      })
      .finally(() => setIsUploading(false));
  };

  const handleFixPhones = () => {
    setIsFixingPhones(true);

    api
      .post("/api/raw-records/fix-phones")
      .then((data) => {
        toast.success(`${data.fixed} ta telefon raqami tuzatildi`);
        loadRecords();
      })
      .catch(() => {
        toast.error("Telefon raqamlarni tuzatishda xatolik yuz berdi.");
      })
      .finally(() => setIsFixingPhones(false));
  };

  const handleDelete = () => {
    setIsDeleting(true);

    api
      .delete("/api/raw-records")
      .then(() => {
        toast.success("Ma'lumotlar o'chirildi");
        setSearchParams({ page: "1" });
        loadRecords();
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
          <h1 className="text-xl font-semibold text-foreground">
            Xom ma'lumot
          </h1>

          <div className="flex flex-wrap items-center gap-2">
            {recordsPage.total > 0 && (
              <>
                {gcpSync.progress?.failed > 0 && (
                  <Button
                    onPress={() => gcpSync.setShowErrors(true)}
                    variant="ghost"
                  >
                    <AlertTriangle
                      className="size-4 text-danger"
                      aria-hidden="true"
                    />
                    {gcpSync.progress.failed} ta xatolik
                  </Button>
                )}

                <Button
                  onPress={() => gcpSync.start({ onlyMissing: true })}
                  isDisabled={gcpSync.isRunning}
                  variant="ghost"
                >
                  <ListChecks className="size-4" aria-hidden="true" />
                  Yangilanmaganlarini yangilash
                </Button>

                <Button
                  onPress={() => gcpSync.start()}
                  isDisabled={gcpSync.isRunning}
                  variant="ghost"
                >
                  <ListChecks className="size-4" aria-hidden="true" />
                  So'nggi ma'lumotlarga yangilash
                </Button>

                <Button
                  onPress={handleFixPhones}
                  isDisabled={isFixingPhones}
                  variant="ghost"
                >
                  <Phone className="size-4" aria-hidden="true" />
                  {isFixingPhones
                    ? "Tuzatilmoqda..."
                    : "Tel raqamlarni tuzatish"}
                </Button>

                <Button
                  onPress={handleDelete}
                  isDisabled={isDeleting}
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

        <HomesStats
          stats={stats}
          totalLabel="Jami yozuvlar"
          positiveLabel="Yangilangan"
          negativeLabel="Yangilanmagan"
          positiveKey="synced"
          negativeKey="notSynced"
        />

        <HomesDetailsSyncProgress
          progress={gcpSync.progress}
          percent={gcpSync.percent}
          runningLabel="Ma'lumotlar so'nggi holatga yangilanmoqda..."
          doneLabel="Yangilandi"
        />

        <HomesSyncErrorsModal
          isOpen={gcpSync.showErrors}
          onOpenChange={gcpSync.setShowErrors}
          errors={gcpSync.progress?.errors}
        />

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" color="accent" aria-label="Yuklanmoqda" />
          </div>
        ) : recordsPage.items.length === 0 ? (
          <p className="py-10 text-center text-sm text-foreground/60">
            Hozircha ma'lumot mavjud emas. "Excel fayl yuklash" tugmasini
            bosing.
          </p>
        ) : (
          <>
            <RawRecordsTable records={recordsPage.items} />

            <HomesPagination
              page={recordsPage.page}
              totalPages={recordsPage.totalPages}
              total={recordsPage.total}
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

export default RawRecordsPage;
