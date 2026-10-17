import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Spinner, Table } from "@heroui/react";
import { ArrowLeft, Search } from "lucide-react";
import { toast } from "sonner";
import api from "../config/api";
import MemberDetailsModal from "../components/MemberDetailsModal.jsx";
import RecordDetailsModal from "../components/RecordDetailsModal.jsx";
import {
  HOME_STATUS_LABELS,
  HOME_STATUS_TONE,
  MEMBER_STATUS_LABELS,
  MEMBER_STATUS_TONE,
} from "../config/registration-labels.js";

/*
  Asosiy sahifa kartochkasi bosilganda ochiladigan RO'YXAT.

  Ro'yxat ham, sonlar ham serverda bitta qoida bo'yicha hisoblanadi —
  shuning uchun sahifadagi son kartochkadagi son bilan mos keladi.
  Har qatordagi "Ba'tafsil" shu yozuvning to'liq ma'lumotini ochadi.
*/

const PAGE_SIZE = 50;

const columns = [
  { id: "no", name: "№" },
  { id: "fullName", name: "F.I.Sh." },
  { id: "pinfl", name: "JSHSHIR" },
  { id: "cadasterNumber", name: "Kadastr" },
  { id: "subtitle", name: "Manzil" },
  { id: "status", name: "Holat" },
  { id: "reasonLabel", name: "Izoh" },
  { id: "details", name: "Ba'tafsil" },
];

const parsePage = (value) => {
  const page = Number.parseInt(value, 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
};

const statusOf = (row) => {
  if (row.kind === "home") {
    return {
      label: HOME_STATUS_LABELS[row.status] ?? row.status,
      tone: HOME_STATUS_TONE[row.status] ?? HOME_STATUS_TONE.pending,
    };
  }
  return {
    label: MEMBER_STATUS_LABELS[row.status] ?? row.status,
    tone: MEMBER_STATUS_TONE[row.status] ?? MEMBER_STATUS_TONE.pending,
  };
};

const ReportListPage = () => {
  const { mahallaSlug, kind } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parsePage(searchParams.get("page"));
  const search = searchParams.get("search") ?? "";

  const [searchInput, setSearchInput] = useState(search);
  const [selected, setSelected] = useState(null);

  // Natija qaysi so'rovga tegishli ekani kalit bilan saqlanadi —
  // DatabasePage bilan bir xil usul (effectda setState kerak emas).
  const key = `${kind}|${page}|${search}`;
  const [result, setResult] = useState({ key: null, data: null, failed: false });
  const isLoading = result.key !== key;

  useEffect(() => {
    let cancelled = false;

    api
      .get("/api/dashboard/list", { params: { kind, page, search } })
      .then((data) => {
        if (!cancelled) {
          setResult({ key: `${kind}|${page}|${search}`, data, failed: false });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setResult({ key: `${kind}|${page}|${search}`, data: null, failed: true });
          toast.error("Ro'yxatni yuklashda xatolik yuz berdi");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [kind, page, search]);

  const data = result.data;
  const items = (data?.items ?? []).map((row, index) => ({
    ...row,
    no: (page - 1) * PAGE_SIZE + index + 1,
  }));

  // Qidiruv o'zgarganda 1-sahifaga qaytamiz.
  const applySearch = (value) => {
    const next = value.trim();
    setSearchParams(next ? { search: next } : {});
  };

  const goToPage = (nextPage) => {
    const next = { page: String(nextPage) };
    if (search) next.search = search;
    setSearchParams(next);
  };

  const closeDetails = (open) => {
    if (!open) setSelected(null);
  };

  return (
    <div className="flex h-svh min-w-0 flex-1 flex-col py-2 pr-2 pl-2">
      <div className="flex min-h-0 flex-1 flex-col gap-2.5 rounded-3xl bg-panel px-6 py-2">
        <header className="flex w-full shrink-0 flex-wrap items-center justify-between gap-4 py-2">
          <div className="flex items-center gap-4">
            <Link
              to={`/${mahallaSlug}`}
              className="flex items-center gap-2 rounded-full bg-canvas px-4 py-3 text-sm font-medium text-ink transition-opacity hover:opacity-80"
            >
              <ArrowLeft className="size-5" aria-hidden="true" />
              Asosiy
            </Link>

            <div>
              <p className="text-xl font-bold text-ink">
                {data?.title ?? "Ro'yxat"}
              </p>
              <p className="text-sm text-muted">
                {data
                  ? `${data.total.toLocaleString("uz-UZ")} ta yozuv${
                      data.total !== data.count
                        ? ` (qidiruvsiz ${data.count.toLocaleString("uz-UZ")} ta)`
                        : ""
                    }`
                  : ""}
              </p>
            </div>
          </div>

          <label className="flex items-center gap-2 rounded-full bg-canvas px-4 py-3">
            <Search className="size-5 shrink-0 text-muted" aria-hidden="true" />
            <input
              type="search"
              value={searchInput}
              placeholder="F.I.Sh., JSHSHIR, kadastr yoki manzil"
              aria-label="Qidirish"
              onChange={(event) => setSearchInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") applySearch(searchInput);
              }}
              className="w-72 bg-transparent text-sm text-ink outline-none placeholder:text-muted"
            />
          </label>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-2.5 rounded-xl bg-canvas p-3">
          {isLoading ? (
            <div className="flex flex-1 items-center justify-center">
              <Spinner size="lg" color="accent" aria-label="Yuklanmoqda" />
            </div>
          ) : result.failed ? (
            <p className="flex flex-1 items-center justify-center text-center text-sm text-muted">
              Bunday ro&rsquo;yxat topilmadi yoki yuklab bo&rsquo;lmadi.
            </p>
          ) : items.length === 0 ? (
            <p className="flex flex-1 items-center justify-center text-center text-sm text-muted">
              {search
                ? `"${search}" bo'yicha hech narsa topilmadi.`
                : "Bu ro'yxatda hozircha yozuv yo'q."}
            </p>
          ) : (
            <div className="min-h-0 flex-1 overflow-auto">
              <Table aria-label={data.title}>
                <Table.Content aria-label={data.title}>
                  <Table.Header columns={columns}>
                    {(column) => (
                      <Table.Column isRowHeader={column.id === "no"}>
                        {column.name}
                      </Table.Column>
                    )}
                  </Table.Header>

                  <Table.Body items={items}>
                    {(row) => {
                      const { label, tone } = statusOf(row);
                      return (
                        <Table.Row id={row.id}>
                          {/*
                            Kataklar ataylab bittama-bitta yozilgan — bir
                            xil jadval DatabasePage'da ham shunday.
                          */}
                          <Table.Cell>{row.no}</Table.Cell>
                          <Table.Cell>{row.fullName ?? "—"}</Table.Cell>
                          <Table.Cell>{row.pinfl ?? "—"}</Table.Cell>
                          <Table.Cell>{row.cadasterNumber ?? "—"}</Table.Cell>
                          <Table.Cell>{row.subtitle ?? "—"}</Table.Cell>
                          <Table.Cell>
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${tone}`}
                            >
                              {label}
                            </span>
                          </Table.Cell>
                          <Table.Cell>
                            <span className="text-muted">
                              {row.reasonLabel ?? "—"}
                            </span>
                          </Table.Cell>
                          <Table.Cell>
                            <button
                              type="button"
                              onClick={() =>
                                setSelected({ kind: row.kind, id: row.id })
                              }
                              className="rounded-full bg-brand-soft px-4 py-2 text-sm font-medium text-brand whitespace-nowrap transition-colors hover:bg-brand/20"
                            >
                              Ba&rsquo;tafsil
                            </button>
                          </Table.Cell>
                        </Table.Row>
                      );
                    }}
                  </Table.Body>
                </Table.Content>
              </Table>
            </div>
          )}

          {data && data.totalPages > 1 && (
            <div className="flex shrink-0 items-center justify-between gap-3 px-1">
              <p className="text-sm text-muted">
                {data.page}-sahifa, jami {data.totalPages}
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => goToPage(data.page - 1)}
                  disabled={data.page <= 1}
                  className="rounded-full bg-panel px-4 py-2 text-sm font-medium text-ink transition-opacity hover:opacity-80 disabled:opacity-40"
                >
                  Oldingi
                </button>
                <button
                  type="button"
                  onClick={() => goToPage(data.page + 1)}
                  disabled={data.page >= data.totalPages}
                  className="rounded-full bg-panel px-4 py-2 text-sm font-medium text-ink transition-opacity hover:opacity-80 disabled:opacity-40"
                >
                  Keyingi
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Odam urinishi — to'liq tafsilot (platforma javobi va h.k.). */}
      <MemberDetailsModal
        memberId={selected?.kind === "member" ? selected.id : null}
        isOpen={selected?.kind === "member"}
        onOpenChange={closeDetails}
      />

      {/* Fuqaro yoki xonadon — bazadagi yozuv va urinishlar. */}
      <RecordDetailsModal
        record={selected && selected.kind !== "member" ? selected : null}
        onOpenChange={closeDetails}
      />
    </div>
  );
};

export default ReportListPage;
