import { useEffect, useState } from "react";
import { Modal, Spinner, useOverlayState } from "@heroui/react";
import { FileWarning, Play } from "lucide-react";
import { toast } from "sonner";
import api from "../config/api.js";

/**
 * "Kadastrsiz boshlash" — qaysi MFY guruhidan ishlashni tanlash.
 *
 * Nega modal kerak: kadastrsiz baza MFY guruhlariga bo'lingan va
 * bitta hisob bir nechta guruh bilan ishlashi mumkin. Guruh
 * avtomatik tanlansa (masalan faol MFY nomi bo'yicha), xodim
 * noto'g'ri guruhdan minglab odam kiritib yuborishi mumkin edi —
 * bu amalni ortga qaytarib bo'lmaydi.
 */
const UncadastredStartModal = ({ isOpen, onOpenChange, onStart, isBusy }) => {
  const state = useOverlayState({ isOpen, onOpenChange });

  // null — hali yuklanmagan (StreetSettingsModal bilan bir xil
  // usul: effect ichida sinxron setState bo'lmasligi uchun).
  const [groups, setGroups] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    let cancelled = false;

    api
      .get("/api/uncadastred/groups")
      .then((data) => {
        if (cancelled) return;

        const list = data.groups ?? [];
        setGroups(list);

        // Yozuvi bor birinchi guruh — eng ko'p kutiladigan tanlov.
        setSelected(list.find((group) => group.total > 0)?.id ?? null);
      })
      .catch((err) => {
        if (cancelled) return;
        setGroups([]);
        toast.error(err?.message ?? "Guruhlarni yuklashda xatolik");
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const isLoading = isOpen && groups === null;
  const list = groups ?? [];

  // Bo'sh guruhdan boshlashning ma'nosi yo'q — tanlab ham bo'lmaydi.
  const usable = list.filter((group) => group.total > 0);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!selected || isBusy) return;
    onStart(selected);
  };

  return (
    <Modal.Root state={state}>
      <Modal.Backdrop>
        <Modal.Container size="md">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>Kadastrsiz boshlash</Modal.Heading>
            </Modal.Header>

            <Modal.Body>
              <form id="uncadastred-start-form" onSubmit={handleSubmit}>
                <p className="mb-4 text-sm text-muted">
                  Kadastrsiz bazadagi fuqarolar platformaga oila
                  a&rsquo;zosi sifatida kiritiladi. Xonadon{" "}
                  <b className="text-ink">familiya bo&rsquo;yicha</b> mos
                  keltiriladi; mos xonadon topilmasa{" "}
                  <b className="text-ink">random</b> taqsimlanadi.
                </p>

                {isLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <Spinner size="lg" color="accent" aria-label="Yuklanmoqda" />
                  </div>
                ) : usable.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 rounded-xl bg-warn-soft px-4 py-8 text-center">
                    <FileWarning className="size-8 text-warn" aria-hidden="true" />
                    <p className="text-sm font-medium text-warn">
                      Yuklangan kadastrsiz ma&rsquo;lumot yo&rsquo;q
                    </p>
                    <p className="text-xs text-muted">
                      &ldquo;Kadastrsiz ma&rsquo;lumotlar&rdquo; bo&rsquo;limiga
                      o&rsquo;tib, Excel yuklang.
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="mb-2 text-xs font-medium text-muted">
                      Qaysi MFY guruhidan kiritilsin?
                    </p>

                    <div className="flex max-h-72 flex-col gap-1.5 overflow-auto">
                      {usable.map((group) => (
                        <button
                          key={group.id}
                          type="button"
                          onClick={() => setSelected(group.id)}
                          className={`flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition-colors ${
                            selected === group.id
                              ? "bg-brand text-white"
                              : "bg-canvas text-ink hover:bg-black/5"
                          }`}
                        >
                          <span className="min-w-0 flex-1 truncate text-sm font-medium">
                            {group.name}
                          </span>
                          <span
                            className={`shrink-0 text-xs ${
                              selected === group.id ? "text-white/80" : "text-muted"
                            }`}
                          >
                            {group.total.toLocaleString("uz-UZ")} ta
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </form>
            </Modal.Body>

            <Modal.Footer>
              <Modal.CloseTrigger>Bekor qilish</Modal.CloseTrigger>

              <button
                type="submit"
                form="uncadastred-start-form"
                disabled={!selected || isBusy}
                className="flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                <Play className="size-4" aria-hidden="true" />
                Boshlash
              </button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal.Root>
  );
};

export default UncadastredStartModal;
