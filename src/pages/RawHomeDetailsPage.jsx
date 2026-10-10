import { useEffect, useState } from "react";
import { Button, Spinner } from "@heroui/react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router-dom";
import api from "../config/api";
import RawRecordsTable from "../components/RawRecordsTable.jsx";
import HomesStats from "../components/HomesStats.jsx";

const RawHomeDetailsPage = () => {
  const { cadasterNumber } = useParams();
  const navigate = useNavigate();

  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/api/raw-homes/${encodeURIComponent(cadasterNumber)}`)
      .then((data) => setMembers(data.members))
      .catch((err) => {
        toast.error(err?.message || "Xonadonni yuklashda xatolik yuz berdi.");
      })
      .finally(() => setIsLoading(false));
  }, [cadasterNumber]);

  const stats = members.length
    ? {
        total: members.length,
        withPinfl: members.filter((m) => m.pinfl).length,
        birthCerts: members.filter(
          (m) => m.documentType === "Tug'ilganlik guvohnomasi",
        ).length,
      }
    : null;

  return (
    <div className="py-5">
      <div className="container">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <Button
            onPress={() => navigate("/raw-homes")}
            variant="ghost"
            isIconOnly
            aria-label="Ortga"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Button>

          <div>
            <h1 className="text-xl font-semibold text-foreground">
              {cadasterNumber}
            </h1>
            <p className="text-sm text-foreground/60">Xonadon a'zolari</p>
          </div>
        </div>

        <HomesStats
          stats={stats}
          totalLabel="Jami a'zolar"
          positiveLabel="JSHSHIR bor"
          negativeLabel="Guvohnoma bilan"
          positiveKey="withPinfl"
          negativeKey="birthCerts"
          negativeClassName="text-foreground"
        />

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" color="accent" aria-label="Yuklanmoqda" />
          </div>
        ) : members.length === 0 ? (
          <p className="py-10 text-center text-sm text-foreground/60">
            Bu kadastr raqami bo'yicha a'zolar topilmadi.
          </p>
        ) : (
          <RawRecordsTable records={members} withCadasterColumn={false} />
        )}
      </div>
    </div>
  );
};

export default RawHomeDetailsPage;
