import { useEffect, useState } from "react";
import { Modal, Spinner, useOverlayState } from "@heroui/react";
import api from "../config/api";
import {
  DOCUMENT_TYPE_LABELS,
  MEMBER_STATUS_LABELS,
  RELATIONSHIP_LABELS,
  STUDY_LEVEL_LABELS,
} from "../config/registration-labels.js";

/*
  `dl`/`dt`/`dd` ataylab ishlatilmaydi: HeroUI modal ichida ularga
  o'z ranglarini beradi (navbatma-navbat ko'k, sariq...) va ro'yxat
  ola-bula bo'lib ko'rinardi. Oddiy `div` bunday uslubga tushmaydi.
*/
const Field = ({ label, value, mono }) => (
  <div className="min-w-0">
    <p className="text-xs text-muted">{label}</p>
    <p className={`truncate text-sm text-ink ${mono ? "font-mono" : ""}`}>
      {value ?? "—"}
    </p>
  </div>
);

const Section = ({ title, children }) => (
  <div className="rounded-xl bg-panel p-4">
    <h4 className="mb-3 text-xs font-semibold tracking-wide text-muted uppercase">
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

// Jonli ro'yxatdagi rang bilan bir xil bo'lishi kerak.
const STATUS_TONE = {
  added: "bg-ok-soft text-ok",
  exists: "bg-ok-soft text-ok",
  failed: "bg-bad-soft text-bad",
  skipped: "bg-warn-soft text-warn",
  pending: "bg-panel text-muted",
};

/**
 * Bitta odamning to'liq yo'li: davlat bazasidan nima kelgani,
 * platformaga nima yuborilgani va platforma nima javob bergani.
 *
 * Xatolikni taxmin bilan emas, aniq ma'lumot bilan tekshirish
 * uchun — shuning uchun payload va javob to'liq ko'rsatiladi.
 */
const MemberDetailsModal = ({ memberId, isOpen, onOpenChange }) => {
  const state = useOverlayState({ isOpen, onOpenChange });

  // Yuklangan yozuv kalit bilan birga saqlanadi: shunda "qaysi
  // yozuv yuklangan" degan savol state'ning o'zidan ko'rinadi va
  // effect ichida qo'shimcha setState kerak bo'lmaydi.
  const [loaded, setLoaded] = useState({ id: null, member: null });

  useEffect(() => {
    if (!isOpen || !memberId) return undefined;

    let cancelled = false;

    api
      .get(`/api/dashboard/members/${memberId}`)
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

  // Boshqa yozuv tanlangan bo'lsa, eskisini ko'rsatmaymiz.
  const member = loaded.id === memberId ? loaded.member : null;
  const isLoading = loaded.id !== memberId;

  return (
    <Modal.Root state={state}>
      <Modal.Backdrop>
        <Modal.Container size="xl">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>
                {member?.verifiedFullName ??
                  member?.fullName ??
                  "Yozuv tafsiloti"}
              </Modal.Heading>
            </Modal.Header>

            <Modal.Body>
              {isLoading ? (
                <div className="flex justify-center py-10">
                  <Spinner color="accent" aria-label="Yuklanmoqda" />
                </div>
              ) : !member ? (
                <p className="text-sm text-muted">Ma&rsquo;lumot yuklanmadi.</p>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        STATUS_TONE[member.status] ?? STATUS_TONE.pending
                      }`}
                    >
                      {MEMBER_STATUS_LABELS[member.status] ?? member.status}
                    </span>

                    {member.verifiedVia && (
                      <span className="rounded-full bg-panel px-3 py-1 text-xs text-muted">
                        {member.verifiedVia === "baza"
                          ? "Umumiy baza"
                          : member.verifiedVia === "gcp"
                            ? "Pasport bazasi (GCP)"
                            : "Guvohnoma (FHDYO)"}
                      </span>
                    )}

                    {member.httpStatus && (
                      <span
                        className={`rounded-full px-3 py-1 text-xs ${
                          member.httpStatus < 400
                            ? "bg-ok-soft text-ok"
                            : "bg-bad-soft text-bad"
                        }`}
                      >
                        HTTP {member.httpStatus}
                      </span>
                    )}

                    {member.durationMs != null && (
                      <span className="text-xs text-muted">
                        {member.durationMs} ms
                      </span>
                    )}
                  </div>

                  {member.reason && (
                    <p
                      className={`rounded-xl px-3 py-2 text-sm ${
                        member.status === "failed"
                          ? "bg-bad-soft text-bad"
                          : "bg-warn-soft text-warn"
                      }`}
                    >
                      {member.reason}
                    </p>
                  )}

                  <Section title="Umumiy ma'lumotlar ba'zasidagi yozuv">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="F.I.Sh." value={member.fullName} />
                      <Field label="Tug'ilgan sana" value={member.birthDate} />
                      <Field label="Hujjat" value={member.document} mono />
                      <Field label="JSHSHIR" value={member.pinfl} mono />
                      <Field
                        label="Kadastr"
                        value={member.cadasterNumber}
                        mono
                      />
                    </div>
                  </Section>

                  {member.verifiedPinfl && (
                    <Section title="Tasdiqlangan ma'lumot">
                      <div className="grid gap-3 sm:grid-cols-2">
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
                        <Field
                          label="JSHSHIR"
                          value={member.verifiedPinfl}
                          mono
                        />
                        <Field
                          label="Hujjat turi"
                          value={member.verifiedDocumentType}
                        />
                      </div>
                    </Section>
                  )}

                  {member.sentPayload && (
                    <Section title="Platformaga yuborilgan">
                      <div className="mb-3 grid gap-3 sm:grid-cols-3">
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
                      </div>

                      <Json data={member.sentPayload} />
                    </Section>
                  )}

                  {member.platformResponse && (
                    <Section title="Platformaning javobi">
                      <Json data={member.platformResponse} />
                    </Section>
                  )}

                  {member.registryResponse && (
                    <Section title="Davlat bazasining javobi">
                      <Json data={member.registryResponse} />
                    </Section>
                  )}
                </div>
              )}
            </Modal.Body>

            <Modal.Footer>
              {/*
                `Modal.CloseTrigger` tugmani O'ZI chizadi — ichiga
                `Button` qo'yilsa, tugma ichida tugma bo'lib qoladi
                (HTML buni taqiqlaydi).
              */}
              <Modal.CloseTrigger>Yopish</Modal.CloseTrigger>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal.Root>
  );
};

export default MemberDetailsModal;
