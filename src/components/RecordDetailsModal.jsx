import { useEffect, useState } from "react";
import { Modal, Spinner, useOverlayState } from "@heroui/react";
import api from "../config/api";
import { Field, Json, Section } from "./DetailFields.jsx";
import {
  HOME_STATUS_LABELS,
  MEMBER_STATUS_LABELS,
  MEMBER_STATUS_TONE,
} from "../config/registration-labels.js";

/*
  Ro'yxatdagi FUQARO yoki XONADON uchun "Ba'tafsil" oynasi.

  Odam urinishi (RegistrationMember) uchun MemberDetailsModal ishlatiladi —
  bu oyna esa bazadagi yozuvni, davlat bazasi javoblarini va shu
  fuqaroning/xonadonning urinishlarini ko'rsatadi.
*/

const ENDPOINT = { citizen: "citizens", home: "homes" };

const AttemptList = ({ attempts }) => (
  <ul className="flex flex-col gap-2">
    {attempts.map((attempt) => (
      <li
        key={attempt.id}
        className="flex items-center justify-between gap-3 rounded-lg bg-canvas px-3 py-2"
      >
        <div className="min-w-0">
          <p className="truncate text-sm text-ink">{attempt.fullName}</p>
          {attempt.reasonLabel && (
            <p className="truncate text-xs text-muted">{attempt.reasonLabel}</p>
          )}
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
            MEMBER_STATUS_TONE[attempt.status] ?? MEMBER_STATUS_TONE.pending
          }`}
        >
          {MEMBER_STATUS_LABELS[attempt.status] ?? attempt.status}
        </span>
      </li>
    ))}
  </ul>
);

const CitizenBody = ({ data }) => (
  <div className="flex flex-col gap-4">
    {data.documentExpired && (
      <p className="rounded-xl bg-warn-soft px-3 py-2 text-sm text-warn">
        Hujjati muddati o&rsquo;tgan (davlat bazasi bo&rsquo;yicha)
      </p>
    )}

    <Section title="Umumiy ma'lumotlar bazasidagi yozuv">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="F.I.Sh." value={data.fullName} />
        <Field label="F.I.Sh. (kirill)" value={data.fullNameCyrillic} />
        <Field label="Tug'ilgan sana" value={data.birthDate} />
        <Field label="Hujjat" value={data.document} mono />
        <Field label="Hujjat turi" value={data.documentType} />
        <Field label="JSHSHIR" value={data.pinfl} mono />
        <Field label="Kadastr" value={data.cadasterNumber} mono />
        <Field label="Manzil" value={data.address} />
        <Field label="Ota" value={data.fatherFullName} />
        <Field label="Ona" value={data.motherFullName} />
      </div>
    </Section>

    <Section title={`Ro'yxatga olish urinishlari (${data.attempts.length})`}>
      {data.attempts.length ? (
        <AttemptList attempts={data.attempts} />
      ) : (
        <p className="text-sm text-muted">Hali urinilmagan</p>
      )}
    </Section>

    {data.gcpData && (
      <Section title="Pasport bazasi (GCP) javobi">
        <Json data={data.gcpData} />
      </Section>
    )}

    {data.birthCertData && (
      <Section title="Tug'ilganlik guvohnomasi (FHDYO) javobi">
        <Json data={data.birthCertData} />
      </Section>
    )}
  </div>
);

const HomeBody = ({ data }) => (
  <div className="flex flex-col gap-4">
    <Section title="Xonadon">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Ko'cha" value={data.streetName} />
        <Field label="Uy" value={data.homeNum} />
        <Field label="Kadastr" value={data.cadasterNumber} mono />
        <Field label="Holat" value={HOME_STATUS_LABELS[data.status] ?? data.status} />
        <Field label="Egasi" value={data.ownerFullName} />
        <Field label="Egasi JSHSHIR" value={data.ownerPinfl} mono />
      </div>
      {data.reason && (
        <p className="mt-3 rounded-xl bg-warn-soft px-3 py-2 text-sm text-warn">
          {data.reason}
        </p>
      )}
    </Section>

    <Section title="Sonlar">
      <div className="grid gap-3 sm:grid-cols-5">
        <Field label="Platformada bor" value={data.existingCount} />
        <Field label="Bazadan topilgan" value={data.candidatesCount} />
        <Field label="Kiritildi" value={data.addedCount} />
        <Field label="Xatolik" value={data.failedCount} />
        <Field label="O'tkazildi" value={data.skippedCount} />
      </div>
    </Section>

    <Section title={`A'zolar (${data.members.length})`}>
      {data.members.length ? (
        <AttemptList attempts={data.members} />
      ) : (
        <p className="text-sm text-muted">Bu xonadonda urinishlar yo&rsquo;q</p>
      )}
    </Section>
  </div>
);

const RecordDetailsModal = ({ record, onOpenChange }) => {
  const kind = record?.kind ?? null;
  const id = record?.id ?? null;
  const isOpen = Boolean(record);
  const state = useOverlayState({ isOpen, onOpenChange });

  // Yuklangan yozuv kalit bilan saqlanadi — boshqa yozuv tanlansa,
  // eskisi ko'rinmaydi (MemberDetailsModal bilan bir xil usul).
  const key = kind ? `${kind}:${id}` : null;
  const [loaded, setLoaded] = useState({ key: null, data: null });

  useEffect(() => {
    if (!kind) return undefined;

    let cancelled = false;
    const requestKey = `${kind}:${id}`;

    api
      .get(`/api/dashboard/${ENDPOINT[kind]}/${id}`)
      .then((data) => {
        if (!cancelled) setLoaded({ key: requestKey, data });
      })
      .catch(() => {
        if (!cancelled) setLoaded({ key: requestKey, data: null });
      });

    return () => {
      cancelled = true;
    };
  }, [kind, id]);

  const data = loaded.key === key ? loaded.data : null;
  const isLoading = key !== null && loaded.key !== key;

  return (
    <Modal.Root state={state}>
      <Modal.Backdrop>
        <Modal.Container size="xl">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>
                {data?.fullName ?? data?.ownerFullName ?? "Yozuv tafsiloti"}
              </Modal.Heading>
            </Modal.Header>

            <Modal.Body>
              {isLoading ? (
                <div className="flex justify-center py-10">
                  <Spinner color="accent" aria-label="Yuklanmoqda" />
                </div>
              ) : !data ? (
                <p className="text-sm text-muted">Ma&rsquo;lumot yuklanmadi.</p>
              ) : data.kind === "citizen" ? (
                <CitizenBody data={data} />
              ) : (
                <HomeBody data={data} />
              )}
            </Modal.Body>

            <Modal.Footer>
              {/*
                `Modal.CloseTrigger` tugmani O'ZI chizadi — ichiga
                `Button` qo'yilsa, tugma ichida tugma bo'lib qoladi.
              */}
              <Modal.CloseTrigger>Yopish</Modal.CloseTrigger>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal.Root>
  );
};

export default RecordDetailsModal;
