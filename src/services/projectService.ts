import { apiFetch } from "@/services/apiClient";
import type { ProjectApi } from "@/types/task";

export const projectService = {
  getProjects: async (): Promise<ProjectApi[]> => {
    return apiFetch<ProjectApi[]>("/api/projects");
  },
};