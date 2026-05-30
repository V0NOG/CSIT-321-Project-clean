// frontend/src/api/analyticsApi.ts
import axios from "axios";
const BASE = "/api";

const authHeader = () => {
  const token = localStorage.getItem("token") || localStorage.getItem("userToken") || "";
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export type Summary = {
  totalFiles: number;
  totalBytes: number;
  byType: Record<"Images"|"Videos"|"Audios"|"Documents"|"Apps"|"Other", number>;
  uploads30: { date: string; count: number }[];
  downloads30: { date: string; count: number }[];
  topActions30d: Record<string, number>;
};

export async function fetchAnalyticsSummary(signal?: AbortSignal): Promise<Summary> {
  const res = await axios.get(`${BASE}/analytics/summary`, { headers: authHeader(), signal });
  return res.data;
}