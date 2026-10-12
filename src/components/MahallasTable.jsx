import { Button, Table } from "@heroui/react";
import { ListChecks } from "lucide-react";
import { useNavigate } from "react-router-dom";

const columns = [
  { id: "index", name: "№" },
  { id: "name", name: "Mahalla nomi" },
  { id: "cadasterPrefix", name: "Kadastr kodi" },
  { id: "total", name: "Fuqarolar" },
  { id: "withPinfl", name: "JSHSHIR'i bor" },
  { id: "withoutPinfl", name: "JSHSHIR'i yo'q" },
  { id: "actions", name: "" },
];

/**
 * Mahallalar ro'yxati. Qatorga bosilganda shu mahalladagi fuqarolar
 * ro'yxati ochiladi.
 */
const MahallasTable = ({
  mahallas,
  startIndex = 0,
  onSync,
  syncingKey,
  isSyncDisabled,
}) => {
  const navigate = useNavigate();

  return (
    <div className="overflow-x-auto">
      <Table aria-label="Mahallalar ro'yxati">
        <Table.Content aria-label="Mahallalar ro'yxati">
          <Table.Header columns={columns}>
            {(column) => (
              <Table.Column isRowHeader={column.id === "index"}>
                {column.name}
              </Table.Column>
            )}
          </Table.Header>

          {/*
            Table.Body qatorlarni `id` bo'yicha keshlaydi — tashqi
            prop (syncingKey) o'zgarganda ularni qayta chizmaydi.
            Shuning uchun holatni items ichiga qo'shamiz: shunda
            qator o'zgarganini ko'radi va tugma matni yangilanadi.
          */}
          <Table.Body
            items={mahallas.map((mahalla, index) => ({
              ...mahalla,
              isSyncing: syncingKey === mahalla.key,
              // Tartib raqamini ham shu yerda hisoblaymiz: nusxa
              // olingandan keyin indexOf ishlamay qoladi.
              displayNumber: startIndex + index + 1,
            }))}
          >
            {(mahalla) => (
              <Table.Row
                id={mahalla.key}
                onAction={() => navigate(`/mahallas/${mahalla.key}`)}
              >
                <Table.Cell>
                  {mahalla.displayNumber}
                </Table.Cell>
                <Table.Cell>
                  <span className="font-medium text-foreground">
                    {mahalla.name}
                  </span>
                  {mahalla.nameVariants?.length > 0 && (
                    <span
                      className="ml-2 text-xs text-foreground/50"
                      title={`Boshqa yozilishi: ${mahalla.nameVariants.join(", ")}`}
                    >
                      +{mahalla.nameVariants.length}
                    </span>
                  )}
                </Table.Cell>
                <Table.Cell>{mahalla.cadasterPrefix ?? "—"}</Table.Cell>
                <Table.Cell>{mahalla.total}</Table.Cell>
                <Table.Cell className="text-success">
                  {mahalla.withPinfl}
                </Table.Cell>
                <Table.Cell
                  className={
                    mahalla.withoutPinfl > 0 ? "text-warning" : undefined
                  }
                >
                  {mahalla.withoutPinfl}
                </Table.Cell>
                <Table.Cell>
                  {onSync && (
                    <Button
                      onPress={() => onSync(mahalla)}
                      isDisabled={isSyncDisabled}
                      variant="ghost"
                      size="sm"
                      aria-label={`${mahalla.name} mahallasini yangilash`}
                    >
                      <ListChecks className="size-4" aria-hidden="true" />
                      {mahalla.isSyncing ? "Yangilanmoqda..." : "Yangilash"}
                    </Button>
                  )}
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table.Content>
      </Table>
    </div>
  );
};

export default MahallasTable;
