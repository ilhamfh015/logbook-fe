import { apiFetch } from "@/services/apiClient";
import type { TeamMemberDto } from "@/types/reviewApi";

export type TeamScope = "ATASAN" | "ADMIN";

export async function getTeam(scope: TeamScope = "ATASAN"): Promise<TeamMemberDto[]> {
  const response = await apiFetch<unknown>(`/api/team?scope=${scope}`);
  return Array.isArray(response) ? response as TeamMemberDto[] : [];
}
