import { useEffect, useState } from "react";
import { Modal, Spinner, useOverlayState } from "@heroui/react";
import { Check, Settings } from "lucide-react";
import { toast } from "sonner";
import api from "../config/api.js";

/**
 * Jarayon sozlamalari: avtomatik to'xtash chegarasi va ko'chalar.
 *
 * Ko'chalar — platformada "номаълум" kabi texnik ko'chalar bor,
 * ularga fuqaro qo'shmaslik kerak. Ko'cha "belgilanmagan" bo'lsa —
 * random tanlovda o'tkazib yuboriladi. Standart holat: barchasi
 * belgilangan. Server faqat TAQIQLANGANLARINI saqlaydi, shuning
 * uchun yangi ko'cha o'z-o'zidan ruxsat etilgan bo'ladi.
 *
 * Chegara — bitta "Boshlash" da eng ko'pi bilan nechta odam
 * kiritilsin. 0 — cheksiz.
 */
const StreetSettingsModal = ({ isOpen, onOpenChange }) => {
  const state = useOverlayState({ isOpen, onOpenChange });

  // Yuklangan ro'yxat (null — hali kelmagan). Faqat so'rov javobida
  // o'rnatiladi, shuning uchun effect ichida sinxron setState
  // bo'lmaydi (cascading render ogohlantirishidan qochish uchun —
  // MemberDetailsModal ham shu usulda ishlaydi).
  const [streets, setStreets] = useState(null);
  // Ruxsat etilgan ko'chalar (streetId'lar to'plami). Belgilangan =
  // ruxsat etilgan.
  const [allowed, setAllowed] = useState(() => new Set());
  const [isSaving, setIsSaving] = useState(false);
  // Matn sifatida saqlanadi: maydonni butunlay bo'shatib yozish
  // mumkin bo'lsin (son bo'lsa, bo'sh maydon darhol 0 ga aylanardi).
  const [limit, setLimit] = useState("0");

  // Modal ochilganda sozlamani yangidan yuklaymiz — ko'chalar ro'yxati
  // o'zgargan bo'lishi mumkin.
  useEffect(() => {
    if (!isOpen) return undefined;

    let cancelled = false;

    api
      .get("/api/dashboard/street-settings")
      .then((data) => {
        if (cancelled) return;
        const list = data.streets ?? [];
        const excluded = new Set((data.excludedStreetIds ?? []).map(String));
        setStreets(list);
        setLimit(String(data.autoStopAfter ?? 0));
        setAllowed(
          new Set(
            list
              .map((s) => String(s.streetId))
              .filter((id) => !excluded.has(id)),
          ),
        );
      })
      .catch((err) => {
        if (cancelled) return;
        setStreets([]);
        toast.error(err?.message ?? "Sozlamalarni yuklashda xatolik");
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const isLoading = isOpen && streets === null;
  const streetList = streets ?? [];

  const toggle = (streetId) => {
    setAllowed((prev) => {
      const next = new Set(prev);
      if (next.has(streetId)) next.delete(streetId);
      else next.add(streetId);
      return next;
    });
  };

  const allIds = streetList.map((s) => String(s.streetId));
  const allChecked = allIds.length > 0 && allIds.every((id) => allowed.has(id));

  const toggleAll = () => {
    setAllowed(allChecked ? new Set() : new Set(allIds));
  };

  const limitValue = limit.trim() === "" ? 0 : Number(limit);
  const limitInvalid = !Number.isInteger(limitValue) || limitValue < 0;

  const handleSave = () => {
    if (limitInvalid) {
      toast.error("Chegara 0 yoki musbat butun son bo'lishi kerak");
      return;
    }

    // Belgilanmagan ko'chalar — taqiqlanganlar.
    const excludedStreetIds = allIds.filter((id) => !allowed.has(id));
    setIsSaving(true);

    api
      .put("/api/dashboard/street-settings", {
        excludedStreetIds,
        autoStopAfter: limitValue,
      })
      .then((data) => {
        toast.success(data.message ?? "Sozlamalar saqlandi");
        onOpenChange(false);
      })
      .catch((err) =>
        toast.error(err?.message ?? "Sozlamalarni saqlashda xatolik"),
      )
      .finally(() => setIsSaving(false));
  };

  return (
    <Modal.Root state={state}>
      <Modal.Backdrop>
        <Modal.Container size="md">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading className="flex items-center gap-2">
                <Settings className="size-5" aria-hidden="true" />
                Sozlamalar
              </Modal.Heading>
            </Modal.Header>

            <Modal.Body>
              {/* --- Avtomatik to'xtash --- */}
              <div className="mb-5 rounded-xl bg-canvas p-4">
                <label
                  htmlFor="auto-stop"
                  className="block text-sm font-medium text-ink"
                >
                  Avtomatik to&rsquo;xtatish
                </label>

                <p className="mt-1 mb-3 text-sm text-muted">
                  Bitta &ldquo;Boshlash&rdquo; da shuncha odam
                  muvaffaqiyatli kiritilgach, jarayon o&rsquo;zi
                  to&rsquo;xtaydi. Oddiy rejim, Random va
                  Qo&rsquo;shimcha a&rsquo;zolarga birdek tegishli.
                </p>

                <div className="flex items-center gap-3">
                  <input
                    id="auto-stop"
                    type="number"
                    min="0"
                    step="1"
                    value={limit}
                    onChange={(event) => setLimit(event.target.value)}
                    className={`w-32 rounded-lg border bg-panel px-3 py-2 text-sm text-ink outline-none ${
                      limitInvalid
                        ? "border-bad"
                        : "border-neutral-300 focus:border-brand dark:border-neutral-600"
                    }`}
                  />
                  <span className="text-sm text-muted">
                    {limitValue > 0
                      ? `${limitValue} ta kiritilgach to'xtaydi`
                      : "0 — cheklovsiz (oxirigacha ketadi)"}
                  </span>
                </div>
              </div>

              {/* --- Ko'chalar --- */}
              <p className="mb-4 text-sm text-muted">
                Qaysi ko&rsquo;chalarga ma&rsquo;lumot kiritish
                mumkinligini belgilang. Belgilanmagan ko&rsquo;chalarga
                (masalan &ldquo;номаълум&rdquo;) fuqaro
                qo&rsquo;shilmaydi &mdash;{" "}
                <b className="text-ink">barcha rejimda</b>: Oddiy,
                Kadastrsiz, Random va Qo&rsquo;shimcha.
              </p>

              {isLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Spinner />
                </div>
              ) : streetList.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted">
                  Ko&rsquo;chalar topilmadi
                </p>
              ) : (
                <div className="flex flex-col gap-1">
                  {/* Barchasini tanlash / bekor qilish */}
                  <label className="flex cursor-pointer items-center gap-3 border-b border-neutral-200 px-1 py-2.5 dark:border-neutral-700">
                    <CheckBox
                      checked={allChecked}
                      onChange={toggleAll}
                    />
                    <span className="text-sm font-medium text-ink">
                      Barchasi
                    </span>
                  </label>

                  <div className="max-h-72 overflow-y-auto">
                    {streetList.map((street) => {
                      const id = String(street.streetId);
                      const checked = allowed.has(id);
                      return (
                        <label
                          key={id}
                          className="flex cursor-pointer items-center gap-3 rounded-lg px-1 py-2.5 transition-colors hover:bg-canvas"
                        >
                          <CheckBox
                            checked={checked}
                            onChange={() => toggle(id)}
                          />
                          <span className="text-sm text-ink">
                            {street.name}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </Modal.Body>

            <Modal.Footer>
              <Modal.CloseTrigger>Bekor qilish</Modal.CloseTrigger>

              <button
                type="button"
                onClick={handleSave}
                disabled={isLoading || isSaving || limitInvalid}
                className="flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                <Check className="size-4" aria-hidden="true" />
                Saqlash
              </button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal.Root>
  );
};

/** Oddiy belgilash katakchasi — tashqi kutubxonaga bog'liq emas. */
const CheckBox = ({ checked, onChange }) => (
  <span
    className={`flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
      checked
        ? "border-brand bg-brand text-white"
        : "border-neutral-300 bg-canvas dark:border-neutral-600"
    }`}
  >
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="sr-only"
    />
    {checked && <Check className="size-3.5" aria-hidden="true" />}
  </span>
);

export default StreetSettingsModal;
