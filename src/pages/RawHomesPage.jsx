import { useCallback, useEffect, useState } from "react";
import { InputGroup, Spinner, TextField } from "@heroui/react";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../config/api";
import RawHomesTable from "../components/RawHomesTable.jsx";
import HomesPagination from "../components/HomesPagination.jsx";
import HomesStats from "../components/HomesStats.jsx";

const RawHomesPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;
  const search = searchParams.get("search") ?? "";

  const [homesPage, setHomesPage] = useState({
    items: [],
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(search);

  const loadHomes = useCallback(
    () =>
      Promise.all([
        api.get("/api/raw-homes", { params: { page, search } }),
        api.get("/api/raw-homes/stats"),
      ]).then(([homesData, statsData]) => {
        setHomesPage(homesData);
        setStats(statsData);
      }),
    [page, search],
  );

  useEffect(() => {
    loadHomes()
      .catch(() => {
        toast.error("Xonadonlarni yuklashda xatolik yuz berdi.");
      })
      .finally(() => setIsLoading(false));
  }, [loadHomes]);

  const applySearch = (value) => {
    const next = value.trim();
    setSearchParams(next ? { search: next } : {});
  };

  return (
    <div className="py-5">
      <div className="container">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-xl font-semibold text-foreground">
            Xom xonadonlar
          </h1>

          <TextField aria-label="Qidirish" className="w-full sm:w-80">
            <InputGroup className="w-full">
              <InputGroup.Prefix>
                <Search className="size-4" aria-hidden="true" />
              </InputGroup.Prefix>
              <InputGroup.Input
                className="w-full"
                value={searchInput}
                placeholder="Kadastr raqami yoki F.I.Sh."
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
          totalLabel="Jami xonadonlar"
          positiveLabel="Aniq"
          negativeLabel="Tekshirish kerak"
          positiveKey="complete"
          negativeKey="incomplete"
        />

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" color="accent" aria-label="Yuklanmoqda" />
          </div>
        ) : homesPage.items.length === 0 ? (
          <p className="py-10 text-center text-sm text-foreground/60">
            {search
              ? `"${search}" bo'yicha hech narsa topilmadi.`
              : "Hozircha xonadonlar mavjud emas. Avval Xom ma'lumot bo'limiga Excel fayl yuklang."}
          </p>
        ) : (
          <>
            <RawHomesTable
              homes={homesPage.items}
              onRowPress={(home) =>
                navigate(`/raw-homes/${encodeURIComponent(home.cadasterNumber)}`)
              }
            />

            <HomesPagination
              page={homesPage.page}
              totalPages={homesPage.totalPages}
              total={homesPage.total}
              onPageChange={(nextPage) =>
                setSearchParams(
                  search
                    ? { page: String(nextPage), search }
                    : { page: String(nextPage) },
                )
              }
            />
          </>
        )}
      </div>
    </div>
  );
};

export default RawHomesPage;
