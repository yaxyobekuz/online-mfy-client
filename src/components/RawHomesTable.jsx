import { Chip, Table } from "@heroui/react";

const columns = [
  { id: "cadasterNumber", name: "Kadastr raqami" },
  { id: "headName", name: "Oila boshlig'i" },
  { id: "membersCount", name: "A'zolar" },
  { id: "documents", name: "Hujjatlar" },
  { id: "phone", name: "Telefon raqami" },
];

const RawHomesTable = ({ homes, onRowPress }) => (
  <Table aria-label="Xom xonadonlar jadvali">
    <Table.Content>
      <Table.Header columns={columns}>
        {(column) => (
          <Table.Column isRowHeader={column.id === "cadasterNumber"}>
            {column.name}
          </Table.Column>
        )}
      </Table.Header>

      <Table.Body items={homes}>
        {(home) => (
          <Table.Row
            id={home.cadasterNumber}
            onAction={onRowPress ? () => onRowPress(home) : undefined}
          >
            <Table.Cell>{home.cadasterNumber}</Table.Cell>

            <Table.Cell>
              {home.headName ?? "—"}
              {home.headsCount > 1 && (
                <span className="ml-1 text-xs text-foreground/50">
                  +{home.headsCount - 1} oila
                </span>
              )}
            </Table.Cell>

            <Table.Cell>
              {home.membersCount}
              {home.uncertain > 0 && (
                <span
                  className="ml-1 text-xs text-warning"
                  title={`${home.uncertain} ta a'zoning kadastri aniq emas`}
                >
                  ({home.uncertain} shubhali)
                </span>
              )}
            </Table.Cell>

            <Table.Cell>
              <div className="flex flex-wrap gap-1">
                {home.withPinfl > 0 && (
                  <Chip color="success" variant="soft" size="sm">
                    {home.withPinfl} JSHSHIR
                  </Chip>
                )}
                {home.birthCerts > 0 && (
                  <Chip color="warning" variant="soft" size="sm">
                    {home.birthCerts} guvohnoma
                  </Chip>
                )}
              </div>
            </Table.Cell>

            <Table.Cell>{home.phone ?? "—"}</Table.Cell>
          </Table.Row>
        )}
      </Table.Body>
    </Table.Content>
  </Table>
);

export default RawHomesTable;
