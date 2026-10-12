import { Checkbox, Table } from "@heroui/react";

const columns = [
  { id: "rowNumber", name: "№" },
  { id: "fullName", name: "FIO" },
  { id: "fullNameCyrillic", name: "ФИШ" },
  { id: "birthDate", name: "Tug'ilgan sana" },
  { id: "document", name: "Hujjat seriya va raqami" },
  { id: "pinfl", name: "JSHSHIR" },
  { id: "cadasterNumber", name: "Kadastr raqami" },
  { id: "address", name: "Manzili" },
  { id: "synced", name: "Yangilangan" },
];

/**
 * Umumiy fuqarolar bazasi jadvali. Excel faylidagi ustunlar tartibini
 * saqlaydi, shunda yuklangan fayl bilan yonma-yon solishtirish oson
 * bo'ladi.
 */
const CitizensTable = ({ citizens }) => (
  <div className="overflow-x-auto">
    <Table aria-label="Umumiy fuqarolar bazasi">
      <Table.Content>
        <Table.Header columns={columns}>
          {(column) => (
            <Table.Column isRowHeader={column.id === "rowNumber"}>
              {column.name}
            </Table.Column>
          )}
        </Table.Header>

        <Table.Body items={citizens}>
          {(citizen) => (
            <Table.Row id={citizen._id}>
              <Table.Cell>{citizen.rowNumber ?? "—"}</Table.Cell>
              <Table.Cell>{citizen.fullName ?? "—"}</Table.Cell>
              <Table.Cell>{citizen.fullNameCyrillic ?? "—"}</Table.Cell>
              <Table.Cell>{citizen.birthDate ?? "—"}</Table.Cell>
              <Table.Cell>{citizen.document ?? "—"}</Table.Cell>
              <Table.Cell>
                {citizen.pinfl ?? (
                  <span className="text-foreground/40">yo'q</span>
                )}
              </Table.Cell>
              <Table.Cell>{citizen.cadasterNumber ?? "—"}</Table.Cell>
              <Table.Cell>{citizen.address ?? "—"}</Table.Cell>
              <Table.Cell>
                {citizen.documentExpired ? (
                  <span
                    className="text-xs text-warning"
                    title="Davlat bazasida hujjati yaroqsiz deb belgilangan. Qayta so'rov yuborilmaydi."
                  >
                    eskirgan
                  </span>
                ) : (
                  <Checkbox
                    isSelected={Boolean(
                      citizen.gcpSyncedAt || citizen.birthCertSyncedAt,
                    )}
                    isReadOnly
                    aria-label={
                      citizen.gcpSyncedAt || citizen.birthCertSyncedAt
                        ? "So'nggi ma'lumotga yangilangan"
                        : "Hali yangilanmagan"
                    }
                  >
                    <Checkbox.Content>
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                    </Checkbox.Content>
                  </Checkbox>
                )}
              </Table.Cell>
            </Table.Row>
          )}
        </Table.Body>
      </Table.Content>
    </Table>
  </div>
);

export default CitizensTable;
