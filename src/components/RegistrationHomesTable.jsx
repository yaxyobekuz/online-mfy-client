import { Chip, Table } from "@heroui/react";
import {
  HOME_STATUS_COLORS,
  HOME_STATUS_LABELS,
} from "../config/registration-labels.js";

const columns = [
  { id: "index", name: "№" },
  { id: "cadaster", name: "Kadastr" },
  { id: "street", name: "Ko'cha / uy" },
  { id: "owner", name: "Xonadon egasi" },
  { id: "counts", name: "Kiritildi / nomzod" },
  { id: "status", name: "Holat" },
  { id: "reason", name: "Izoh" },
];

/**
 * Yurishdagi xonadonlar — oila kesimida kuzatish uchun. Qatorga
 * bosilganda shu xonadonning barcha a'zolari ochiladi.
 */
const RegistrationHomesTable = ({ homes, onSelect }) => {
  return (
    <div className="overflow-x-auto">
      <Table aria-label="Yurishdagi xonadonlar">
        <Table.Content>
          <Table.Header columns={columns}>
            {(column) => (
              <Table.Column isRowHeader={column.id === "index"}>
                {column.name}
              </Table.Column>
            )}
          </Table.Header>

          <Table.Body items={homes.map((home) => ({ ...home, id: home._id }))}>
            {(home) => (
              <Table.Row
                id={home.id}
                onAction={onSelect ? () => onSelect(home) : undefined}
              >
                <Table.Cell>{home.queueIndex + 1}</Table.Cell>

                <Table.Cell className="font-mono text-xs">
                  {home.cadasterNumber ?? "—"}
                </Table.Cell>

                <Table.Cell>
                  <span className="text-sm text-foreground">
                    {home.streetName ?? "—"}
                  </span>
                  {home.homeNum && (
                    <span className="block text-xs text-foreground/50">
                      {home.homeNum}-uy
                    </span>
                  )}
                </Table.Cell>

                <Table.Cell>
                  <span className="text-sm text-foreground">
                    {home.ownerFullName ?? "—"}
                  </span>
                  {home.existingCount > 0 && (
                    <span className="block text-xs text-foreground/50">
                      platformada {home.existingCount} a'zo
                    </span>
                  )}
                </Table.Cell>

                <Table.Cell>
                  <span className="text-success">{home.addedCount}</span>
                  <span className="text-foreground/40">
                    {" / "}
                    {home.candidatesCount}
                  </span>
                  {home.failedCount > 0 && (
                    <span className="block text-xs text-danger">
                      {home.failedCount} xato
                    </span>
                  )}
                </Table.Cell>

                <Table.Cell>
                  <Chip size="sm" color={HOME_STATUS_COLORS[home.status] ?? "default"}>
                    {HOME_STATUS_LABELS[home.status] ?? home.status}
                  </Chip>
                </Table.Cell>

                <Table.Cell className="max-w-xs">
                  <span className="text-xs text-foreground/60">
                    {home.reason ?? "—"}
                  </span>
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table.Content>
      </Table>
    </div>
  );
};

export default RegistrationHomesTable;
