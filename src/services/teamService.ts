import { apiFetch } from "@/services/apiClient";
import type { TeamMemberDto } from "@/types/reviewApi";

export async function getTeam(): Promise<TeamMemberDto[]> {
  const response = await apiFetch<unknown>("/api/team");
  return Array.isArray(response) ? response as TeamMemberDto[] : [];
}