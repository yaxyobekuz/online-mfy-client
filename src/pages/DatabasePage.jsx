import { useCallback, useEffect, useRef, useState } from "react";
import { Spinner, Table } from "@heroui/react";
import { Search, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";
import api from "../config/api";

/**
 * Umumiy ma'lumotlar ba'zasi — BITTA jadvalda barcha fuqarolar.
 *
 * Ma'lumot Excel faylidan to'g'ridan-to'g'ri yuklanadi va shu
 * ko'rinishda saqlanadi: davlat bazasiga qo'shimcha so'rov
 * yuborilmaydi. Jarayon (Asosiy bo'lim) aynan shu yozuvlardan
 * foydalanadi.
 */

// Excel faylidagi ustunlar tartibi saqlanadi — shunda yuklangan
// fayl bilan yonma-yon solishtirish oson bo'ladi.
const columns = [
  { id: "rowNumber", name: "№" },
  { id: "fullName", name: "F.I.Sh." },
  { id: "fullNameCyrillic", name: "Ф.И.Ш." },
  { id: "birthDate", name: "Tug'ilgan sana" },
  { id: "document", name: "Hujjat" },
  { id: "pinfl", name: "JSHSHIR" },
  { id: "cadasterNumber", name: "Kadastr" },
  { id: "address", name: "Manzil" },
];

const DatabasePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;
  const search = searchParams.get("search") ?? "";

  const fileInputRef = useRef(null);

  // `key` — natija qaysi so'rovga tegishli. Boshida `null`:
  // demak hali hech narsa yuklanmagan.
  const [result, setResult] = useState({
    key: null,
    items: [],
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [isUploading, setIsUploading] = useState(false);
  const [searchInput, setSearchInput] = useState(search);

  // Yuklangan natija qaysi so'rovga tegishli ekani kalit bilan
  // saqlanadi. Shunda "yuklanyaptimi" degan savol state'ning
  // o'zidan ko'rinadi va effect boshida setState chaqirish kerak
  // bo'lmaydi (React buni tavsiya qilmaydi — ortiqcha render).
  const key = `${page}|${search}`;
  const isLoading = result.key !== key;

  const load = useCallback(
    () =>
      api
        .get("/api/citizens", { params: { page, search } })
        .then((data) => setResult({ ...data, key: `${page}|${search}` })),
    [page, search],
  );

  useEffect(() => {
    let cancelled = false;

    load().catch(() => {
      if (!cancelled) toast.error("Ma'lumotlarni yuklashda xatolik yuz berdi");
    });

    return () => {
      cancelled = true;
    };
  }, [load]);

  // Qidiruv o'zgarganda 1-sahifaga qaytamiz: 10-sahifada turib yangi
  // so'z qidirilsa, natija bo'sh ko'rinib qolardi.
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
        return load();
      })
      .catch((err) => {
        toast.error(err?.message || "Faylni yuklashda xatolik yuz berdi");
      })
      .finally(() => setIsUploading(false));
  };

  const handleDelete = () => {
    // Butun baza o'chiriladi — ortga qaytarib bo'lmaydi, shuning
    // uchun tasdiqlash so'raladi.
    if (!window.confirm("Butun baza o'chiriladi. Davom etasizmi?")) return;

    api
      .delete("/api/citizens")
      .then(() => {
        toast.success("Ma'lumotlar o'chirildi");
        setSearchParams({});
        setSearchInput("");
        return load();
      })
      .catch(() => toast.error("O'chirishda xatolik yuz berdi"));
  };

  const goToPage = (nextPage) => {
    const next = { page: String(nextPage) };
    if (search) next.search = search;
    setSearchParams(next);
  };

  return (
    <div className="flex h-svh min-w-0 flex-1 flex-col py-2 pr-2">
      <div className="flex min-h-0 flex-1 flex-col gap-2.5 rounded-3xl bg-panel px-6 py-2">
        <header className="flex w-full shrink-0 flex-wrap items-center justify-between gap-4 py-2">
          <div>
            <p className="text-xl font-bold text-ink">
              Umumiy ma&rsquo;lumotlar ba&rsquo;zasi
            </p>
            <p className="text-sm text-muted">
              {result.total.toLocaleString("uz-UZ")} ta yozuv
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 rounded-full bg-canvas px-4 py-3">
              <Search className="size-5 shrink-0 text-muted" aria-hidden="true" />
              <input
                type="search"
                value={searchInput}
                placeholder="F.I.Sh., JSHSHIR, hujjat yoki kadastr"
                aria-label="Qidirish"
                onChange={(event) => setSearchInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") applySearch(searchInput);
                }}
                className="w-64 bg-transparent text-sm text-ink outline-none placeholder:text-muted"
              />
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileChange}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-2 rounded-full bg-brand-soft px-4 py-3 text-sm font-medium text-brand transition-opacity hover:opacity-80 disabled:opacity-50"
            >
              <Upload className="size-5" aria-hidden="true" />
              {isUploading ? "Yuklanmoqda..." : "Excel yuklash"}
            </button>

            {result.total > 0 && (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-2 rounded-full bg-bad-soft px-4 py-3 text-sm font-medium text-bad transition-opacity hover:opacity-80"
              >
                <Trash2 className="size-5" aria-hidden="true" />
                O&rsquo;chirish
              </button>
            )}
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-2.5 rounded-xl bg-canvas p-3">
          {isLoading ? (
            <div className="flex flex-1 items-center justify-center">
              <Spinner size="lg" color="accent" aria-label="Yuklanmoqda" />
            </div>
          ) : result.items.length === 0 ? (
            <p className="flex flex-1 items-center justify-center text-center text-sm text-muted">
              {search
                ? `"${search}" bo'yicha hech narsa topilmadi.`
                : 'Hozircha ma’lumot yo’q — "Excel yuklash" tugmasini bosing.'}
            </p>
          ) : (
            <div className="min-h-0 flex-1 overflow-auto">
              <Table aria-label="Umumiy ma'lumotlar ba'zasi">
                <Table.Content aria-label="Umumiy ma'lumotlar ba'zasi">
                  <Table.Header columns={columns}>
                    {(column) => (
                      <Table.Column isRowHeader={column.id === "rowNumber"}>
                        {column.name}
                      </Table.Column>
                    )}
                  </Table.Header>

                  <Table.Body items={result.items}>
                    {(citizen) => (
                      <Table.Row id={citizen._id}>
                        {/*
                          Kataklar ataylab bittama-bitta yozilgan:
                          dinamik ko'rinishda `Table.Row` ustunlar
                          ro'yxatini alohida talab qiladi, bu esa
                          ortiqcha chalkashlik beradi.
                        */}
                        <Table.Cell>{citizen.rowNumber ?? "—"}</Table.Cell>
                        <Table.Cell>{citizen.fullName ?? "—"}</Table.Cell>
                        <Table.Cell>
                          {citizen.fullNameCyrillic ?? "—"}
                        </Table.Cell>
                        <Table.Cell>{citizen.birthDate ?? "—"}</Table.Cell>
                        <Table.Cell>{citizen.document ?? "—"}</Table.Cell>
                        <Table.Cell>
                          {citizen.pinfl ?? (
                            <span className="text-muted">yo&rsquo;q</span>
                          )}
                        </Table.Cell>
                        <Table.Cell>
                          {citizen.cadasterNumber ?? "—"}
                        </Table.Cell>
                        <Table.Cell>{citizen.address ?? "—"}</Table.Cell>
                      </Table.Row>
                    )}
                  </Table.Body>
                </Table.Content>
              </Table>
            </div>
          )}

          {result.totalPages > 1 && (
            <div className="flex shrink-0 items-center justify-between gap-3 px-1">
              <p className="text-sm text-muted">
                {result.page}-sahifa, jami {result.totalPages}
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => goToPage(result.page - 1)}
                  disabled={result.page <= 1}
                  className="rounded-full bg-panel px-4 py-2 text-sm font-medium text-ink transition-opacity hover:opacity-80 disabled:opacity-40"
                >
                  Oldingi
                </button>
                <button
                  type="button"
                  onClick={() => goToPage(result.page + 1)}
                  disabled={result.page >= result.totalPages}
                  className="rounded-full bg-panel px-4 py-2 text-sm font-medium text-ink transition-opacity hover:opacity-80 disabled:opacity-40"
                >
                  Keyingi
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DatabasePage;
