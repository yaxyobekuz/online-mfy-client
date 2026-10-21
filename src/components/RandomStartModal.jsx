import { useState } from "react";
import { Modal, useOverlayState } from "@heroui/react";
import { Shuffle } from "lucide-react";
import EntryModeSelector from "./EntryModeSelector.jsx";

const RandomStartModal = ({ isOpen, onOpenChange, onStart, isBusy }) => {
  const state = useOverlayState({ isOpen, onOpenChange });
  const [target, setTarget] = useState("");
  // Boshida "odatiy"; keyin oxirgi ishlatilgani belgilangan qoladi.
  const [mode, setMode] = useState("odatiy");

  const parsed = Number(target);
  const isValid = Number.isFinite(parsed) && parsed >= 1 && parsed <= 50000;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValid || isBusy) return;
    onStart(parsed, mode);
  };

  return (
    <Modal.Root state={state}>
      <Modal.Backdrop>
        <Modal.Container size="sm">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>Random rejim</Modal.Heading>
            </Modal.Header>

            <Modal.Body>
              <form id="random-start-form" onSubmit={handleSubmit}>
                <p className="mb-4 text-sm text-muted">
                  MFY dagi fuqarolar bazasidan random tanlab, oilaga
                  a&rsquo;zo sifatida kiritadi. Nechta muvaffaqiyatli
                  kiritilishi kerakligini kiriting.
                </p>

                <label className="mb-1 block text-xs font-medium text-muted">
                  Muvaffaqiyatli kiritilishi kerak bo&rsquo;lgan son
                </label>
                <input
                  type="number"
                  min={1}
                  max={50000}
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="Masalan: 100"
                  autoFocus
                  className="w-full rounded-xl border border-neutral-200 bg-canvas px-4 py-3 text-base text-ink outline-none transition-colors placeholder:text-muted/50 focus:border-brand dark:border-neutral-700"
                />

                {target && !isValid && (
                  <p className="mt-1 text-xs text-bad">
                    1 dan 50 000 gacha son kiriting
                  </p>
                )}

                <div className="mt-4">
                  <EntryModeSelector value={mode} onChange={setMode} />
                </div>
              </form>
            </Modal.Body>

            <Modal.Footer>
              <Modal.CloseTrigger>Bekor qilish</Modal.CloseTrigger>

              <button
                type="submit"
                form="random-start-form"
                disabled={!isValid || isBusy}
                className="flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                <Shuffle className="size-4" aria-hidden="true" />
                Boshlash
              </button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal.Root>
  );
};

export default RandomStartModal;
