import { Button, Chip, Table } from "@heroui/react";
import { Play, RotateCw } from "lucide-react";
import { useNavigate } from "react-router-dom";

const columns = [
  { id: "index", name: "№" },
  { id: "name", name: "Mahalla" },
  { id: "citizens", name: "Fuqarolar" },
  { id: "cadasters", name: "Xonadon (kadastr)" },
  { id: "available", name: "Mavjud" },
  { id: "withoutPinfl", name: "JSHSHIR'i yo'q" },
  { id: "run", name: "Holat" },
  { id: "actions", name: "" },
];

const RUN_LABELS = {
  pending: "Boshlanmagan",
  preparing: "Tayyorlanmoqda",
  running: "Ketmoqda",
  paused: "To'xtatib turildi",
  done: "Tugadi",
  stopped: "To'xtatildi",
  error: "Xatolik",
};

const RUN_COLORS = {
  preparing: "accent",
  running: "accent",
  paused: "warning",
  done: "success",
  stopped: "default",
  error: "danger",
};

/**
 * Ro'yxatga olish uchun mahalla tanlash jadvali. Har qatorda shu
 * mahalla bo'yicha oxirgi yurish holati ko'rinadi — ish qayerda
 * to'xtaganini bilib turish uchun.
 */
const RegistrationMahallasTable = ({
  mahallas,
  onStart,
  startingKey,
  isBusy,
}) => {
  const navigate = useNavigate();

  return (
    <div className="overflow-x-auto">
      <Table aria-label="Ro'yxatga olish uchun mahallalar">
        <Table.Content aria-label="Ro'yxatga olish uchun mahallalar">
          <Table.Header columns={columns}>
            {(column) => (
              <Table.Column isRowHeader={column.id === "index"}>
                {column.name}
              </Table.Column>
            )}
          </Table.Header>

          {/*
            Table.Body qatorlarni `id` bo'yicha keshlaydi — tashqi
            prop o'zgarganda qayta chizmaydi. Shuning uchun holatni
            items ichiga qo'shamiz.
          */}
          <Table.Body
            items={mahallas.map((mahalla, index) => ({
              ...mahalla,
              isStarting: startingKey === mahalla.key,
              displayNumber: index + 1,
            }))}
          >
            {(mahalla) => (
              <Table.Row
                id={mahalla.key}
                onAction={
                  mahalla.run
                    ? () => navigate(`/registration/runs/${mahalla.run.id}`)
                    : undefined
                }
              >
                <Table.Cell>{mahalla.displayNumber}</Table.Cell>

                <Table.Cell>
                  <span className="font-medium text-foreground">
                    {mahalla.name}
                  </span>
                </Table.Cell>

                <Table.Cell>{mahalla.citizens.toLocaleString("uz-UZ")}</Table.Cell>
                <Table.Cell>{mahalla.cadasters.toLocaleString("uz-UZ")}</Table.Cell>

                {/*
                  Token faqat o'z MFY siga kirish beradi — tashqi API
                  boshqa mahalla xonadonlarini qaytarmaydi. Shuning
                  uchun nechtasi amalda ishlashga tayyor ekanini
                  ko'rsatamiz.
                */}
                <Table.Cell>
                  {mahalla.isAvailable ? (
                    <span className="text-success">
                      {mahalla.availableCadasters.toLocaleString("uz-UZ")}
                    </span>
                  ) : (
                    <Chip size="sm" variant="ghost">
                      Tokenda yo'q
                    </Chip>
                  )}
                </Table.Cell>

                <Table.Cell
                  className={mahalla.withoutPinfl > 0 ? "text-warning" : undefined}
                >
                  {mahalla.withoutPinfl.toLocaleString("uz-UZ")}
                </Table.Cell>

                <Table.Cell>
                  {mahalla.run ? (
                    <div className="flex flex-col gap-1">
                      <Chip
                        size="sm"
                        color={RUN_COLORS[mahalla.run.status] ?? "default"}
                      >
                        {RUN_LABELS[mahalla.run.status] ?? mahalla.run.status}
                      </Chip>
                      <span className="text-xs text-foreground/50">
                        {mahalla.run.homesDone}/{mahalla.run.homesTotal} xonadon,{" "}
                        <span className="text-success">
                          +{mahalla.run.membersAdded}
                        </span>
                        {mahalla.run.membersFailed > 0 && (
                          <span className="text-danger">
                            {" "}
                            / {mahalla.run.membersFailed} xato
                          </span>
                        )}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-foreground/40">—</span>
                  )}
                </Table.Cell>

                <Table.Cell>
                  <Button
                    onPress={() => onStart(mahalla)}
                    isDisabled={isBusy || !mahalla.isAvailable}
                    variant="ghost"
                    size="sm"
                    aria-label={`${mahalla.name} bo'yicha ro'yxatga olishni boshlash`}
                  >
                    {["paused", "running", "preparing", "pending"].includes(
                      mahalla.run?.status,
                    ) ? (
                      <RotateCw className="size-4" aria-hidden="true" />
                    ) : (
                      <Play className="size-4" aria-hidden="true" />
                    )}
                    {mahalla.isStarting
                      ? "Boshlanmoqda..."
                      : ["paused", "running", "preparing", "pending"].includes(
                            mahalla.run?.status,
                          )
                        ? "Davom ettirish"
                        : "Boshlash"}
                  </Button>
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table.Content>
      </Table>
    </div>
  );
};

export default RegistrationMahallasTable;
