import { useCallback, useEffect, useState } from "react";
import { Spinner, Table } from "@heroui/react";
import { Pencil, Search, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";
import api from "../config/api";
import UncadastredUploadModal from "../components/UncadastredUploadModal.jsx";

/**
 * KADASTRSIZ ma'lumotlar bazasi — umumiy bazadan ALOHIDA.
 *
 * Farqi "Umumiy ma'lumotlar ba'zasi" dan:
 *   - ma'lumot MFY GURUHLARIGA bo'linadi (chapdagi ro'yxat);
 *   - har guruhga alohida yuklash/qo'shish/o'chirish mumkin —
 *     bir MFY ustida ishlash boshqasiga tegmaydi;
 *   - kadastr o'rniga telefon, qarindoshlik va hujjat ustunlari
 *     asosiy o'rinda turadi (bu bazada kadastr odatda yo'q).
 *
 * "Asosiy" bo'limidagi "Kadastrsiz boshlash" tugmasi aynan shu
 * yerdagi ma'lumotdan foydalanadi.
 */

const columns = [
  { id: "rowNumber", name: "№" },
  { id: "fullName", name: "F.I.Sh." },
  { id: "birthDate", name: "Tug'ilgan sana" },
  { id: "pinfl", name: "JSHSHIR" },
  { id: "document", name: "Hujjat" },
  { id: "phone", name: "Telefon" },
  { id: "relationship", name: "Qarindoshlik" },
  { id: "mfyName", name: "MFY" },
  { id: "cadasterNumber", name: "Kadastr" },
  { id: "actions", name: "" },
];

// Telefonni o'qishga oson ko'rinishga keltiradi:
// "998901234567" -> "+998 90 123 45 67"
const formatPhone = (phone) => {
  const digits = String(phone ?? "").replace(/\D/g, "");
  if (digits.length !== 12) return phone ?? "—";

  return `+${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10)}`;
};

const UncadastredPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;
  const search = searchParams.get("search") ?? "";
  const groupId = searchParams.get("group") ?? "";

  // Guruhlar (null — hali yuklanmagan).
  const [groups, setGroups] = useState(null);
  const [mfys, setMfys] = useState([]);

  // `key` — natija qaysi so'rovga tegishli (DatabasePage bilan bir
  // xil usul: "yuklanyaptimi" savoli state'ning o'zidan ko'rinadi).
  const [result, setResult] = useState({
    key: null,
    items: [],
    page: 1,
    totalPages: 1,
    total: 0,
  });

  const [searchInput, setSearchInput] = useState(search);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const key = `${page}|${search}|${groupId}`;
  const isLoading = result.key !== key;

  const loadGroups = useCallback(
    () =>
      api.get("/api/uncadastred/groups").then((data) => {
        setGroups(data.groups ?? []);
        setMfys(data.mfys ?? []);
        return data;
      }),
    [],
  );

  const load = useCallback(
    () =>
      api
        .get("/api/uncadastred", {
          params: { page, search, ...(groupId ? { groupId } : {}) },
        })
        .then((data) => setResult({ ...data, key: `${page}|${search}|${groupId}` })),
    [page, search, groupId],
  );

  useEffect(() => {
    let cancelled = false;

    loadGroups().catch(() => {
      if (!cancelled) {
        setGroups([]);
        toast.error("Guruhlarni yuklashda xatolik yuz berdi");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [loadGroups]);

  useEffect(() => {
    let cancelled = false;

    load().catch(() => {
      if (!cancelled) toast.error("Ma'lumotlarni yuklashda xatolik yuz berdi");
    });

    return () => {
      cancelled = true;
    };
  }, [load]);

  // Manzil o'zgarishi: qidiruv yoki guruh almashganda 1-sahifaga
  // qaytamiz (10-sahifada turib boshqa guruhga o'tilsa, natija bo'sh
  // ko'rinib qolardi).
  const setParams = (next) => {
    const params = {};
    if (next.group ?? groupId) params.group = next.group ?? groupId;
    if (next.search ?? search) params.search = next.search ?? search;
    if (next.page && next.page > 1) params.page = String(next.page);
    setSearchParams(params);
  };

  const selectGroup = (id) => {
    const params = {};
    if (id) params.group = id;
    if (search) params.search = search;
    setSearchParams(params);
  };

  const applySearch = (value) => {
    const params = {};
    if (groupId) params.group = groupId;
    if (value.trim()) params.search = value.trim();
    setSearchParams(params);
  };

  const handleUpload = ({ file, groupId: target, mfyName, mfyUid, mode }) => {
    const formData = new FormData();
    formData.append("file", file);
    if (target) formData.append("groupId", target);
    if (mfyName) formData.append("mfyName", mfyName);
    if (mfyUid) formData.append("mfyUid", mfyUid);
    formData.append("mode", mode);

    setIsUploading(true);

    api
      .post("/api/uncadastred/upload", formData)
      .then((data) => {
        toast.success(data.message ?? `${data.uploaded} ta yozuv yuklandi`);

        // JSHSHIR'siz yozuvlar — xodim faylni tuzatishi uchun
        // darhol ogohlantiramiz: bunday odam platformaga kirmaydi.
        if (data.withoutPinfl > 0) {
          toast.warning(
            `${data.withoutPinfl} ta yozuvda JSHSHIR yo'q — ular platformaga kiritilmaydi`,
            { duration: 8000 },
          );
        }

        setIsUploadOpen(false);
        selectGroup(data.groupId);
        return Promise.all([loadGroups(), load()]);
      })
      .catch((err) => {
        toast.error(err?.message || "Faylni yuklashda xatolik yuz berdi");
      })
      .finally(() => setIsUploading(false));
  };

  const handleDeleteGroup = (group) => {
    // Guruh va undagi hamma yozuv ketadi — ortga qaytarib bo'lmaydi.
    if (
      !window.confirm(
        `"${group.name}" guruhi va undagi ${group.total.toLocaleString("uz-UZ")} ta yozuv o'chiriladi. Davom etasizmi?`,
      )
    ) {
      return;
    }

    api
      .delete(`/api/uncadastred/groups/${group.id}`)
      .then((data) => {
        toast.success(data.message ?? "Guruh o'chirildi");
        if (groupId === group.id) selectGroup("");
        return Promise.all([loadGroups(), load()]);
      })
      .catch((err) => toast.error(err?.message ?? "O'chirishda xatolik"));
  };

  const handleRenameGroup = (group) => {
    const name = window.prompt("MFY guruhining yangi nomi:", group.name);
    if (name === null) return;

    const trimmed = name.trim();
    if (!trimmed || trimmed === group.name) return;

    api
      .put(`/api/uncadastred/groups/${group.id}`, { name: trimmed })
      .then(() => {
        toast.success("Nom o'zgartirildi");
        return Promise.all([loadGroups(), load()]);
      })
      .catch((err) => toast.error(err?.message ?? "Nomni o'zgartirishda xatolik"));
  };

  const handleDeleteRow = (citizen) => {
    if (!window.confirm(`"${citizen.fullName}" yozuvi o'chiriladi. Davom etasizmi?`)) {
      return;
    }

    api
      .delete(`/api/uncadastred/${citizen.id}`)
      .then(() => {
        toast.success("Yozuv o'chirildi");
        return Promise.all([loadGroups(), load()]);
      })
      .catch((err) => toast.error(err?.message ?? "O'chirishda xatolik"));
  };

  const groupList = groups ?? [];
  const activeGroup = groupList.find((group) => group.id === groupId) ?? null;
  const allTotal = groupList.reduce((sum, group) => sum + (group.total ?? 0), 0);

  return (
    <div className="flex h-svh min-w-0 flex-1 gap-2 py-2 pr-2 pl-2">
      {/* --- Chap: MFY guruhlari --- */}
      <aside className="flex w-72 shrink-0 flex-col gap-2.5 rounded-3xl bg-panel p-3">
        <div className="shrink-0 px-1 py-1">
          <p className="text-base font-bold text-ink">MFY guruhlari</p>
          <p className="text-xs text-muted">
            {groupList.length} guruh &middot; {allTotal.toLocaleString("uz-UZ")} ta
            yozuv
          </p>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-auto">
          {/* "Barchasi" — guruhlar bo'yicha filtrsiz ko'rinish. */}
          <button
            type="button"
            onClick={() => selectGroup("")}
            className={`flex w-full items-center justify-between gap-2 rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors ${
              groupId === "" ? "bg-brand text-white" : "text-ink hover:bg-black/5"
            }`}
          >
            <span className="truncate">Barchasi</span>
            <span
              className={`shrink-0 text-xs ${groupId === "" ? "text-white/80" : "text-muted"}`}
            >
              {allTotal.toLocaleString("uz-UZ")}
            </span>
          </button>

          {groups === null ? (
            <div className="flex flex-1 items-center justify-center">
              <Spinner size="md" color="accent" aria-label="Yuklanmoqda" />
            </div>
          ) : (
            groupList.map((group) => {
              const isActive = group.id === groupId;

              return (
                <div
                  key={group.id}
                  className={`group flex w-full items-center gap-1 rounded-xl pr-1.5 transition-colors ${
                    isActive ? "bg-brand text-white" : "text-ink hover:bg-black/5"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => selectGroup(group.id)}
                    className="flex min-w-0 flex-1 items-center justify-between gap-2 px-4 py-3 text-left"
                  >
                    <span className="truncate text-sm font-medium">
                      {group.name}
                    </span>
                    <span
                      className={`shrink-0 text-xs ${isActive ? "text-white/80" : "text-muted"}`}
                    >
                      {(group.total ?? 0).toLocaleString("uz-UZ")}
                    </span>
                  </button>

                  {/*
                    Tahrirlash tugmalari faqat ustiga kelganda yoki
                    tanlangan guruhda ko'rinadi — ro'yxat tinch
                    tursin, lekin amal bir bosishda bo'lsin.
                  */}
                  <button
                    type="button"
                    onClick={() => handleRenameGroup(group)}
                    aria-label={`"${group.name}" nomini o'zgartirish`}
                    title="Nomini o'zgartirish"
                    className={`shrink-0 rounded-lg p-1.5 opacity-0 transition-opacity group-hover:opacity-100 ${
                      isActive ? "hover:bg-white/20" : "hover:bg-black/10"
                    } ${isActive ? "opacity-100" : ""}`}
                  >
                    <Pencil className="size-4" aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteGroup(group)}
                    aria-label={`"${group.name}" guruhini o'chirish`}
                    title="Guruhni o'chirish"
                    className={`shrink-0 rounded-lg p-1.5 opacity-0 transition-opacity group-hover:opacity-100 ${
                      isActive ? "hover:bg-white/20" : "text-bad hover:bg-bad-soft"
                    } ${isActive ? "opacity-100" : ""}`}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsUploadOpen(true)}
          disabled={isUploading}
          className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          <Upload className="size-5" aria-hidden="true" />
          {isUploading ? "Yuklanmoqda..." : "Excel yuklash"}
        </button>
      </aside>

      {/* --- O'ng: yozuvlar --- */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2.5 rounded-3xl bg-panel px-6 py-2">
        <header className="flex w-full shrink-0 flex-wrap items-center justify-between gap-4 py-2">
          <div className="min-w-0">
            <p className="truncate text-xl font-bold text-ink">
              {activeGroup
                ? activeGroup.name
                : "Kadastrsiz ma’lumotlar ba’zasi"}
            </p>
            <p className="text-sm text-muted">
              {result.total.toLocaleString("uz-UZ")} ta yozuv
              {activeGroup?.lastUploadAt
                ? ` · oxirgi yuklash ${new Date(activeGroup.lastUploadAt).toLocaleDateString("uz-UZ")}${
                    activeGroup.lastUploadMode === "append"
                      ? " (qo'shilgan)"
                      : ""
                  }`
                : ""}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 rounded-full bg-canvas px-4 py-3">
              <Search className="size-5 shrink-0 text-muted" aria-hidden="true" />
              <input
                type="search"
                value={searchInput}
                placeholder="F.I.Sh., JSHSHIR, telefon yoki MFY"
                aria-label="Qidirish"
                onChange={(event) => setSearchInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") applySearch(searchInput);
                }}
                className="w-64 bg-transparent text-sm text-ink outline-none placeholder:text-muted"
              />
            </label>
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
              <Table aria-label="Kadastrsiz ma'lumotlar ba'zasi">
                <Table.Content aria-label="Kadastrsiz ma'lumotlar ba'zasi">
                  <Table.Header columns={columns}>
                    {(column) => (
                      <Table.Column isRowHeader={column.id === "rowNumber"}>
                        {column.name}
                      </Table.Column>
                    )}
                  </Table.Header>

                  <Table.Body items={result.items}>
                    {(citizen) => (
                      <Table.Row id={citizen.id}>
                        {/*
                          Kataklar ataylab bittama-bitta yozilgan —
                          DatabasePage bilan bir xil sabab: dinamik
                          ko'rinish ustunlar ro'yxatini alohida
                          talab qiladi va ortiqcha chalkashlik beradi.
                        */}
                        <Table.Cell>{citizen.rowNumber ?? "—"}</Table.Cell>
                        <Table.Cell>{citizen.fullName ?? "—"}</Table.Cell>
                        <Table.Cell>{citizen.birthDate ?? "—"}</Table.Cell>
                        <Table.Cell>
                          {citizen.pinfl ?? (
                            <span className="text-bad">yo&rsquo;q</span>
                          )}
                        </Table.Cell>
                        <Table.Cell>{citizen.document ?? "—"}</Table.Cell>
                        <Table.Cell>
                          {citizen.phone ? formatPhone(citizen.phone) : "—"}
                        </Table.Cell>
                        <Table.Cell>{citizen.relationship ?? "—"}</Table.Cell>
                        <Table.Cell>{citizen.mfyName ?? "—"}</Table.Cell>
                        <Table.Cell>{citizen.cadasterNumber ?? "—"}</Table.Cell>
                        <Table.Cell>
                          <button
                            type="button"
                            onClick={() => handleDeleteRow(citizen)}
                            aria-label={`${citizen.fullName} yozuvini o'chirish`}
                            title="Yozuvni o'chirish"
                            className="rounded-lg p-1.5 text-bad transition-colors hover:bg-bad-soft"
                          >
                            <Trash2 className="size-4" aria-hidden="true" />
                          </button>
                        </Table.Cell>
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
                  onClick={() => setParams({ page: result.page - 1 })}
                  disabled={result.page <= 1}
                  className="rounded-full bg-panel px-4 py-2 text-sm font-medium text-ink transition-opacity hover:opacity-80 disabled:opacity-40"
                >
                  Oldingi
                </button>
                <button
                  type="button"
                  onClick={() => setParams({ page: result.page + 1 })}
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

      <UncadastredUploadModal
        isOpen={isUploadOpen}
        onOpenChange={setIsUploadOpen}
        groups={groupList}
        mfys={mfys}
        defaultGroupId={groupId}
        onUpload={handleUpload}
        isUploading={isUploading}
      />
    </div>
  );
};

export default UncadastredPage;
