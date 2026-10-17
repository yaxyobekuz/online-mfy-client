import { useState } from "react";
import { FileDown, Loader } from "lucide-react";
import { toast } from "sonner";
import api from "../config/api.js";
import { downloadDashboardReport } from "../utils/report-pdf.js";

/*
  Asosiy sahifadagi "Hisobot" kartochkasi. Bosilganda joriy yurish
  bo'yicha PDF hisobot yuklab olinadi. Sonlar serverdan olinadi —
  kartochkalar bilan bir xil manbadan.
*/
const ReportDownloadCard = ({ disabled = false }) => {
  const [isBusy, setIsBusy] = useState(false);

  const handleDownload = async () => {
    setIsBusy(true);
    try {
      const report = await api.get("/api/dashboard/report");

      if (!report.run) {
        toast.error("Hisobot uchun yurish hali boshlanmagan");
        return;
      }

      await downloadDashboardReport(report);
    } catch {
      toast.error("Hisobotni tayyorlashda xatolik yuz berdi");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={disabled || isBusy}
      title="Hisobotni PDF formatda yuklab olish"
      className="flex flex-col gap-2.5 rounded-xl bg-brand-soft p-3 text-left transition-opacity hover:opacity-80 disabled:opacity-50"
    >
      <p className="truncate text-sm text-muted">Hisobot (PDF)</p>

      <p className="flex items-center gap-2 text-base font-bold whitespace-nowrap text-brand">
        {isBusy ? (
          <Loader className="size-5 animate-spin" aria-hidden="true" />
        ) : (
          <FileDown className="size-5" aria-hidden="true" />
        )}
        {isBusy ? "Tayyorlanmoqda" : "Yuklab olish"}
      </p>
    </button>
  );
};

export default ReportDownloadCard;
