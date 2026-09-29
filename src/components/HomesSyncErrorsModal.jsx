import { Modal, useOverlayState } from "@heroui/react";

/**
 * Xonadonlar tafsilotini ommaviy yuklash paytida yuz bergan xatolarni
 * (qaysi xonadon, nima sababdan) ko'rsatuvchi modal oyna.
 */
const HomesSyncErrorsModal = ({ isOpen, onOpenChange, errors = [] }) => {
  const state = useOverlayState({ isOpen, onOpenChange });

  return (
    <Modal.Root state={state}>
      <Modal.Backdrop>
        <Modal.Container size="lg">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>Yuklashda yuz bergan xatoliklar</Modal.Heading>
            </Modal.Header>

            <Modal.Body>
              {errors.length === 0 ? (
                <p className="text-sm text-foreground/60">
                  Xatolik ma'lumoti mavjud emas.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {errors.map((error, index) => {
                    const id = error.homeId ?? error.recordId ?? index;
                    const subtitleParts = [
                      error.cadasterNumber && `Kadastr: ${error.cadasterNumber}`,
                      error.pinfl && `JSHSHIR: ${error.pinfl}`,
                      id && `ID: ${id}`,
                    ].filter(Boolean);

                    return (
                      <li
                        key={`${id}-${index}`}
                        className="rounded-lg border border-border bg-background p-3"
                      >
                        <div className="text-sm font-medium text-foreground">
                          {error.fullName ||
                            `Yozuv №${error.homeNum ?? error.rowNumber ?? "—"}`}
                        </div>
                        <div className="text-xs text-foreground/60">
                          {subtitleParts.join(" · ")}
                        </div>
                        <div className="mt-1 text-sm text-danger">
                          {error.reason}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Modal.Body>

            <Modal.Footer>
              <Modal.CloseTrigger>Yopish</Modal.CloseTrigger>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal.Root>
  );
};

export default HomesSyncErrorsModal;
