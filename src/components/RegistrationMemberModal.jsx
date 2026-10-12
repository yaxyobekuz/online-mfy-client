import { useEffect, useState } from "react";
import { Chip, Modal, Spinner, useOverlayState } from "@heroui/react";
import api from "../config/api";
import {
  DOCUMENT_TYPE_LABELS,
  MEMBER_STATUS_COLORS,
  MEMBER_STATUS_LABELS,
  RELATIONSHIP_LABELS,
  STUDY_LEVEL_LABELS,
} from "../config/registration-labels.js";

const Field = ({ label, value, mono }) => (
  <div>
    <dt className="text-xs text-foreground/50">{label}</dt>
    <dd className={`text-sm text-foreground ${mono ? "font-mono" : ""}`}>
      {value ?? "—"}
    </dd>
  </div>
);

const Section = ({ title, children }) => (
  <div className="rounded-lg border border-border bg-background p-4">
    <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-foreground/50">
      {title}
    </h4>
    {children}
  </div>
);

const Json = ({ data }) => (
  <pre className="max-h-64 overflow-auto rounded-lg bg-neutral-950 px-3 py-2 font-mono text-xs leading-relaxed text-white/80">
    {JSON.stringify(data, null, 2)}
  </pre>
);

/**
 * Bitta odamning to'liq yo'li: davlat bazasidan nima kelgani,
 * platformaga nima yuborilgani va platforma nima javob bergani.
 *
 * Xatolikni taxmin bilan emas, aniq ma'lumot bilan tekshirish uchun —
 * shuning uchun payload va javob to'liq ko'rsatiladi.
 */
const RegistrationMemberModal = ({ memberId, isOpen, onOpenChange }) => {
  const state = useOverlayState({ isOpen, onOpenChange });

  // Yuklangan yozuv kalit bilan birga saqlanadi: shunda "qaysi
  // yozuv yuklangan" degan savol state'ning o'zidan ko'rinadi va
  // effect ichida qo'shimcha setState kerak bo'lmaydi.
  const [loaded, setLoaded] = useState({ id: null, member: null });

  useEffect(() => {
    if (!isOpen || !memberId) return;

    let cancelled = false;

    api
      .get(`/api/registration/members/${memberId}`)
      .then((data) => {
        if (!cancelled) setLoaded({ id: memberId, member: data });
      })
      .catch(() => {
        if (!cancelled) setLoaded({ id: memberId, member: null });
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, memberId]);

  // Boshqa yozuv tanlangan bo'lsa, eskisini ko'rsatmaymiz — yangisi
  // kelgunicha "yuklanmoqda".
  const member = loaded.id === memberId ? loaded.member : null;
  const isLoading = loaded.id !== memberId;

  return (
    <Modal.Root state={state}>
      <Modal.Backdrop>
        <Modal.Container size="xl">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>
                {member?.verifiedFullName ?? member?.fullName ?? "Yozuv tafsiloti"}
              </Modal.Heading>
            </Modal.Header>

            <Modal.Body>
              {isLoading ? (
                <div className="flex justify-center py-10">
                  <Spinner color="accent" aria-label="Yuklanmoqda" />
                </div>
              ) : !member ? (
                <p className="text-sm text-foreground/60">
                  Ma'lumot yuklanmadi.
                </p>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Chip
                      size="sm"
                      color={MEMBER_STATUS_COLORS[member.status] ?? "default"}
                    >
                      {MEMBER_STATUS_LABELS[member.status] ?? member.status}
                    </Chip>

                    {member.verifiedVia && (
                      <Chip size="sm" variant="ghost">
                        {member.verifiedVia === "gcp"
                          ? "Pasport bazasi (GCP)"
                          : "Guvohnoma (FHDYO)"}
                      </Chip>
                    )}

                    {member.httpStatus && (
                      <Chip
                        size="sm"
                        variant="ghost"
                        color={member.httpStatus === 200 ? "success" : "danger"}
                      >
                        HTTP {member.httpStatus}
                      </Chip>
                    )}

                    {member.durationMs != null && (
                      <span className="text-xs text-foreground/50">
                        {member.durationMs} ms
                      </span>
                    )}
                  </div>

                  {member.reason && (
                    <p
                      className={`rounded-lg border px-3 py-2 text-sm ${
                        member.status === "failed"
                          ? "border-danger/30 bg-danger/5 text-danger"
                          : "border-warning/30 bg-warning/5 text-warning"
                      }`}
                    >
                      {member.reason}
                    </p>
                  )}

                  <Section title="Umumiy fuqarolar bazasidagi ma'lumot">
                    <dl className="grid gap-3 sm:grid-cols-2">
                      <Field label="F.I.Sh." value={member.fullName} />
                      <Field label="Tug'ilgan sana" value={member.birthDate} />
                      <Field label="Hujjat" value={member.document} mono />
                      <Field label="JSHSHIR" value={member.pinfl} mono />
                      <Field label="Kadastr" value={member.cadasterNumber} mono />
                    </dl>
                  </Section>

                  {member.verifiedPinfl && (
                    <Section title="Davlat bazasidan tasdiqlangan ma'lumot">
                      <dl className="grid gap-3 sm:grid-cols-2">
                        <Field label="F.I.Sh." value={member.verifiedFullName} />
                        <Field
                          label="Tug'ilgan sana"
                          value={member.verifiedBirthDate}
                        />
                        <Field
                          label="Hujjat"
                          value={
                            member.verifiedDocSeries
                              ? `${member.verifiedDocSeries}${member.verifiedDocNumber ?? ""}`
                              : null
                          }
                          mono
                        />
                        <Field label="JSHSHIR" value={member.verifiedPinfl} mono />
                        <Field
                          label="Hujjat turi"
                          value={member.verifiedDocumentType}
                        />
                      </dl>
                    </Section>
                  )}

                  {member.sentPayload && (
                    <Section title="Platformaga yuborilgan kodlar">
                      <dl className="mb-3 grid gap-3 sm:grid-cols-3">
                        <Field
                          label="Qarindoshligi"
                          value={
                            RELATIONSHIP_LABELS[member.relationshipCode] ??
                            member.relationshipCode
                          }
                        />
                        <Field
                          label="Ta'lim darajasi"
                          value={
                            STUDY_LEVEL_LABELS[member.studyLevelCode] ??
                            member.studyLevelCode
                          }
                        />
                        <Field
                          label="Hujjat turi"
                          value={
                            DOCUMENT_TYPE_LABELS[member.documentTypeCode] ??
                            member.documentTypeCode
                          }
                        />
                      </dl>

                      <p className="mb-1.5 text-xs text-foreground/50">
                        Body (payload)
                      </p>
                      <Json data={member.sentPayload} />
                    </Section>
                  )}

                  {member.platformResponse && (
                    <Section title="Platformaning javobi">
                      <Json data={member.platformResponse} />
                    </Section>
                  )}

                  {member.registryResponse && (
                    <Section title="Davlat bazasining to'liq javobi">
                      <Json data={member.registryResponse} />
                    </Section>
                  )}
                </div>
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

export default RegistrationMemberModal;
