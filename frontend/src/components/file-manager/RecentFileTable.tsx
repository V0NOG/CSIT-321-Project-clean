import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { ArrowRightIcon } from "../../icons";
import { useFiles } from "../../hooks/useFiles";
import { downloadDecryptedBlob } from "../../api/filesApi";

function fmtBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  const u = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(u.length - 1, Math.floor(Math.log(bytes || 1) / Math.log(1024)));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${u[i]}`;
}

export default function RecentFileTable() {
  const {
    items, total, page, limit, loading,
    setPage, setLimit, setQuery, setSort, setType
  } = useFiles({ page: 1, limit: 10, sort: "createdAt:desc" });

  const files = items || [];
  const [q, setQ] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setQuery(q), 300);
    return () => clearTimeout(t);
  }, [q, setQuery]);

  const pageCount = useMemo(
    () => Math.max(1, Math.ceil((total || 0) / (limit || 10))),
    [total, limit]
  );

  const canPrev = page > 1;
  const canNext = page < pageCount;

  async function onDownload(id: string, name: string, mime?: string) {
    const plainBlob = await downloadDecryptedBlob(id, mime);
    const url = URL.createObjectURL(plainBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white pt-4 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex flex-col gap-3 px-6 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Recent Files</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{total} total</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            type="text"
            placeholder="Search files…"
            className="dark:bg-dark-900 h-10 w-[220px] rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
          />

          {/* Type filter */}
          <select
            onChange={(e) => setType(e.target.value || undefined)}
            className="h-10 rounded-lg border border-gray-300 bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            defaultValue=""
          >
            <option value="">All Types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="audio">Audios</option>
            <option value="document">Documents</option>
            <option value="app">Apps</option>
            <option value="other">Other</option>
          </select>

          {/* Page size */}
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="h-10 rounded-lg border border-gray-300 bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          >
            {[10, 20, 50].map((n) => (
              <option key={n} value={n}>{n} / page</option>
            ))}
          </select>

          {/* Sort */}
          <select
            onChange={(e) => setSort(e.target.value)}
            className="h-10 rounded-lg border border-gray-300 bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            defaultValue="createdAt:desc"
          >
            <option value="createdAt:desc">Newest</option>
            <option value="createdAt:asc">Oldest</option>
            <option value="name:asc">Name A–Z</option>
            <option value="name:desc">Name Z–A</option>
            <option value="size:desc">Size ↓</option>
            <option value="size:asc">Size ↑</option>
          </select>

          <Link
            to="/"
            className="hidden sm:inline-flex items-center gap-2 text-gray-500 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-500"
          >
            View All
            <ArrowRightIcon />
          </Link>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto">
        <table className="w-full border-collapse table-auto">
          <thead>
            <tr className="border-t border-gray-200 dark:border-gray-800">
              <th className="px-6 py-3 font-medium text-left text-gray-500 text-theme-sm dark:text-gray-400">File Name</th>
              <th className="px-6 py-3 font-medium text-left text-gray-500 text-theme-sm dark:text-gray-400">Type</th>
              <th className="px-6 py-3 font-medium text-left text-gray-500 text-theme-sm dark:text-gray-400">Size</th>
              <th className="px-6 py-3 font-medium text-left text-gray-500 text-theme-sm dark:text-gray-400">Date Modified</th>
              <th className="px-6 py-3 font-medium text-center text-gray-500 text-theme-sm dark:text-gray-400">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td className="px-6 py-4 text-gray-500" colSpan={5}>Loading…</td></tr>
            )}
            {!loading && files.length === 0 && (
              <tr><td className="px-6 py-4 text-gray-500" colSpan={5}>No files</td></tr>
            )}
            {files.map((row: any) => (
              <tr key={row._id} className="border-t border-gray-100 dark:border-gray-800">
                <td className="px-6 py-[18px] text-sm text-gray-700 dark:text-gray-400">{row.name}</td>
                <td className="px-6 py-[18px] text-gray-700 text-theme-sm dark:text-gray-400">{row.mime || "-"}</td>
                <td className="px-6 py-[18px] text-gray-700 text-theme-sm dark:text-gray-400">{fmtBytes(Number(row.size))}</td>
                <td className="px-6 py-[18px] text-gray-700 text-theme-sm dark:text-gray-400">
                  {row.createdAt ? new Date(row.createdAt).toLocaleString() : "—"}
                </td>
                <td className="px-6 py-[18px] text-center">
                  <button
                    onClick={() => onDownload(row._id, row.name, row.mime)}
                    className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90"
                  >
                    Download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* pager */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-800">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Page {page} of {pageCount}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => canPrev && setPage(page - 1)}
            disabled={!canPrev}
            className={`px-3 py-1.5 text-sm rounded-lg border shadow-theme-xs ${
              canPrev ? "text-gray-700 border-gray-300 hover:bg-gray-50 dark:text-white/80 dark:border-gray-700 dark:hover:bg-white/5"
                     : "text-gray-400 border-gray-200 dark:border-gray-800 cursor-not-allowed"
            }`}
          >
            Prev
          </button>
          <button
            onClick={() => canNext && setPage(page + 1)}
            disabled={!canNext}
            className={`px-3 py-1.5 text-sm rounded-lg border shadow-theme-xs ${
              canNext ? "text-gray-700 border-gray-300 hover:bg-gray-50 dark:text-white/80 dark:border-gray-700 dark:hover:bg-white/5"
                      : "text-gray-400 border-gray-200 dark:border-gray-800 cursor-not-allowed"
            }`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}