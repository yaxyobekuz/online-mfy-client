import { useEffect, useState } from "react";
import { Button, Spinner, Tabs } from "@heroui/react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router-dom";
import api from "../config/api";
import FamilyMembersTable from "../components/FamilyMembersTable.jsx";

const yesNo = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  if (value === true || value === 1 || value === "1") return "Ha";
  if (value === false || value === 0 || value === "0") return "Yo'q";
  return String(value);
};

const Field = ({ label, value }) => (
  <div className="flex flex-col gap-1 border-b border-border py-3 last:border-0">
    <span className="text-xs text-foreground/60">{label}</span>
    <span className="text-sm text-foreground">{value ?? "—"}</span>
  </div>
);

const Section = ({ title, children }) => (
  <div className="rounded-xl border border-border bg-surface p-4">
    <h2 className="mb-2 text-sm font-semibold text-foreground">{title}</h2>
    <div>{children}</div>
  </div>
);

const HomeMainInfo = ({ home }) => (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
    <Section title="Shaxsiy ma'lumot">
      <Field label="F.I.Sh." value={home.fullName} />
      <Field label="JSHSHIR" value={home.pinfl} />
      <Field label="Passport" value={home.passport} />
      <Field label="Tug'ilgan sana" value={home.birthDate} />
      <Field label="Telefon raqami" value={home.mobilePhone} />
      <Field label="Manzil" value={home.address} />
    </Section>

    <Section title="Uy / mulk">
      <Field label="Xonadon raqami" value={home.homeNum} />
      <Field label="Kadastr raqami" value={home.cadasterNumber} />
      <Field label="Mulkiy mansubligi" value={home.ownershipType} />
      <Field
        label="Uy ro'yxatga olinganmi"
        value={yesNo(home.homeRegistered)}
      />
      <Field label="Xatlov sanasi" value={home.surveyDate} />
    </Section>

    <Section title="Kommunal xizmatlar">
      <Field label="Elektr" value={yesNo(home.electricity)} />
      <Field label="Gaz" value={yesNo(home.gas)} />
      <Field label="Ichimlik suvi" value={yesNo(home.drinkingWater)} />
      <Field label="Sug'orish suvi" value={yesNo(home.irrigationWater)} />
      <Field label="Kanalizatsiya" value={yesNo(home.sewerage)} />
    </Section>

    <Section title="Ijtimoiy-iqtisodiy holat">
      <Field label="Qarzi bormi" value={yesNo(home.hasDebt)} />
      <Field label="Qarz turi" value={home.debtType} />
      <Field label="Qarz maqsadi" value={home.debtPurpose} />
      <Field label="Oylik to'lov" value={home.monthlyPayment} />
      <Field label="Muddati o'tgan to'lov" value={home.overduePayment} />
    </Section>

    {!home.detailsSyncedAt && (
      <p className="text-sm text-foreground/60 md:col-span-2">
        Bu xonadon uchun batafsil ma'lumot birinchi marta yuklanmoqda edi.
      </p>
    )}
  </div>
);

const FamilyTab = ({ homeId }) => {
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    api
      .get(`/api/homes/${homeId}/family`)
      .then(setMembers)
      .catch(() => {
        toast.error("Oila a'zolarini yuklashda xatolik yuz berdi.");
      })
      .finally(() => setIsLoading(false));
  }, [homeId]);

  const updateFamily = () => {
    setIsUpdating(true);

    api
      .post(`/api/homes/${homeId}/family/sync`)
      .then((data) => {
        setMembers(data);
        toast.success("Oila a'zolari yangilandi");
      })
      .catch(() => {
        toast.error("Oila a'zolarini yangilashda xatolik yuz berdi.");
      })
      .finally(() => setIsUpdating(false));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" color="accent" aria-label="Yuklanmoqda" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button
          onPress={updateFamily}
          isDisabled={isUpdating}
          variant="secondary"
        >
          <RefreshCw
            className={`size-4 ${isUpdating ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
          Oila a'zolarini yangilash
        </Button>
      </div>

      {members.length === 0 ? (
        <p className="py-10 text-center text-sm text-foreground/60">
          Hozircha oila a'zolari mavjud emas.
        </p>
      ) : (
        <FamilyMembersTable members={members} />
      )}
    </div>
  );
};

const HomeDetailsPage = () => {
  const { streetId, homeId } = useParams();
  const navigate = useNavigate();

  const [home, setHome] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/api/homes/${homeId}`)
      .then(setHome)
      .catch(() => {
        toast.error("Xonadon tafsilotini yuklashda xatolik yuz berdi.");
      })
      .finally(() => setIsLoading(false));
  }, [homeId]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" color="accent" aria-label="Yuklanmoqda" />
      </div>
    );
  }

  if (!home) {
    return (
      <div className="py-5">
        <div className="container">
          <p className="py-10 text-center text-sm text-foreground/60">
            Xonadon topilmadi.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-5">
      <div className="container">
        <div className="mb-5 flex items-center gap-3">
          <Button
            onPress={() => navigate(`/streets/${streetId}`)}
            variant="ghost"
            isIconOnly
            aria-label="Ortga"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Button>

          <h1 className="text-xl font-semibold text-foreground">
            {home.fullName ?? "Xonadon"}
          </h1>
        </div>

        <Tabs>
          <Tabs.ListContainer>
            <Tabs.List>
              <Tabs.Tab id="main">Asosiy ma'lumotlar</Tabs.Tab>
              <Tabs.Tab id="family">Oila a'zolari</Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>

          <Tabs.Panel id="main">
            <HomeMainInfo home={home} />
          </Tabs.Panel>

          <Tabs.Panel id="family">
            <FamilyTab homeId={homeId} />
          </Tabs.Panel>
        </Tabs>
      </div>
    </div>
  );
};

export default HomeDetailsPage;
