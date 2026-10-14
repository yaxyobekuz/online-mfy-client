import { useCallback, useEffect, useRef, useState } from "react";
import { Spinner, Table } from "@heroui/react";
import { Download, Loader, Search, Square, Users } from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";
import api, { apiBaseUrl } from "../config/api";
import { getSession, getActiveMahallaUid } from "../config/accounts.js";

/**
 * MFY xonadon a'zolari — platformadan to'liq yuklab olinadi.
 *
 * Har a'zoga XONADON KADASTRI biriktiriladi va qarindoshlik
 * (relationship) ham ko'rsatiladi. Yuklash fonda ketadi (minglab
 * so'rov), shuning uchun holat server tomondan so'rab turiladi va
 * sahifa yopilsa ham jarayon to'xtamaydi.
 */

const columns = [
  { id: "n", name: "№" },
  { id: "cadasterNumber", name: "Kadastr" },
  { id: "streetName", name: "Ko'cha" },
  { id: "homeNum", name: "Uy" },
  { id: "fullName", name: "F.I.Sh." },
  { id: "pinfl", name: "JSHSHIR" },
  { id: "birthDate", name: "Tug'ilgan sana" },
  { id: "relationship", name: "Qarindoshlik" },
  { id: "document", name: "Hujjat" },
  { id: "phone", name: "Telefon" },
];

const HomeMembersPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;
  const search = searchParams.get("search") ?? "";

  const [result, setResult] = useState({
    key: null,
    items: [],
    page: 1,
    totalPages: 1,
    total: 0,
  });

  const [searchInput, setSearchInput] = useState(search);
  const [scan, setScan] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const scanTimerRef = useRef(null);
  // pollScan o'z-o'ziga murojaat qiladi (keyingi so'rovni rejalashtiradi).
  // useCallback ichidan to'g'ridan-to'g'ri nomiga murojaat qilsa,
  // "declared before use" bo'ladi — shuning uchun ref orqali.
  const pollRef = useRef(null);

  const key = `${page}|${search}`;
  const isLoading = result.key !== key;

  const load = useCallback(() => {
    const params = new URLSearchParams({ page: String(page), size: "50" });
    if (search) params.set("search", search);

    return api
      .get(`/api/home-members?${params.toString()}`)
      .then((data) => setResult({ ...data, key }))
      .catch(() => toast.error("Ma'lumotlarni yuklashda xatolik"));
  }, [page, search, key]);

  useEffect(() => {
    load();
  }, [load]);

  // --- Yuklash (scan) holati ---
  const pollScan = useCallback(() => {
    api
      .get("/api/home-members/scan/status")
      .then((data) => {
        setScan(data);

        if (data.status === "running") {
          scanTimerRef.current = setTimeout(() => pollRef.current?.(), 2500);
          return;
        }

        setIsScanning(false);

        if (data.status === "done") {
          toast.success(
            `Yuklab bo'lindi — ${data.membersSaved} a'zo saqlandi`,
          );
          load();
        }
        if (data.status === "stopped") {
          toast.info(`To'xtatildi — ${data.membersSaved} a'zo saqlangan`);
          load();
        }
        if (data.status === "error") {
          toast.error(data.error ?? "Yuklashda xatolik");
        }
      })
      .catch(() => {
        setIsScanning(false);
        toast.error("Holatni o'qishda xatolik");
      });
  }, [load]);

  // Eng so'nggi pollScan ni ref'da saqlaymiz — setTimeout shu orqali
  // chaqiradi (yopilib qolgan eski versiyani emas).
  useEffect(() => {
    pollRef.current = pollScan;
  }, [pollScan]);

  // Sahifa ochilganda jarayon ketayotgan bo'lishi mumkin.
  useEffect(() => {
    api
      .get("/api/home-members/scan/status")
      .then((data) => {
        setScan(data);
        if (data.status === "running") {
          setIsScanning(true);
          pollScan();
        }
      })
      .catch(() => {});

    return () => {
      if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
    };
  }, [pollScan]);

  const startScan = () => {
    setIsScanning(true);
    api
      .post("/api/home-members/scan")
      .then((data) => {
        toast.info(data.message ?? "Yuklash boshlandi");
        pollScan();
      })
      .catch((err) => {
        setIsScanning(false);
        toast.error(err?.message ?? "Boshlashda xatolik");
      });
  };

  const stopScan = () => {
    api
      .post("/api/home-members/scan/stop")
      .then((data) => toast.info(data.message ?? "To'xtatilmoqda"))
      .catch(() => toast.error("To'xtatishda xatolik"));
  };

  // Excel yuklab olish — blob orqali (axios interceptor JSON
  // kutgani uchun to'g'ridan-to'g'ri fetch ishlatamiz).
  const exportExcel = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/home-members/export`, {
        headers: {
          Authorization: `Bearer ${getSession()}`,
          "X-Mahalla-Uid": getActiveMahallaUid() ?? "",
        },
      });
      if (!response.ok) throw new Error("export failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `oila-azolari-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Excel yuklab olishda xatolik");
    } finally {
      setIsExporting(false);
    }
  };

  const applySearch = (value) => {
    const next = {};
    if (value.trim()) next.search = value.trim();
    setSearchParams(next);
  };

  const goToPage = (nextPage) => {
    const next = { page: String(nextPage) };
    if (search) next.search = search;
    setSearchParams(next);
  };

  const stored = scan?.stored ?? 0;
  const delayMs = scan?.rateLimit?.delayMs ?? null;

  return (
    <div className="flex h-svh min-w-0 flex-1 flex-col py-2 pr-2">
      <div className="flex min-h-0 flex-1 flex-col gap-2.5 rounded-3xl bg-panel px-6 py-2">
        <header className="flex w-full shrink-0 flex-wrap items-center justify-between gap-4 py-2">
          <div>
            <p className="text-xl font-bold text-ink">
              MFY xonadon a&rsquo;zolari
            </p>
            <p className="text-sm text-muted">
              {result.total.toLocaleString("uz-UZ")} ta a&rsquo;zo
              {stored > 0 && result.total !== stored
                ? ` (jami saqlangan: ${stored.toLocaleString("uz-UZ")})`
                : ""}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 rounded-full bg-canvas px-4 py-3">
              <Search className="size-5 shrink-0 text-muted" aria-hidden="true" />
              <input
                type="search"
                value={searchInput}
                placeholder="F.I.Sh., JSHSHIR yoki kadastr"
                aria-label="Qidirish"
                onChange={(event) => setSearchInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") applySearch(searchInput);
                }}
                className="w-64 bg-transparent text-sm text-ink outline-none placeholder:text-muted"
              />
            </label>

            {isScanning ? (
              <button
                type="button"
                onClick={stopScan}
                className="flex items-center gap-2 rounded-full bg-bad-soft px-4 py-3 text-sm font-medium text-bad transition-opacity hover:opacity-80"
              >
                <Square className="size-5" aria-hidden="true" />
                To&rsquo;xtatish
              </button>
            ) : (
              <button
                type="button"
                onClick={startScan}
                className="flex items-center gap-2 rounded-full bg-brand-soft px-4 py-3 text-sm font-medium text-brand transition-opacity hover:opacity-80"
              >
                <Users className="size-5" aria-hidden="true" />
                {stored > 0 ? "Qayta yuklash" : "Yuklash"}
              </button>
            )}

            {stored > 0 && (
              <button
                type="button"
                onClick={exportExcel}
                disabled={isExporting}
                className="flex items-center gap-2 rounded-full bg-ok-soft px-4 py-3 text-sm font-medium text-ok transition-opacity hover:opacity-80 disabled:opacity-50"
              >
                <Download className="size-5" aria-hidden="true" />
                {isExporting ? "Tayyorlanmoqda..." : "Excel yuklab olish"}
              </button>
            )}
          </div>
        </header>

        {/* Jarayon holati */}
        {isScanning && scan && (
          <div className="flex shrink-0 flex-wrap items-center gap-x-6 gap-y-1 rounded-xl bg-brand/10 px-4 py-3 text-sm">
            <span className="flex items-center gap-2 font-medium text-brand">
              <Loader className="size-4 animate-spin" aria-hidden="true" />
              {scan.stage ?? "Yuklanmoqda..."}
            </span>
            <span className="text-muted">
              Xonadon: {scan.homesDone}/{scan.homesTotal || "?"}
            </span>
            <span className="text-muted">
              A&rsquo;zo: {scan.membersSaved}/{scan.membersFound || "?"}
            </span>
            {delayMs !== null && (
              <span className="text-muted">
                1ta so&rsquo;rov ~{(delayMs / 1000).toFixed(1)}s
              </span>
            )}
          </div>
        )}

        <div className="flex min-h-0 flex-1 flex-col gap-2.5 rounded-xl bg-canvas p-3">
          {isLoading ? (
            <div className="flex flex-1 items-center justify-center">
              <Spinner size="lg" color="accent" aria-label="Yuklanmoqda" />
            </div>
          ) : result.items.length === 0 ? (
            <p className="flex flex-1 items-center justify-center text-center text-sm text-muted">
              {search
                ? `"${search}" bo'yicha hech narsa topilmadi.`
                : 'Hozircha ma’lumot yo’q — "Yuklash" tugmasini bosing.'}
            </p>
          ) : (
            <div className="min-h-0 flex-1 overflow-auto">
              <Table aria-label="MFY xonadon a'zolari">
                <Table.Content aria-label="MFY xonadon a'zolari">
                  <Table.Header columns={columns}>
                    {(column) => (
                      <Table.Column isRowHeader={column.id === "n"}>
                        {column.name}
                      </Table.Column>
                    )}
                  </Table.Header>

                  <Table.Body items={result.items}>
                    {(member) => (
                      <Table.Row id={member._id}>
                        <Table.Cell>
                          {(result.page - 1) * 50 +
                            result.items.indexOf(member) +
                            1}
                        </Table.Cell>
                        <Table.Cell>{member.cadasterNumber ?? "—"}</Table.Cell>
                        <Table.Cell>{member.streetName ?? "—"}</Table.Cell>
                        <Table.Cell>{member.homeNum ?? "—"}</Table.Cell>
                        <Table.Cell>
                          {member.fullName ?? "—"}
                          {member.isOwner && (
                            <span className="ml-2 rounded bg-brand/10 px-1.5 py-0.5 text-xs text-brand">
                              egasi
                            </span>
                          )}
                        </Table.Cell>
                        <Table.Cell>
                          {member.pinfl ?? (
                            <span className="text-muted">yo&rsquo;q</span>
                          )}
                        </Table.Cell>
                        <Table.Cell>{member.birthDate ?? "—"}</Table.Cell>
                        <Table.Cell>{member.relationship ?? "—"}</Table.Cell>
                        <Table.Cell>
                          {member.docSerial || member.docNumber
                            ? `${member.docSerial ?? ""}${member.docNumber ?? ""}`
                            : "—"}
                        </Table.Cell>
                        <Table.Cell>{member.phone || "—"}</Table.Cell>
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

export default HomeMembersPage;
