import { useCallback, useEffect, useState } from "react";
import { Button, Chip, InputGroup, Spinner, TextField } from "@heroui/react";
import {
  ArrowLeft,
  BarChart3,
  Home,
  Pause,
  Play,
  RotateCw,
  Search,
  Square,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import api from "../config/api";
import { useRegistrationRun } from "../hooks/useRegistrationRun.js";
import RegistrationProgress from "../components/RegistrationProgress.jsx";
import RegistrationTerminal from "../components/RegistrationTerminal.jsx";
import RegistrationHomesTable from "../components/RegistrationHomesTable.jsx";
import RegistrationMembersTable from "../components/RegistrationMembersTable.jsx";
import RegistrationMemberModal from "../components/RegistrationMemberModal.jsx";
import HomesPagination from "../components/HomesPagination.jsx";

const TABS = [
  { id: "live", label: "Jonli kuzatuv", icon: Play },
  { id: "homes", label: "Xonadonlar", icon: Home },
  { id: "members", label: "Odamlar", icon: Users },
];

const HOME_FILTERS = [
  { id: "", label: "Barchasi" },
  { id: "done", label: "Tugadi" },
  { id: "partial", label: "Qisman" },
  { id: "failed", label: "Kirmadi" },
  { id: "skipped", label: "O'tkazildi" },
  { id: "pending", label: "Navbatda" },
];

const MEMBER_FILTERS = [
  { id: "", label: "Barchasi" },
  { id: "added", label: "Kiritildi" },
  { id: "failed", label: "Xatolik" },
  { id: "skipped", label: "O'tkazildi" },
  { id: "exists", label: "Allaqachon bor" },
];

const emptyPage = { items: [], page: 1, totalPages: 1, total: 0, pageSize: 50 };

/**
 * Bitta yurishni kuzatish sahifasi.
 *
 * Uch ko'rinish: jonli kuzatuv (jurnal + joriy xonadon), xonadon
 * kesimi va odam kesimi. Holat serverda saqlanadi — sahifa
 * yangilansa ham kuzatuv joyida qoladi.
 */
const RegistrationRunPage = () => {
  const { runId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const tab = searchParams.get("tab") ?? "live";
  const page = Number(searchParams.get("page")) || 1;
  const statusFilter = searchParams.get("status") ?? "";
  const search = searchParams.get("search") ?? "";

  const [searchInput, setSearchInput] = useState(search);
  const [table, setTable] = useState({ key: null, data: emptyPage });
  const [selectedMemberId, setSelectedMemberId] = useState(null);

  const {
    run,
    currentHome,
    recentMembers,
    logs,
    isLoading,
    isRunning,
    isStale,
    refresh,
    pause,
    resume,
    stop,
  } = useRegistrationRun(runId);

  // Jadvallar faqat o'z ko'rinishi ochilganda yuklanadi — jonli
  // kuzatuv paytida bekorga so'rov ketmasin. Yuklangan sahifa
  // kalit bilan saqlanadi: shunda "qaysi so'rov yuklangan" state'dan
  // ko'rinadi va effect boshida tozalash (setState) kerak bo'lmaydi.
  const tableKey = `${tab}|${page}|${statusFilter}|${search}`;

  const loadTable = useCallback(() => {
    if (tab === "live") return Promise.resolve();

    const params = {
      page,
      status: statusFilter || undefined,
      search: search || undefined,
    };

    const url =
      tab === "homes"
        ? `/api/registration/runs/${runId}/homes`
        : `/api/registration/runs/${runId}/members`;

    return api
      .get(url, { params })
      .then((data) => setTable({ key: tableKey, data }))
      .catch(() => {
        toast.error("Ro'yxatni yuklashda xatolik yuz berdi.");
        setTable({ key: tableKey, data: emptyPage });
      });
  }, [tab, runId, page, statusFilter, search, tableKey]);

  useEffect(() => {
    loadTable();
  }, [loadTable]);

  // Jarayon ketayotganda ochiq jadval ham yangilanib turadi, aks
  // holda sonlar qotib qolgandek ko'rinadi.
  useEffect(() => {
    if (tab === "live" || !isRunning) return;

    const timer = setInterval(loadTable, 5000);
    return () => clearInterval(timer);
  }, [tab, isRunning, loadTable]);

  // Vaqtinchalik xatolik (tashqi server / tarmoq) bergan
  // xonadonlarni navbatga qaytaradi. Muvaffaqiyatli qo'shilganlarga
  // tegilmaydi — platformada dublikat paydo bo'lmasligi kerak.
  const handleRetry = () =>
    api
      .post(`/api/registration/runs/${runId}/retry`)
      .then((data) => {
        toast.success(data.message ?? "Navbatga qaytarildi");
        loadTable();
        refresh();
      })
      .catch((err) =>
        toast.error(err?.message ?? "Qayta urinishda xatolik yuz berdi"),
      );

  const setParams = (next) => {
    const merged = {
      tab,
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(search ? { search } : {}),
      ...next,
    };

    // Bo'sh qiymatlarni URL'da saqlamaymiz.
    for (const key of Object.keys(merged)) {
      if (!merged[key] || merged[key] === "1") delete merged[key];
    }

    setSearchParams(merged);
  };

  const switchTab = (nextTab) => {
    setSearchInput("");
    setSearchParams(nextTab === "live" ? {} : { tab: nextTab });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <Spinner size="lg" color="accent" aria-label="Yuklanmoqda" />
      </div>
    );
  }

  if (!run) {
    return (
      <div className="py-5">
        <div className="container">
          <p className="text-sm text-foreground/60">Yurish topilmadi.</p>
          <Button className="mt-3" variant="ghost" onPress={() => navigate("/registration")}>
            <ArrowLeft className="size-4" aria-hidden="true" />
            Orqaga
          </Button>
        </div>
      </div>
    );
  }

  const filters = tab === "homes" ? HOME_FILTERS : MEMBER_FILTERS;
  const currentPage = table.key === tableKey ? table.data : emptyPage;
  const isTableLoading = tab !== "live" && table.key !== tableKey;

  // Tugallanmagan yurishni davom ettirish mumkin. "Uzilgan" holat
  // ham shunga kiradi: server qayta ishga tushganda yurish "running"
  // deb qolib ketadi, lekin ishchisi yo'q.
  const canResume =
    isStale || ["paused", "pending", "stopped", "error"].includes(run.status);

  return (
    <div className="py-5">
      <div className="container">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <Button variant="ghost" onPress={() => navigate("/registration")}>
            <ArrowLeft className="size-4" aria-hidden="true" />
            Mahallalar
          </Button>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            {/* Boshqaruv: to'xtatish darhol emas — ishchi joriy
                xonadonni tugatib bo'ysunadi. */}
            {isRunning ? (
              <>
                <Button variant="ghost" onPress={pause}>
                  <Pause className="size-4" aria-hidden="true" />
                  To'xtatib turish
                </Button>
                <Button variant="ghost" onPress={stop}>
                  <Square className="size-4 text-danger" aria-hidden="true" />
                  To'xtatish
                </Button>
              </>
            ) : canResume ? (
              <Button variant="ghost" onPress={resume}>
                <Play className="size-4" aria-hidden="true" />
                Davom ettirish
              </Button>
            ) : null}

            {/*
              Vaqtinchalik xatoliklar (tashqi server nosozligi,
              tarmoq uzilishi) qayta urinishga arziydi — ular
              ma'lumotning nuqsoni emas.
            */}
            {!isRunning && run.membersFailed > 0 && (
              <Button variant="ghost" onPress={handleRetry}>
                <RotateCw className="size-4" aria-hidden="true" />
                Vaqtinchalik xatolarni qayta urinish
              </Button>
            )}

            <Button
              variant="ghost"
              onPress={() => navigate(`/registration/report?runId=${run.id}`)}
            >
              <BarChart3 className="size-4" aria-hidden="true" />
              Hisobot
            </Button>
          </div>
        </div>

        <RegistrationProgress run={run} currentHome={currentHome} />

        {/* Ko'rinishlar */}
        <div className="mb-4 flex flex-wrap gap-2">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => switchTab(id)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                tab === id
                  ? "bg-accent text-accent-foreground"
                  : "bg-background text-foreground/70 hover:text-foreground"
              }`}
            >
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>

        {tab === "live" ? (
          <div className="grid gap-5 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <RegistrationTerminal logs={logs} />
            </div>

            {/* Oxirgi urinishlar — "hozir kim kiritilyapti" */}
            <div className="lg:col-span-2">
              <div className="rounded-xl border border-border bg-background">
                <div className="border-b border-border px-4 py-3">
                  <h3 className="text-sm font-semibold text-foreground">
                    Oxirgi urinishlar
                  </h3>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {recentMembers.length === 0 ? (
                    <p className="px-4 py-6 text-sm text-foreground/50">
                      Hozircha yozuv yo'q.
                    </p>
                  ) : (
                    <ul className="divide-y divide-border">
                      {recentMembers.map((member) => (
                        <li key={member._id}>
                          <button
                            type="button"
                            onClick={() => setSelectedMemberId(member._id)}
                            className="w-full px-4 py-2.5 text-left transition-colors hover:bg-surface"
                          >
                            <div className="flex items-start gap-2">
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-medium text-foreground">
                                  {member.verifiedFullName ?? member.fullName}
                                </span>
                                <span className="block truncate text-xs text-foreground/50">
                                  {member.status === "added"
                                    ? `Kiritildi · ${member.cadasterNumber ?? ""}`
                                    : (member.reason ?? member.cadasterNumber)}
                                </span>
                              </span>

                              <Chip
                                size="sm"
                                color={
                                  member.status === "added"
                                    ? "success"
                                    : member.status === "failed"
                                      ? "danger"
                                      : "warning"
                                }
                              >
                                {member.status === "added"
                                  ? "OK"
                                  : member.status === "failed"
                                    ? "Xato"
                                    : "O'tdi"}
                              </Chip>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {filters.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setParams({ status: filter.id, page: "1" })}
                  className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                    statusFilter === filter.id
                      ? "bg-accent text-accent-foreground"
                      : "bg-background text-foreground/70 hover:text-foreground"
                  }`}
                >
                  {filter.label}
                </button>
              ))}

              <TextField
                aria-label="Qidirish"
                className="ml-auto w-full sm:w-72"
              >
                <InputGroup className="w-full">
                  <InputGroup.Prefix>
                    <Search className="size-4" aria-hidden="true" />
                  </InputGroup.Prefix>
                  <InputGroup.Input
                    className="w-full"
                    value={searchInput}
                    placeholder={
                      tab === "homes" ? "Kadastr yoki egasi" : "F.I.Sh. yoki JSHSHIR"
                    }
                    onChange={(event) => setSearchInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        setParams({ search: searchInput.trim(), page: "1" });
                      }
                    }}
                  />
                </InputGroup>
              </TextField>
            </div>

            {isTableLoading ? (
              <div className="flex justify-center py-16">
                <Spinner size="lg" color="accent" aria-label="Yuklanmoqda" />
              </div>
            ) : currentPage.items.length === 0 ? (
              <p className="py-16 text-center text-sm text-foreground/60">
                Hech narsa topilmadi.
              </p>
            ) : (
              <>
                {tab === "homes" ? (
                  <RegistrationHomesTable
                    homes={currentPage.items}
                    onSelect={(home) =>
                      setSearchParams({
                        tab: "members",
                        search: home.cadasterNumber ?? "",
                      })
                    }
                  />
                ) : (
                  <RegistrationMembersTable
                    members={currentPage.items}
                    startIndex={(currentPage.page - 1) * currentPage.pageSize}
                    onSelect={(member) => setSelectedMemberId(member._id)}
                  />
                )}

                <HomesPagination
                  page={currentPage.page}
                  totalPages={currentPage.totalPages}
                  total={currentPage.total}
                  onPageChange={(nextPage) => setParams({ page: String(nextPage) })}
                />
              </>
            )}
          </>
        )}

        <RegistrationMemberModal
          memberId={selectedMemberId}
          isOpen={Boolean(selectedMemberId)}
          onOpenChange={(isOpen) => {
            if (!isOpen) setSelectedMemberId(null);
          }}
        />
      </div>
    </div>
  );
};

export default RegistrationRunPage;
