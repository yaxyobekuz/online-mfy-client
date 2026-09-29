import { Checkbox, Table } from "@heroui/react";

const columns = [
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

const RawRecordsTable = ({ records }) => (
  <Table aria-label="Xom ma'lumot jadvali">
    <Table.Content>
      <Table.Header columns={columns}>
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
            <Table.Cell>{record.cadasterNumber ?? "—"}</Table.Cell>
            <Table.Cell>{record.relationship ?? "—"}</Table.Cell>
            <Table.Cell>{record.pinfl ?? "—"}</Table.Cell>
            <Table.Cell>{record.documentType ?? "—"}</Table.Cell>
            <Table.Cell>{record.documentSeries ?? "—"}</Table.Cell>
            <Table.Cell>{record.documentNumber ?? "—"}</Table.Cell>
            <Table.Cell>{record.phone ?? "—"}</Table.Cell>
            <Table.Cell>{record.birthDate ?? "—"}</Table.Cell>
            <Table.Cell>
              <Checkbox
                isSelected={Boolean(record.gcpSyncedAt)}
                isReadOnly
                aria-label={
                  record.gcpSyncedAt
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
