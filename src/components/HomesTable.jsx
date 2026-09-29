import { Chip, Table } from "@heroui/react";
import { CheckCircle2 } from "lucide-react";

const baseColumns = [
  { id: "cadasterNumber", name: "Kadastr raqami" },
  { id: "fullName", name: "Ф.И.Ш." },
  { id: "pinfl", name: "JSHSHIR" },
  { id: "status", name: "Holat" },
  { id: "detailsSyncedAt", name: "Tafsilot" },
];

// Holatni faqat tafsilot yuklangandan keyin aniqlash mumkin — bazaviy
// ro'yxat javobida (cache/data) bu maydonlar har doim bo'sh keladi.
// Xonadon faqat JSHSHIR va tug'ilgan sana ikkalasi ham mavjud bo'lsa
// "faol" hisoblanadi.
const getHomeStatus = (home) => {
  if (!home.detailsSyncedAt) return "unknown";
  return home.pinfl && home.birthDate ? "active" : "inactive";
};

/**
 * Xonadonlar jadvali. `withStreetColumn` true bo'lsa, boshiga har
 * xonadonning tegishli ko'cha nomini ko'rsatuvchi ustun qo'shiladi
 * (barcha ko'chalar bo'yicha umumiy ro'yxatda foydali). Qator bosilganda
 * `onRowPress(home)` chaqiriladi (xonadon tafsiloti sahifasiga o'tish uchun).
 */
const HomesTable = ({
  homes,
  streetsById,
  withStreetColumn = false,
  onRowPress,
}) => {
  const columns = withStreetColumn
    ? [{ id: "street", name: "Ko'cha" }, ...baseColumns]
    : baseColumns;

  return (
    <Table aria-label="Xonadonlar jadvali">
      <Table.Content>
        <Table.Header columns={columns}>
          {(column) => (
            <Table.Column isRowHeader={column.id === columns[0].id}>
              {column.name}
            </Table.Column>
          )}
        </Table.Header>

        <Table.Body items={homes}>
          {(home) => {
            const status = getHomeStatus(home);

            return (
              <Table.Row
                id={home._id}
                onAction={onRowPress ? () => onRowPress(home) : undefined}
              >
                {withStreetColumn && (
                  <Table.Cell>
                    {streetsById?.[home.streetId]?.name ?? "—"}
                  </Table.Cell>
                )}
                <Table.Cell>{home.cadasterNumber ?? "—"}</Table.Cell>
                <Table.Cell>{home.fullName ?? "—"}</Table.Cell>
                <Table.Cell>{home.pinfl ?? "—"}</Table.Cell>
                <Table.Cell>
                  {status === "unknown" ? (
                    "—"
                  ) : status === "active" ? (
                    <Chip color="success" variant="soft" size="sm">
                      Faol
                    </Chip>
                  ) : (
                    <Chip color="danger" variant="soft" size="sm">
                      Nofaol
                    </Chip>
                  )}
                </Table.Cell>
                <Table.Cell>
                  {home.detailsSyncedAt ? (
                    <CheckCircle2
                      className="size-4 text-success"
                      aria-label="Tafsilot yuklangan"
                    />
                  ) : (
                    "—"
                  )}
                </Table.Cell>
              </Table.Row>
            );
          }}
        </Table.Body>
      </Table.Content>
    </Table>
  );
};

export default HomesTable;
