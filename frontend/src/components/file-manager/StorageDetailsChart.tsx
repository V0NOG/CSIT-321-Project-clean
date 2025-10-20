// frontend/src/components/file-manager/StorageDetailsChart.tsx

import { useMemo } from "react";
import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { useFiles } from "../../hooks/useFiles";
import { categorize, fmtBytes, Category } from "../../utils/storage";

export default function StorageDetailsChart() {
  const { items, loading } = useFiles({ page: 1, limit: 1000 });
  const files = items ?? [];

  const isDarkMode =
    typeof document !== "undefined" && document.documentElement.classList.contains("dark");

  const { labels, series, totalBytes, legendMap } = useMemo(() => {
    const order: Category[] = ["Images", "Videos", "Audios", "Documents", "Apps", "Other"];
    const byteMap: Record<Category, number> = { Images: 0, Videos: 0, Audios: 0, Documents: 0, Apps: 0, Other: 0 };
    for (const f of files) {
      const cat = categorize(f.mime, f.name);
      byteMap[cat] += Number(f.size) || 0;
    }
    const labels = order;
    const series = order.map((k) => byteMap[k]);
    const totalBytes = series.reduce((a, b) => a + b, 0);
    const legendMap = Object.fromEntries(order.map((k, i) => [k, series[i]]));
    return { labels, series, totalBytes, legendMap };
  }, [files]);

  const options: ApexOptions = useMemo(() => ({
    colors: ["#9b8afb", "#fd853a", "#fdb022", "#32d583", "#60a5fa", "#a855f7"],
    labels,
    chart: { fontFamily: "Outfit, sans-serif", type: "donut" },
    stroke: { show: false, width: 4, colors: ["transparent"] },
    plotOptions: {
      pie: {
        donut: {
          size: "65%",
          background: "transparent",
          labels: {
            show: true,
            name: { show: true, offsetY: -10, color: isDarkMode ? "#fff" : "#1D2939", fontSize: "14px", fontWeight: "500" },
            value:{ show: true, offsetY: 0, color: isDarkMode ? "#D1D5DB" : "#667085", fontSize: "14px", fontWeight: "400",
              formatter: () => `Used ${fmtBytes(totalBytes)}` },
            total:{ show: true, label: `Total Files: ${files.length}`, color: isDarkMode ? "#fff" : "#000",
              fontSize: "14px", fontWeight: "600" },
          },
        },
        expandOnClick: false,
      },
    },
    dataLabels: { enabled: false },
    tooltip: {
      enabled: true,
      y: {
        formatter: (val: number, opts?: any) => {
          const label = opts?.w?.globals?.labels?.[opts?.seriesIndex] || "";
          const size = legendMap[label] ?? val;
          const percent = totalBytes > 0 ? `${Math.round(((size as number) / totalBytes) * 100)}%` : "0%";
          return `${fmtBytes(size)} • ${percent}`;
        },
      },
    },
    legend: {
      show: true,
      position: "bottom",
      horizontalAlign: "left",
      fontFamily: "Outfit, sans-serif",
      fontSize: "14px",
      fontWeight: 400,
      markers: { size: 6, shape: "circle", strokeWidth: 0 },
      itemMargin: { horizontal: 10, vertical: 6 },
      formatter: (legendName: string) => `${legendName} — ${fmtBytes(legendMap[legendName] ?? 0)}`,
    },
  }), [labels, totalBytes, legendMap, files.length, isDarkMode]);

  const forceKey = `${files.length}-${totalBytes}`;

  return (
    <div className="px-4 pt-6 pb-6 bg-white border border-gray-200 rounded-2xl dark:border-gray-800 dark:bg-gray-900 sm:px-6" key={forceKey}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Storage Details</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {loading ? "Loading…" : `Total Used: ${fmtBytes(totalBytes)}`}
          </p>
        </div>
      </div>

      {files.length === 0 ? (
        <div className="py-10 text-sm text-center text-gray-500 dark:text-gray-400">No files yet.</div>
      ) : (
        <div className="flex justify-center mx-auto" id="chartDarkStyle">
          <Chart options={options} series={series} type="donut" width="400" />
        </div>
      )}
    </div>
  );
}