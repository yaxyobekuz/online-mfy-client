import { useCallback, useEffect, useState } from "react";
import { Button, InputGroup, Spinner, TextField } from "@heroui/react";
import { BarChart3, ListChecks, MapPinned, Search } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import api from "../config/api";
import RegistrationMahallasTable from "../components/RegistrationMahallasTable.jsx";
import MahallaTokensPanel from "../components/MahallaTokensPanel.jsx";
import RateLimitMonitor from "../components/RateLimitMonitor.jsx";
import { useRegistrationStream } from "../hooks/useRegistrationStream.js";

/**
 * MFY bo'yicha oila a'zolarini ro'yxatdan o'tkazish — boshlash
 * sahifasi. Mahalla tanlanadi, "Boshlash" bosiladi va jarayon
 * kuzatuv sahifasida davom etadi.
 */
const RegistrationPage = () => {
  const navigate = useNavigate();

  const [mahallas, setMahallas] = useState([]);
  const [available, setAvailable] = useState(null);
  const [runs, setRuns] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [startingKey, setStartingKey] = useState(null);

  // Jonli oqim — holat va API limiti real vaqtda keladi.
  const stream = useRegistrationStream(true);

  const load = useCallback(
    () =>
      Promise.all([
        api.get("/api/registration/mahallas"),
        api.get("/api/registration/runs"),
        api.get("/api/mahalla-tokens"),
      ]).then(([mahallaData, runData, tokenData]) => {
        setMahallas(mahallaData.items ?? []);
        setAvailable(mahallaData.available ?? 0);
        setRuns(runData.items ?? []);
        setTokens(tokenData.items ?? []);
      }),
    [],
  );

  useEffect(() => {
    load()
      .catch(() => toast.error("Ma'lumotlarni yuklashda xatolik yuz berdi."))
      .finally(() => setIsLoading(false));
  }, [load]);

  // Faol yurishlar. Turli MFY lar PARALLEL ketaveradi — har
  // birining o'z tokeni va o'z rate-limit oqimi bor.
  //
  // Jonli oqim ulangan bo'lsa, undagi ma'lumot yangiroq (har
  // sekundda yangilanadi); aks holda sahifa yuklanganda olingan
  // ro'yxatga qaytamiz.
  const liveRuns = stream.runs.length ? stream.runs : runs;
  const activeRuns = liveRuns.filter((run) => run.isActive);

  const handleStart = (mahalla) => {
    setStartingKey(mahalla.key);

    // Mahalla qaysi token hududiga tegishli bo'lsa, o'sha token
    // bilan boshlanadi. Aniqlanmasa, joriy seans tokeni ishlatiladi
    // (server o'zi shunday qiladi).
    const owner = tokens.find((t) => t.uid === mahalla.ownerUid);

    api
      .post("/api/registration/runs", {
        mahalla: mahalla.key,
        ...(owner ? { tokenId: owner.id } : {}),
      })
      .then((data) => {
        if (data.resumed) {
          toast.info("Tugallanmagan yurish davom ettirildi");
        } else {
          toast.success(`"${mahalla.name}" bo'yicha jarayon boshlandi`);
        }

        navigate(`/registration/runs/${data.runId}`);
      })
      .catch((err) => {
        toast.error(err?.message ?? "Jarayonni boshlashda xatolik yuz berdi.");
        setStartingKey(null);
      });
  };

  const filtered = search.trim()
    ? mahallas.filter((mahalla) =>
        mahalla.name.toLowerCase().includes(search.trim().toLowerCase()),
      )
    : mahallas;

  return (
    <div className="py-5">
      <div className="container">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              MFY bo'yicha ro'yxatga olish
            </h1>
            <p className="text-sm text-foreground/60">
              Mahalla tanlanadi, xonadonlar birma-bir ishlanadi va oila
              a'zolari davlat bazasidan tasdiqlangan holda kiritiladi
            </p>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button
              onPress={() => navigate("/registration/report")}
              variant="ghost"
            >
              <BarChart3 className="size-4" aria-hidden="true" />
              Statistika va hisobotlar
            </Button>
          </div>

          <TextField aria-label="Qidirish" className="w-full sm:w-80">
            <InputGroup className="w-full">
              <InputGroup.Prefix>
                <Search className="size-4" aria-hidden="true" />
              </InputGroup.Prefix>
              <InputGroup.Input
                className="w-full"
                value={search}
                placeholder="Mahalla nomi"
                onChange={(event) => setSearch(event.target.value)}
              />
            </InputGroup>
          </TextField>
        </div>

        {/*
          Token faqat o'z MFY siga kirish beradi. Ro'yxatda barcha
          mahallalar ko'rinadi (fuqarolar bazasi umumiy), lekin
          ishlashga tayyori faqat bir nechtasi — buni oldindan
          aytib qo'yamiz.
        */}
        {available === 0 && !isLoading && (
          <p className="mb-5 rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
            Hech bir mahalla tokenga ko'rinmaydi. Avval "Ko'chalar" va
            "Xonadonlar" bo'limidan ma'lumotlarni yuklang — shundan keyin
            o'z MFY ingiz ro'yxatda tayyor bo'lib chiqadi.
          </p>
        )}

        {available > 0 && (
          <p className="mb-5 text-sm text-foreground/60">
            Tokeningizga{" "}
            <span className="font-medium text-foreground">{available} mahalla</span>{" "}
            ko'rinadi — faqat shularni ro'yxatga olish mumkin. Qolganlari
            umumiy fuqarolar bazasida bor, lekin tashqi API ularning
            xonadonlarini qaytarmaydi.
          </p>
        )}

        {/* Faol jarayonlar — bir nechta MFY parallel ketishi mumkin */}
        {activeRuns.length > 0 && (
          <div className="mb-5 flex flex-col gap-2">
            {activeRuns.map((run) => (
              <button
                key={run.id}
                type="button"
                onClick={() => navigate(`/registration/runs/${run.id}`)}
                className="flex w-full items-center gap-3 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3 text-left transition-colors hover:bg-accent/10"
              >
                <Spinner size="sm" color="accent" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-foreground">
                    "{run.mahallaName}" bo'yicha jarayon ketmoqda
                  </span>
                  <span className="block truncate text-xs text-foreground/60">
                    {run.stage ?? "—"} · {run.homesDone}/{run.homesTotal}{" "}
                    xonadon · {run.membersAdded} odam kiritildi
                  </span>
                </span>
                <ListChecks className="size-4 text-accent" aria-hidden="true" />
              </button>
            ))}
          </div>
        )}

        <RateLimitMonitor runs={liveRuns} isConnected={stream.isConnected} />

        <MahallaTokensPanel
          tokens={tokens}
          onChanged={load}
          isBusy={Boolean(startingKey)}
        />

        {/* Yurishlar tarixi — har biriga qaytib kirish mumkin */}
        {runs.length > 0 && (
          <div className="mb-5">
            <h2 className="mb-2 text-sm font-semibold text-foreground">
              Yurishlar
            </h2>
            <div className="flex flex-wrap gap-2">
              {runs.slice(0, 12).map((run) => (
                <button
                  key={run.id}
                  type="button"
                  onClick={() => navigate(`/registration/runs/${run.id}`)}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-left text-xs transition-colors hover:border-accent/40"
                >
                  <span className="block font-medium text-foreground">
                    {run.mahallaName ?? run.mahallaKey}
                  </span>
                  <span className="block text-foreground/50">
                    {run.homesDone}/{run.homesTotal} xonadon ·{" "}
                    <span className="text-success">+{run.membersAdded}</span>
                    {run.membersFailed > 0 && (
                      <span className="text-danger">
                        {" "}
                        / {run.membersFailed}
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" color="accent" aria-label="Yuklanmoqda" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <MapPinned className="size-8 text-foreground/30" aria-hidden="true" />
            <p className="text-sm text-foreground/60">
              {search
                ? `"${search}" bo'yicha hech narsa topilmadi.`
                : "Hozircha mahalla yo'q. Avval \"Umumiy fuqarolar bazasi\" bo'limiga Excel fayl yuklang."}
            </p>
          </div>
        ) : (
          <RegistrationMahallasTable
            mahallas={filtered}
            onStart={handleStart}
            startingKey={startingKey}
                // Faqat SHU mahalla jarayoni ketayotgan bo'lsa
            // bloklanadi — boshqa mahallalar parallel boshlanaveradi.
            isBusy={Boolean(startingKey)}
          />
        )}
      </div>
    </div>
  );
};

export default RegistrationPage;
