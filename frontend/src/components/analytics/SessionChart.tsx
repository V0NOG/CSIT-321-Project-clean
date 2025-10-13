import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { useEffect, useMemo, useState } from "react";
import { fetchAnalyticsSummary } from "../../api/analyticsApi";

export default function SessionChart() {
  const [labels, setLabels] = useState<string[]>([]);
  const [series, setSeries] = useState<number[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const s = await fetchAnalyticsSummary();
      if (!alive) return;
      const order = ["Images","Videos","Audios","Documents","Apps","Other"];
      setLabels(order);
      setSeries(order.map(k => s.byType[k as keyof typeof s.byType] || 0));
    })();
    return () => { alive = false; };
  }, []);

  const options: ApexOptions = useMemo(() => ({
    colors: ["#3641f5", "#7592ff", "#dde9ff", "#32d583", "#fd853a", "#a855f7"],
    labels,
    chart: { fontFamily: "Outfit, sans-serif", type: "donut", height: 290 },
    plotOptions: { pie: { donut: { size: "65%", background: "transparent", labels: { show: true } } } },
    dataLabels: { enabled: false },
    legend: {
      show: true, position: "bottom", horizontalAlign: "center", fontFamily: "Outfit", fontSize: "14px",
      markers: { size: 4, shape: "circle", strokeWidth: 0 }, itemMargin: { horizontal: 10, vertical: 0 }
    },
    tooltip: { enabled: true, y: { formatter: (v:number)=> v.toString() } },
    stroke: { show: false, width: 4 }
  }), [labels]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <div className="flex items-center justify-between mb-9">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Storage by Category</h3>
      </div>
      <div className="flex justify-center mx-auto">
        <Chart options={options} series={series} type="donut" height={290} />
      </div>
    </div>
  );
}