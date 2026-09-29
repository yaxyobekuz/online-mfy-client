import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Spinner } from "@heroui/react";
import { Phone, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";
import api from "../config/api";
import RawRecordsTable from "../components/RawRecordsTable.jsx";
import HomesPagination from "../components/HomesPagination.jsx";

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
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFixingPhones, setIsFixingPhones] = useState(false);

  const loadRecords = useCallback(
    () => api.get("/api/raw-records", { params: { page } }).then(setRecordsPage),
    [page],
  );

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
