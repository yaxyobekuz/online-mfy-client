import { Chip, Table } from "@heroui/react";
import {
  MEMBER_STATUS_COLORS,
  MEMBER_STATUS_LABELS,
  STUDY_LEVEL_LABELS,
} from "../config/registration-labels.js";

const columns = [
  { id: "index", name: "№" },
  { id: "fullName", name: "F.I.Sh." },
  { id: "pinfl", name: "JSHSHIR" },
  { id: "cadaster", name: "Kadastr" },
  { id: "status", name: "Holat" },
  { id: "reason", name: "Sabab / natija" },
];

/**
 * Ro'yxatga olingan (yoki olinmagan) odamlar jadvali. Qatorga
 * bosilganda to'liq tafsilot ochiladi — yuborilgan payload va
 * platformaning javobi bilan.
 */
const RegistrationMembersTable = ({ members, startIndex = 0, onSelect }) => {
  return (
    <div className="overflow-x-auto">
      <Table aria-label="Ro'yxatga olingan odamlar">
        <Table.Content>
          <Table.Header columns={columns}>
            {(column) => (
              <Table.Column isRowHeader={column.id === "index"}>
                {column.name}
              </Table.Column>
            )}
          </Table.Header>

          <Table.Body
            items={members.map((member, index) => ({
              ...member,
              id: member._id,
              displayNumber: startIndex + index + 1,
            }))}
          >
            {(member) => (
              <Table.Row
                id={member.id}
                onAction={onSelect ? () => onSelect(member) : undefined}
              >
                <Table.Cell>{member.displayNumber}</Table.Cell>

                <Table.Cell>
                  <span className="font-medium text-foreground">
                    {member.verifiedFullName ?? member.fullName ?? "—"}
                  </span>
                  {/*
                    Davlat bazasidagi ism Excel'dagidan farq qilsa,
                    ikkalasini ko'rsatamiz: platforma rasmiy qiymatni
                    talab qiladi, farqni ko'rib turish foydali.
                  */}
                  {member.verifiedFullName &&
                    member.fullName &&
                    member.verifiedFullName !== member.fullName && (
                      <span className="block text-xs text-foreground/40">
                        bazada: {member.fullName}
                      </span>
                    )}
                  {member.studyLevelCode && (
                    <span className="block text-xs text-foreground/40">
                      ta'lim: {STUDY_LEVEL_LABELS[member.studyLevelCode] ?? member.studyLevelCode}
                      {member.verifiedVia === "fhdyo" ? " · guvohnoma" : ""}
                    </span>
                  )}
                </Table.Cell>

                <Table.Cell className="font-mono text-xs">
                  {member.verifiedPinfl ?? member.pinfl ?? "—"}
                </Table.Cell>

                <Table.Cell className="font-mono text-xs">
                  {member.cadasterNumber ?? "—"}
                </Table.Cell>

                <Table.Cell>
                  <Chip
                    size="sm"
                    color={MEMBER_STATUS_COLORS[member.status] ?? "default"}
                  >
                    {MEMBER_STATUS_LABELS[member.status] ?? member.status}
                  </Chip>
                </Table.Cell>

                <Table.Cell className="max-w-md">
                  <span
                    className={`text-sm ${
                      member.status === "failed"
                        ? "text-danger"
                        : member.status === "added"
                          ? "text-success"
                          : "text-foreground/60"
                    }`}
                  >
                    {member.status === "added"
                      ? `ID ${member.memberId ?? "—"}`
                      : (member.reason ?? "—")}
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

export default RegistrationMembersTable;
