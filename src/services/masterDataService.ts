import { apiFetch } from "@/services/apiClient";

export type MasterDataItem = {
  id: number;
  name: string;
};

export type DurationOption = {
  minutes: number;
  label: string;
};

export type MasterDataApi = {
  types: MasterDataItem[];
  statuses: MasterDataItem[];
  durations: DurationOption[];
};

export const masterDataService = {
  getMasterData: (): Promise<MasterDataApi> => {
    return apiFetch<MasterDataApi>("/api/tasks/master-data");
  },
};