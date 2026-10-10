import { Checkbox, Table } from "@heroui/react";

const allColumns = [
  { id: "rowNumber", name: "№" },
  { id: "fullName", name: "F.I.Sh." },
  { id: "cadasterNumber", name: "Kadastr raqami" },
  { id: "relationship", name: "Qarindoshligi" },
  { id: "pinfl", name: "JSHSHIR" },
  { id: "documentType", name: "Hujjat turi" },
  { id: "documentSeries", name: "Seriyasi" },
  { id: "documentNumber", name: "Hujjat raqami" },
  { id: "phone", name: "Telefon raqami" },
  { id: "birthDate", name: "Tug'ilgan sana" },
  { id: "gcpSyncedAt", name: "Yangilangan" },
];

/**
 * Xom yozuvlar jadvali. Bitta xonadon ichida ko'rsatilganda kadastr
 * ustuni ortiqcha — hamma qatorda bir xil qiymat turadi, shuning
 * uchun `withCadasterColumn={false}` bilan yashiriladi.
 */
const RawRecordsTable = ({ records, withCadasterColumn = true }) => (
  <Table aria-label="Xom ma'lumot jadvali">
    <Table.Content>
      <Table.Header
        columns={
          withCadasterColumn
            ? allColumns
            : allColumns.filter((c) => c.id !== "cadasterNumber")
        }
      >
        {(column) => (
          <Table.Column isRowHeader={column.id === "rowNumber"}>
            {column.name}
          </Table.Column>
        )}
      </Table.Header>

      <Table.Body items={records}>
        {(record) => (
          <Table.Row id={record._id}>
            <Table.Cell>{record.rowNumber ?? "—"}</Table.Cell>
            <Table.Cell>{record.fullName ?? "—"}</Table.Cell>
            {withCadasterColumn && (
              <Table.Cell>
                {record.cadasterNumber ?? "—"}
                {record.alternateCadasters?.length > 0 && (
                  <span
                    className="ml-1 text-xs text-foreground/50"
                    title={`Boshqa ehtimoliy kadastrlar: ${record.alternateCadasters.join(", ")}`}
                  >
                    +{record.alternateCadasters.length}
                  </span>
                )}
              </Table.Cell>
            )}
            <Table.Cell>
              {record.relationship ?? "—"}
              {!withCadasterColumn && record.alternateCadasters?.length > 0 && (
                <span
                  className="ml-1 text-xs text-warning"
                  title={`Kadastri aniq emas. Boshqa ehtimoliy kadastrlar: ${record.alternateCadasters.join(", ")}`}
                >
                  (shubhali)
                </span>
              )}
            </Table.Cell>
            <Table.Cell>{record.pinfl ?? "—"}</Table.Cell>
            <Table.Cell>
              {record.documentType ?? "—"}
              {record.documentExpired && (
                <span
                  className="ml-1 text-xs text-warning"
                  title="Hujjat muddati o'tgan — davlat bazasida yaroqsiz deb belgilangan. Yangilanmaydi."
                >
                  (eskirgan)
                </span>
              )}
            </Table.Cell>
            <Table.Cell>{record.documentSeries ?? "—"}</Table.Cell>
            <Table.Cell>{record.documentNumber ?? "—"}</Table.Cell>
            <Table.Cell>{record.phone ?? "—"}</Table.Cell>
            <Table.Cell>{record.birthDate ?? "—"}</Table.Cell>
            <Table.Cell>
              <Checkbox
                isSelected={Boolean(
                  record.gcpSyncedAt || record.birthCertSyncedAt,
                )}
                isReadOnly
                aria-label={
                  record.gcpSyncedAt || record.birthCertSyncedAt
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
            </Table.Cell>
          </Table.Row>
        )}
      </Table.Body>
    </Table.Content>
  </Table>
);

export default RawRecordsTable;
