import { useEffect, useState, useMemo } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { fetchAnalyticsSummary } from "../../api/analyticsApi";

export default function AnalyticsBarChart() {
  const [data, setData] = useState<{ dates: string[]; values: number[] }>({ dates: [], values: [] });

  useEffect(() => {
    let alive = true;
    (async () => {
      const s = await fetchAnalyticsSummary();
      if (!alive) return;
      const dates = (s.uploads30 ?? []).map(d => d.date);
      const values = (s.uploads30 ?? []).map(d => d.count);
      setData({ dates, values });
    })();
    return () => { alive = false; };
  }, []);

  const options: ApexOptions = useMemo(() => ({
    colors: ["#465fff"],
    chart: { fontFamily: "Outfit, sans-serif", type: "bar", height: 350, toolbar: { show: false } },
    plotOptions: { bar: { horizontal: false, columnWidth: "45%", borderRadius: 5, borderRadiusApplication: "end" } },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 4, colors: ["transparent"] },
    xaxis: { categories: data.dates, axisBorder: { show: false }, axisTicks: { show: false } },
    legend: { show: true, position: "top", horizontalAlign: "left", fontFamily: "Outfit" },
    grid: { yaxis: { lines: { show: true } } },
    fill: { opacity: 1 },
    tooltip: { x: { show: true }, y: { formatter: (v: number) => `${v}` } }
  }), [data.dates]);

  const series = [{ name: "Uploads (files)", data: data.values }];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <h3 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">Uploads (last 30 days)</h3>
          <span className="block text-gray-500 text-theme-sm dark:text-gray-400">Counts per day</span>
        </div>
      </div>
      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="-ml-5 min-w-[700px] xl:min-w-full pl-2">
          <Chart options={options} series={series} type="bar" height={350} />
        </div>
      </div>
    </div>
  );
}