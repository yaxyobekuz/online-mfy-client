import { useRef, useState } from "react";
import { Modal, useOverlayState } from "@heroui/react";
import { Upload } from "lucide-react";

/**
 * Kadastrsiz ma'lumot yuklash modali.
 *
 * Nega modal: yuklash BIR NECHTA qarorni talab qiladi, ularni
 * tasodifan tanlab bo'lmasligi kerak:
 *   - qaysi MFY guruhiga (mavjudi yoki YANGISI);
 *   - mavjud guruhga yuklanayotganda USTIGA YOZISHmi yoki QO'SHISH
 *     (append) mi — birinchisi eski ma'lumotni butunlay o'chiradi.
 *
 * Shuning uchun amal nomi ham ochiq yoziladi: "Ustiga yozish" eski
 * yozuvlarni o'chirishini xodim tugmani bosishdan oldin ko'radi.
 */
/**
 * Modalning ichki qismi — forma holati shu yerda turadi.
 *
 * Nega alohida: modal har ochilganda forma TOZA bo'lishi kerak
 * (oldingi tanlov qolib ketmasin). Buni effekt ichida setState
 * bilan qilish mumkin emas — u kaskad renderga olib keladi va
 * loyihadagi lint qoidasi bunga ruxsat bermaydi. O'rniga tashqi
 * komponent `key` beradi: modal ochilganda React bu komponentni
 * noldan yaratadi, ya'ni holat o'z-o'zidan tozalanadi.
 */
const UploadForm = ({
  groups,
  mfys,
  // Modal shu guruh tanlangan holda ochiladi (sahifada tanlangani).
  defaultGroupId,
  onUpload,
  isUploading,
}) => {
  const fileInputRef = useRef(null);

  // "" — yangi guruh yaratish.
  const [groupId, setGroupId] = useState(defaultGroupId ?? "");
  const [newName, setNewName] = useState("");
  const [mfyUid, setMfyUid] = useState("");
  const [mode, setMode] = useState("replace");
  const [file, setFile] = useState(null);

  const isNewGroup = groupId === "";
  const selectedGroup = groups.find((group) => group.id === groupId) ?? null;

  const isValid = Boolean(file) && (!isNewGroup || newName.trim().length > 0);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!isValid || isUploading) return;

    onUpload({
      file,
      groupId: isNewGroup ? null : groupId,
      mfyName: isNewGroup ? newName.trim() : null,
      mfyUid: mfyUid || null,
      // Yangi guruhda "ustiga yozish" ning ma'nosi yo'q — u baribir
      // bo'sh. Lekin server bir xil maydonni kutadi.
      mode: isNewGroup ? "replace" : mode,
    });
  };

  return (
    <>
      <Modal.Body>
        <form
          id="uncadastred-upload-form"
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
        >
          {/* --- Guruh --- */}
          <div>
            <label
              htmlFor="uncad-group"
              className="mb-1 block text-xs font-medium text-muted"
            >
              MFY guruhi
            </label>

            <select
              id="uncad-group"
              value={groupId}
              onChange={(event) => setGroupId(event.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-canvas px-4 py-3 text-base text-ink outline-none transition-colors focus:border-brand dark:border-neutral-700"
            >
              <option value="">+ Yangi MFY guruhi</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name} ({group.total.toLocaleString("uz-UZ")} ta)
                </option>
              ))}
            </select>
          </div>

          {/* --- Yangi guruh nomi --- */}
          {isNewGroup && (
            <div>
              <label
                htmlFor="uncad-name"
                className="mb-1 block text-xs font-medium text-muted"
              >
                Yangi MFY nomi
              </label>

              <input
                id="uncad-name"
                type="text"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                placeholder="Masalan: Zulfiroq"
                autoFocus
                className="w-full rounded-xl border border-neutral-200 bg-canvas px-4 py-3 text-base text-ink outline-none transition-colors placeholder:text-muted/50 focus:border-brand dark:border-neutral-700"
              />

              <p className="mt-1 text-xs text-muted">
                Nom bo&rsquo;sh qoldirilsa, fayldagi MFY ustunidan
                olinadi.
              </p>
            </div>
          )}

          {/* --- MFY tokeniga biriktirish --- */}
          {mfys.length > 0 && (
            <div>
              <label
                htmlFor="uncad-mfy"
                className="mb-1 block text-xs font-medium text-muted"
              >
                Mavjud MFY ga biriktirish (ixtiyoriy)
              </label>

              <select
                id="uncad-mfy"
                value={mfyUid}
                onChange={(event) => setMfyUid(event.target.value)}
                className="w-full rounded-xl border border-neutral-200 bg-canvas px-4 py-3 text-base text-ink outline-none transition-colors focus:border-brand dark:border-neutral-700"
              >
                <option value="">Biriktirilmagan</option>
                {mfys.map((mfy) => (
                  <option key={mfy.uid} value={mfy.uid}>
                    {mfy.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* --- Yuklash usuli --- */}
          {!isNewGroup && (
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted">
                Yuklash usuli
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode("replace")}
                  className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                    mode === "replace"
                      ? "bg-bad-soft text-bad"
                      : "bg-canvas text-ink hover:bg-black/5"
                  }`}
                >
                  Ustiga yozish
                </button>

                <button
                  type="button"
                  onClick={() => setMode("append")}
                  className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                    mode === "append"
                      ? "bg-brand text-white"
                      : "bg-canvas text-ink hover:bg-black/5"
                  }`}
                >
                  Qo&rsquo;shish
                </button>
              </div>

              <p className="mt-1 text-xs text-muted">
                {mode === "replace" ? (
                  <span className="text-bad">
                    Diqqat: &ldquo;{selectedGroup?.name}&rdquo; guruhidagi
                    mavjud{" "}
                    {(selectedGroup?.total ?? 0).toLocaleString("uz-UZ")} ta
                    yozuv o&rsquo;chiriladi.
                  </span>
                ) : (
                  "Mavjud yozuvlar saqlanadi, fayldagilari ustiga qo'shiladi."
                )}
              </p>
            </div>
          )}

          {/* --- Fayl --- */}
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted">
              Excel fayl
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full items-center gap-2 rounded-xl bg-brand-soft px-4 py-3 text-sm font-medium text-brand transition-opacity hover:opacity-80"
            >
              <Upload className="size-5 shrink-0" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate text-left">
                {file ? file.name : "Fayl tanlash"}
              </span>
            </button>

            <p className="mt-1 text-xs text-muted">
              Ustunlar: F.I.Sh. (yoki Familiya/Ism/Sharif), tug&rsquo;ilgan
              sana, JSHSHIR, hujjat, telefon, qarindoshlik, MFY.
            </p>
          </div>
        </form>
      </Modal.Body>

      <Modal.Footer>
        <Modal.CloseTrigger>Bekor qilish</Modal.CloseTrigger>

        <button
          type="submit"
          form="uncadastred-upload-form"
          disabled={!isValid || isUploading}
          className="flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <Upload className="size-4" aria-hidden="true" />
          {isUploading ? "Yuklanmoqda..." : "Yuklash"}
        </button>
      </Modal.Footer>
    </>
  );
};

const UncadastredUploadModal = ({ isOpen, onOpenChange, ...props }) => {
  const state = useOverlayState({ isOpen, onOpenChange });

  return (
    <Modal.Root state={state}>
      <Modal.Backdrop>
        <Modal.Container size="md">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>Kadastrsiz ma&rsquo;lumot yuklash</Modal.Heading>
            </Modal.Header>

            {/*
              `key` — modal har ochilganda forma noldan yaratilsin
              (`UploadForm` izohiga qarang). Yopilganda ichi umuman
              render qilinmaydi: ochiq bo'lmagan modalning formasini
              saqlab turishning ma'nosi yo'q.
            */}
            {isOpen && (
              <UploadForm key={`${props.defaultGroupId ?? ""}`} {...props} />
            )}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal.Root>
  );
};

export default UncadastredUploadModal;
