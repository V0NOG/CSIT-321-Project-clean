import { useEffect, useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { MoreDotIcon } from "../../icons";
import { fetchAnalyticsSummary } from "../../api/analyticsApi";

export default function TopChannel() {
  const [isOpen, setIsOpen] = useState(false);
  const [rows, setRows] = useState<{ label: string; value: number }[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const s = await fetchAnalyticsSummary();
        const map = s.topActions30d || {};
        const order = ["upload","download","acl:upsert","acl:remove","login"];
        setRows(order.map(k => ({ label: k, value: map[k] || 0 })));
      } catch {
        // silently ignore
      }
    })();
  }, []);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div className="flex items-start justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Top Actions (30d)</h3>
        <div className="relative inline-block">
          <button className="dropdown-toggle" onClick={()=>setIsOpen(!isOpen)}>
            <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 size-6" />
          </button>
          <Dropdown isOpen={isOpen} onClose={()=>setIsOpen(false)} className="w-40 p-2">
            <DropdownItem onItemClick={()=>setIsOpen(false)} className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5">View More</DropdownItem>
          </Dropdown>
        </div>
      </div>

      <div className="my-6">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
          <span className="text-gray-400 text-theme-xs"> Action </span>
          <span className="text-right text-gray-400 text-theme-xs"> Count </span>
        </div>

        {rows.map((r,i)=>(
          <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
            <span className="text-gray-500 text-theme-sm dark:text-gray-400">{r.label}</span>
            <span className="text-right text-gray-500 text-theme-sm dark:text-gray-400">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}