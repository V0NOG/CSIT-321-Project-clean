import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { useEffect, useState } from "react";
import { fetchAnalyticsSummary } from "../../api/analyticsApi";

const CATEGORIES = ["Images", "Videos", "Audios", "Documents", "Apps", "Other"] as const;
const COLORS = ["#3641f5", "#7592ff", "#dde9ff", "#32d583", "#fd853a", "#a855f7"];

function fmtBytes(b: number) {
  if (b === 0) return "0 B";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(1)} MB`;
  return `${(b / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

const BASE_OPTIONS: ApexOptions = {
  colors: COLORS,
  labels: CATEGORIES as unknown as string[],
  chart: {
    fontFamily: "Outfit, sans-serif",
    type: "donut",
    height: 290,
    animations: { enabled: true },
  },
  plotOptions: {
    pie: {
      donut: {
        size: "65%",
        background: "transparent",
        labels: {
          show: true,
          total: {
            show: true,
            label: "Total",
            formatter: (w) => {
              const total = w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
              return fmtBytes(total);
            },
          },
        },
      },
    },
  },
  dataLabels: { enabled: false },
  legend: {
    show: true,
    position: "bottom",
    horizontalAlign: "center",
    fontFamily: "Outfit",
    fontSize: "13px",
    markers: { size: 4, shape: "circle" as any, strokeWidth: 0 },
    itemMargin: { horizontal: 8, vertical: 0 },
  },
  tooltip: {
    enabled: true,
    y: { formatter: (v: number) => fmtBytes(v) },
  },
  stroke: { show: false, width: 2 },
};

export default function SessionChart() {
  const [series, setSeries] = useState<number[]>(CATEGORIES.map(() => 0));
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const s = await fetchAnalyticsSummary();
        if (!alive) return;
        setSeries(CATEGORIES.map((k) => s.byType[k] ?? 0));
        setLoaded(true);
      } catch {
        if (alive) setError(true);
      }
    })();
    return () => { alive = false; };
  }, []);

  const hasData = series.some((v) => v > 0);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Storage by Category</h3>
        {loaded && !hasData && (
          <span className="text-xs text-gray-400 dark:text-gray-500">No files yet</span>
        )}
      </div>

      {error ? (
        <div className="flex items-center justify-center h-[290px] text-sm text-gray-400">
          Failed to load storage data
        </div>
      ) : !loaded ? (
        <div className="flex items-center justify-center h-[290px]">
          <div className="animate-pulse w-[200px] h-[200px] rounded-full bg-gray-100 dark:bg-white/[0.06]" />
        </div>
      ) : !hasData ? (
        <div className="flex flex-col items-center justify-center h-[290px] gap-3">
          <svg className="w-12 h-12 text-gray-200 dark:text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 2.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125m16.5 2.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
          </svg>
          <p className="text-sm text-gray-400 dark:text-gray-500">Upload files to see storage breakdown</p>
        </div>
      ) : (
        <div className="flex justify-center mx-auto">
          <Chart
            key="storage-donut"
            options={BASE_OPTIONS}
            series={series}
            type="donut"
            height={290}
          />
        </div>
      )}
    </div>
  );
}
