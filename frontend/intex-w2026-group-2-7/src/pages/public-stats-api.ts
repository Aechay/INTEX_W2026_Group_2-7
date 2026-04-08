import { requestJson, resolveApiBaseUrl } from "@/auth/auth-api";

export type PublicStatsResponse = {
  girlsHelped: number;
  yearsOfService: number;
  activeDonors: number;
  operatingSafeHouses: number;
  preview: {
    outcomes: {
      girlsReintegrated: number;
      activeResidents: number;
      openCases: number;
    };
    progress: {
      schoolAttendance: number;
      educationGrowth: number;
      processSessionsThisMonth: number;
    };
    resourceUse: {
      programAllocation: number;
      costPerGirl: number;
      recurringDonorShare: number;
    };
  };
};

export const getPublicStats = async (): Promise<PublicStatsResponse> => {
  const apiBaseUrl = resolveApiBaseUrl();
  return requestJson<PublicStatsResponse>(apiBaseUrl, "/api/public/stats");
};
