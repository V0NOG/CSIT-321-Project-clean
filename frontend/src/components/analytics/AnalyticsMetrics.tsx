import React, { useEffect, useState } from "react";
import Badge from "../ui/badge/Badge";
import { fetchAnalyticsSummary } from "../../api/analyticsApi";
import { fmtBytes } from "../../utils/storage";

export default function AnalyticsMetrics() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const s = await fetchAnalyticsSummary();
        if (!alive) return;
        setData(s);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const tiles = [
    {
      id: 1,
      title: "Total Files",
      value: loading ? "—" : String(data?.totalFiles ?? 0),
      change: "", direction: "up", comparisonText: ""
    },
    {
      id: 2,
      title: "Total Storage Used",
      value: loading ? "—" : fmtBytes(data?.totalBytes ?? 0),
      change: "", direction: "up", comparisonText: ""
    },
    {
      id: 3,
      title: "Uploads (30d)",
      value: loading ? "—" : String((data?.uploads30 ?? []).reduce((n: number, d: any) => n + d.count, 0)),
      change: "", direction: "up", comparisonText: ""
    },
    {
      id: 4,
      title: "Downloads (30d)",
      value: loading ? "—" : String((data?.downloads30 ?? []).reduce((n: number, d: any) => n + d.count, 0)),
      change: "", direction: "up", comparisonText: ""
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 xl:grid-cols-4">
      {tiles.map((item) => (
        <div key={item.id} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-gray-500 text-theme-sm dark:text-gray-400">{item.title}</p>
          <div className="flex items-end justify-between mt-3">
            <h4 className="text-2xl font-bold text-gray-800 dark:text-white/90">{item.value}</h4>
            <div className="flex items-center gap-1">
              <Badge color="success"><span className="text-xs">{item.change}</span></Badge>
              <span className="text-gray-500 text-theme-xs dark:text-gray-400">{item.comparisonText}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}