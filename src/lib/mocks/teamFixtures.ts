export type MockTeamMember = {
  id: number;
  name: string;
  initial: string;
  jenis: string;
  supervisorName: string;
  supervisorEmail: string;
};

export const MOCK_REFERENCE_DATE = "2026-11-10";

export const teamMembers: MockTeamMember[] = [
  {
    id: 101,
    name: "Rina Aulia",
    initial: "R",
    jenis: "PKL",
    supervisorName: "Pak Andi",
    supervisorEmail: "andi@padepokan.id",
  },
  {
    id: 102,
    name: "Sari Wulandari",
    initial: "S",
    jenis: "Karyawan",
    supervisorName: "Pak Andi",
    supervisorEmail: "andi@padepokan.id",
  },
  {
    id: 103,
    name: "Budi Santoso",
    initial: "B",
    jenis: "Magang",
    supervisorName: "Pak Andi",
    supervisorEmail: "andi@padepokan.id",
  },
  {
    id: 104,
    name: "Maya Putri",
    initial: "M",
    jenis: "Magang",
    supervisorName: "Pak Andi",
    supervisorEmail: "andi@padepokan.id",
  },
  {
    id: 105,
    name: "Dedi Pratama",
    initial: "D",
    jenis: "Karyawan",
    supervisorName: "Pak Andi",
    supervisorEmail: "andi@padepokan.id",
  },
];

export function getTeamMemberById(userId: number): MockTeamMember | undefined {
  return teamMembers.find((member) => member.id === userId);
}
