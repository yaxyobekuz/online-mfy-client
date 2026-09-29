import { Table } from "@heroui/react";

const columns = [
  { id: "fullName", name: "Ф.И.Ш." },
  { id: "relationship", name: "Qarindoshlik" },
  { id: "birthDate", name: "Tug'ilgan sana" },
  { id: "pinfl", name: "JSHSHIR" },
  { id: "phone", name: "Telefon raqami" },
];

const FamilyMembersTable = ({ members }) => (
  <Table aria-label="Oila a'zolari jadvali">
    <Table.Content>
      <Table.Header columns={columns}>
        {(column) => (
          <Table.Column isRowHeader={column.id === "fullName"}>
            {column.name}
          </Table.Column>
        )}
      </Table.Header>

      <Table.Body items={members}>
        {(member) => (
          <Table.Row id={member._id}>
            <Table.Cell>{member.fullName ?? "—"}</Table.Cell>
            <Table.Cell>{member.relationship ?? "—"}</Table.Cell>
            <Table.Cell>{member.birthDate ?? "—"}</Table.Cell>
            <Table.Cell>{member.pinfl ?? "—"}</Table.Cell>
            <Table.Cell>{member.phone ?? "—"}</Table.Cell>
          </Table.Row>
        )}
      </Table.Body>
    </Table.Content>
  </Table>
);

export default FamilyMembersTable;
