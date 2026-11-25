import { MOCK_REFERENCE_DATE, teamMembers } from "@/lib/mocks/teamFixtures";

export type MemberStatus = "Draf" | "Belum mulai" | "Cuti" | "Terlewat";

export type TeamMemberMock = {
  id: number;
  name: string;
  initial: string;
  jenis: string;
  status: MemberStatus;
  hours: string;
  pending: string[];
};

export const TEAM_DASHBOARD_REFERENCE_DATE = MOCK_REFERENCE_DATE;

// Identitas dan tanggal disinkronkan dengan reviewFixtures (log 2026-11-09).
export const teamDashboardMembers: TeamMemberMock[] = [
  {
    id: teamMembers[0].id, // Rina Aulia
    name: teamMembers[0].name,
    initial: teamMembers[0].initial,
    jenis: teamMembers[0].jenis,
    status: "Draf",
    hours: "3 j 30 m",
    pending: ["Jum 6 Nov · 8 j", "Sen 9 Nov · 7 j"],
  },
  {
    id: teamMembers[1].id, // Sari Wulandari
    name: teamMembers[1].name,
    initial: teamMembers[1].initial,
    jenis: teamMembers[1].jenis,
    status: "Draf",
    hours: "2 j",
    pending: ["Sen 9 Nov · 8 j (Perbaikan diajukan)"],
  },
  {
    id: teamMembers[2].id, // Budi Santoso
    name: teamMembers[2].name,
    initial: teamMembers[2].initial,
    jenis: teamMembers[2].jenis,
    status: "Belum mulai",
    hours: "0 j",
    pending: ["Sen 9 Nov · 6 j"],
  },
  {
    id: teamMembers[3].id, // Maya Putri
    name: teamMembers[3].name,
    initial: teamMembers[3].initial,
    jenis: teamMembers[3].jenis,
    status: "Draf",
    hours: "1 j 30 m",
    pending: ["Sen 9 Nov · 7 j (Ditolak)"],
  },
  {
    id: teamMembers[4].id, // Dedi Pratama
    name: teamMembers[4].name,
    initial: teamMembers[4].initial,
    jenis: `${teamMembers[4].jenis} · shift malam`,
    status: "Cuti",
    hours: "—",
    pending: [],
  },
];
