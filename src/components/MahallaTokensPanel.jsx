import { useState } from "react";
import {
  Button,
  Chip,
  InputGroup,
  Label,
  Spinner,
  TextField,
} from "@heroui/react";
import { Download, KeyRound, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import api from "../config/api";

/**
 * MFY tokenlari ro'yxati.
 *
 * Har MFY ning o'z tokeni bor va tashqi API faqat o'sha token
 * egasining hududini ko'rsatadi. Bitta xodim bir nechta MFY ga
 * mas'ul bo'lsa, tokenlarni shu yerga qo'shadi va har biri bo'yicha
 * alohida (parallel) jarayon boshlaydi.
 *
 * Tokenning o'zi hech qachon serverdan qaytmaydi — faqat kimga
 * tegishli ekani ko'rsatiladi.
 */
const MahallaTokensPanel = ({ tokens, onChanged, isBusy }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [token, setToken] = useState("");
  const [label, setLabel] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleAdd = () => {
    if (!token.trim()) return;

    setIsSaving(true);
    api
      .post("/api/mahalla-tokens", { token: token.trim(), label: label.trim() })
      .then((data) => {
        toast.success(data.message ?? "Token qo'shildi");
        setToken("");
        setLabel("");
        setIsOpen(false);
        onChanged?.();
      })
      .catch((err) => toast.error(err?.message ?? "Token qo'shilmadi"))
      .finally(() => setIsSaving(false));
  };

  // Yangi token qo'shilganda uning xonadonlari DB'da bo'lmaydi,
  // mahallalar ro'yxati esa shularga tayanadi. Shuning uchun avval
  // yuklab olinadi.
  const handleSync = (entry) => {
    api
      .post(`/api/mahalla-tokens/${entry.id}/sync`)
      .then((data) => {
        toast.info(data.message ?? "Yuklanmoqda");
        // Yuklash fonda ketadi — bir oz kutib yangilaymiz.
        setTimeout(() => onChanged?.(), 20000);
      })
      .catch((err) => toast.error(err?.message ?? "Yuklashda xatolik"));
  };

  const handleDelete = (entry) => {
    api
      .delete(`/api/mahalla-tokens/${entry.id}`)
      .then(() => {
        toast.success(`"${entry.label}" o'chirildi`);
        onChanged?.();
      })
      .catch((err) => toast.error(err?.message ?? "O'chirishda xatolik"));
  };

  return (
    <div className="mb-5 rounded-xl border border-border bg-background">
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
        <KeyRound className="size-4 text-accent" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-foreground">
          MFY tokenlari
        </h2>
        <span className="text-xs text-foreground/50">
          har MFY o'z tokeni bilan parallel ishlaydi
        </span>

        <Button
          className="ml-auto"
          size="sm"
          variant="ghost"
          onPress={() => setIsOpen((value) => !value)}
        >
          <Plus className="size-4" aria-hidden="true" />
          Token qo'shish
        </Button>
      </div>

      {isOpen && (
        <div className="flex flex-wrap items-end gap-3 border-b border-border bg-surface px-4 py-3">
          <TextField className="min-w-0 flex-1" aria-label="Token">
            <Label className="text-xs">Token</Label>
            <InputGroup className="w-full">
              <InputGroup.Input
                className="w-full font-mono text-xs"
                value={token}
                placeholder="12c40672-4ff6-4d07-a48a-bff81a29b977"
                onChange={(event) => setToken(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleAdd();
                }}
              />
            </InputGroup>
          </TextField>

          <TextField className="w-full sm:w-56" aria-label="Nomi">
            <Label className="text-xs">Nomi (ixtiyoriy)</Label>
            <InputGroup className="w-full">
              <InputGroup.Input
                className="w-full"
                value={label}
                placeholder="Masalan: Serquyosh MFY"
                onChange={(event) => setLabel(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleAdd();
                }}
              />
            </InputGroup>
          </TextField>

          <Button onPress={handleAdd} isDisabled={isSaving || !token.trim()}>
            {isSaving ? (
              <Spinner size="sm" aria-label="Tekshirilmoqda" />
            ) : (
              <Plus className="size-4" aria-hidden="true" />
            )}
            {isSaving ? "Tekshirilmoqda..." : "Qo'shish"}
          </Button>
        </div>
      )}

      {tokens.length === 0 ? (
        <p className="px-4 py-4 text-sm text-foreground/60">
          Hozircha token qo'shilmagan. Boshqa MFY ma'lumotlarini ham kiritish
          uchun uning tokenini qo'shing — jarayonlar parallel ketadi.
        </p>
      ) : (
        <div className="divide-y divide-border">
          {tokens.map((entry) => (
            <div
              key={entry.id}
              className="flex flex-wrap items-center gap-3 px-4 py-2.5"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-foreground">
                  {entry.label}
                  {entry.isCurrent && (
                    <span className="ml-2 text-xs font-normal text-foreground/50">
                      (joriy seans)
                    </span>
                  )}
                </span>
                <span className="block text-xs text-foreground/50">
                  {entry.username} · hudud {entry.districtId} ·{" "}
                  {entry.homes.toLocaleString("uz-UZ")} xonadon
                </span>
              </span>

              {entry.run && (
                <Chip
                  size="sm"
                  color={
                    entry.run.isActive
                      ? "accent"
                      : entry.run.status === "done"
                        ? "success"
                        : "default"
                  }
                >
                  {entry.run.mahallaName} · {entry.run.homesDone}/
                  {entry.run.homesTotal} · +{entry.run.membersAdded}
                </Chip>
              )}

              {!entry.isValid && (
                <Chip size="sm" color="danger">
                  Token yaroqsiz
                </Chip>
              )}

              {/*
                Xonadonlari yuklanmagan token bilan yurish
                boshlab bo'lmaydi — mahallalar ro'yxati bo'sh
                chiqadi.
              */}
              {entry.homes === 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onPress={() => handleSync(entry)}
                  aria-label={`${entry.label} xonadonlarini yuklash`}
                >
                  <Download className="size-4" aria-hidden="true" />
                  Xonadonlarni yuklash
                </Button>
              )}

              <Button
                size="sm"
                variant="ghost"
                isDisabled={isBusy || entry.run?.isActive}
                onPress={() => handleDelete(entry)}
                aria-label={`${entry.label} tokenini o'chirish`}
              >
                <Trash2 className="size-4 text-danger" aria-hidden="true" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MahallaTokensPanel;
