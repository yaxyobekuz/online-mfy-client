import { useState } from "react";
import { Modal, useOverlayState } from "@heroui/react";
import { Play } from "lucide-react";
import EntryModeSelector from "./EntryModeSelector.jsx";

/**
 * "Boshlash" (kadastr rejimi) — qaysi uslub bilan kiritishni tanlash.
 *
 * Avval bu tugma to'g'ridan-to'g'ri jarayonni boshlardi. Endi modal
 * ochiladi: xodim odatiy / ba'tafsil / aqilli uslublardan birini
 * tanlaydi (ba'tafsil har fuqaroni davlat bazasidan yangilaydi —
 * sekinroq, shuning uchun tanlov ataylab so'raladi).
 */
const StartModal = ({ isOpen, onOpenChange, onStart, isBusy }) => {
  const state = useOverlayState({ isOpen, onOpenChange });

  // Boshida "odatiy"; keyin oxirgi ishlatilgan uslub belgilangan
  // qoladi (hisobga saqlanmaydi — faqat shu seansda).
  const [mode, setMode] = useState("odatiy");

  const handleSubmit = (event) => {
    event.preventDefault();
    if (isBusy) return;
    onStart(mode);
  };

  return (
    <Modal.Root state={state}>
      <Modal.Backdrop>
        <Modal.Container size="md">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>Boshlash</Modal.Heading>
            </Modal.Header>

            <Modal.Body>
              <form id="start-form" onSubmit={handleSubmit}>
                <p className="mb-4 text-sm text-muted">
                  Kadastr bo&rsquo;yicha fuqarolar xonadonlarga oila
                  a&rsquo;zosi sifatida kiritiladi. Qaysi uslubda
                  kiritilishini tanlang.
                </p>

                <EntryModeSelector value={mode} onChange={setMode} />
              </form>
            </Modal.Body>

            <Modal.Footer>
              <Modal.CloseTrigger>Bekor qilish</Modal.CloseTrigger>

              <button
                type="submit"
                form="start-form"
                disabled={isBusy}
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

export default StartModal;
