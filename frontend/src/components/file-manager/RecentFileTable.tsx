// frontend/src/components/file-manager/RecentFileTable.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRightIcon } from "../../icons";
import { useFiles } from "../../hooks/useFiles";
import { downloadDecryptedBlob, renameFile as apiRenameFile, deleteFile as apiDeleteFile } from "../../api/filesApi";
import Alert from "../ui/alert/Alert";
import ShareModal from "./ShareModal"; // ⬅️ ensure path is correct

function fmtBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  const u = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(u.length - 1, Math.floor(Math.log(bytes || 1) / Math.log(1024)));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${u[i]}`;
}

// Small icon buttons
const IconBtn = ({ title, onClick, children, disabled }: any) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    disabled={disabled}
    className={`p-2 rounded-md text-gray-500 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white/90 dark:hover:bg-white/5 ${
      disabled ? "opacity-50 cursor-not-allowed" : ""
    }`}
  >
    {children}
  </button>
);

const DownloadSvg = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M12 3v10m0 0l4-4m-4 4l-4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const EditSvg = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M12 20h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" fill="none" />
  </svg>
);
const TrashSvg = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m1 0l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m3 0v14m4-14v14m4-14v14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const SaveSvg = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const CancelSvg = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
// NEW: Share icon
const ShareSvg = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M15 8a3 3 0 100-6 3 3 0 000 6zM6 15a3 3 0 100-6 3 3 0 000 6zM18 22a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7.59 12.51l6.82-3.34M13.41 14.83l3.18 1.56" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

type AlertState = { kind: "none" } | { kind: "success" | "warning" | "error" | "info"; title: string; message: string };

export default function RecentFileTable({
  initialType,
  headerTitle,
  folderId,
}: {
  initialType?: string;
  headerTitle?: string;
  folderId?: string;
}) {
  const { items, total, page, limit, loading, setPage, setLimit, setQuery, setSort, setType, refresh } = useFiles({
    page: 1,
    limit: 10,
    sort: "createdAt:desc",
    type: initialType,
    folder: folderId,
  });

  const files = items || [];
  const [q, setQ] = useState("");

  // inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>("");

  // delete confirm state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteName, setConfirmDeleteName] = useState<string>("");

  // top alert state
  const [alert, setAlert] = useState<AlertState>({ kind: "none" });

  // NEW: Share modal state
  const [shareOpen, setShareOpen] = useState(false);
  const [shareFile, setShareFile] = useState<any | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setQuery(q), 300);
    return () => clearTimeout(t);
  }, [q, setQuery]);

  const pageCount = useMemo(() => Math.max(1, Math.ceil((total || 0) / (limit || 10))), [total, limit]);
  const canPrev = page > 1;
  const canNext = page < pageCount;

  function showAlert(kind: AlertState["kind"], title: string, message: string) {
    if (kind === "none") return setAlert({ kind: "none" });
    setAlert({ kind, title, message } as any);
    if (kind === "success" || kind === "info") {
      setTimeout(() => setAlert({ kind: "none" }), 2500);
    }
  }

  // -------- Actions --------
  async function onDownload(id: string, name: string, mime?: string) {
    try {
      const blob = await downloadDecryptedBlob({ _id: id, name, mime: mime || "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      console.error(e);
      showAlert("error", "Download failed", e?.message || "Unable to download this file.");
    }
  }

  function startEdit(row: any) {
    setEditingId(row._id);
    setEditingName(row.name);
  }
  function cancelEdit() {
    setEditingId(null);
    setEditingName("");
  }
  async function saveEdit(row: any) {
    const next = editingName.trim();
    if (!next || next === row.name) {
      cancelEdit();
      return;
    }
    try {
      await apiRenameFile(row._id, next);
      showAlert("success", "Renamed", `“${row.name}” → “${next}”`);
      cancelEdit();
      refresh();
    } catch (e: any) {
      console.error(e);
      showAlert("error", "Rename failed", e?.message || "Could not rename the file.");
    }
  }

  function askDelete(row: any) {
    setConfirmDeleteId(row._id);
    setConfirmDeleteName(row.name);
    showAlert("warning", "Delete file?", `This action cannot be undone: “${row.name}”`);
  }
  function cancelDelete() {
    setConfirmDeleteId(null);
    setConfirmDeleteName("");
    setAlert({ kind: "none" });
  }
  async function doDelete() {
    if (!confirmDeleteId) return;
    try {
      await apiDeleteFile(confirmDeleteId);
      showAlert("success", "Deleted", `“${confirmDeleteName}” has been removed.`);
      setConfirmDeleteId(null);
      setConfirmDeleteName("");
      refresh();
    } catch (e: any) {
      console.error(e);
      showAlert("error", "Delete failed", e?.message || "Could not delete the file.");
    }
  }

  // NEW: open share modal for a specific file
  function openShare(row: any) {
    setShareFile(row);
    setShareOpen(true);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white pt-4 dark:border-gray-800 dark:bg-white/[0.03]">
      {/* Top Alert (delete confirm / success / error) */}
      {alert.kind !== "none" && (
        <div className="px-6">
          <div className="mb-3">
            <Alert variant={alert.kind as any} title={"title" in alert ? alert.title : ""} message={"message" in alert ? alert.message : ""} showLink={false} />
          </div>

          {/* If this is a delete confirmation, show actions */}
          {alert.kind === "warning" && confirmDeleteId && (
            <div className="mb-4 -mt-2 flex items-center gap-3 px-2">
              <button
                type="button"
                onClick={doDelete}
                className="inline-flex items-center justify-center rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 shadow-theme-xs"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={cancelDelete}
                className="inline-flex items-center justify-center rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-white/80 dark:border-gray-700 dark:hover:bg-white/5"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3 px-6 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">{headerTitle || "Recent Files"}</h3>
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
              <option key={n} value={n}>
                {n} / page
              </option>
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

          <Link to="/file-manager" className="hidden sm:inline-flex items-center gap-2 text-gray-500 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-500">
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
              <th className="px-6 py-3 font-medium text-left text-gray-500 text-theme-sm dark:text-gray-400">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td className="px-6 py-4 text-gray-500" colSpan={5}>
                  Loading…
                </td>
              </tr>
            )}
            {!loading && files.length === 0 && (
              <tr>
                <td className="px-6 py-4 text-gray-500" colSpan={5}>
                  No files
                </td>
              </tr>
            )}
            {files.map((row: any) => {
              const isEditing = editingId === row._id;
              return (
                <tr key={row._id} className="border-t border-gray-100 dark:border-gray-800">
                  {/* Name cell: inline edit */}
                  <td className="px-6 py-[18px] text-sm text-gray-700 dark:text-gray-400">
                    {isEditing ? (
                      <input
                        autoFocus
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit(row);
                          if (e.key === "Escape") cancelEdit();
                        }}
                        className="h-9 w-full rounded-md border border-gray-300 bg-transparent px-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                      />
                    ) : (
                      row.name
                    )}
                  </td>

                  <td className="px-6 py-[18px] text-gray-700 text-theme-sm dark:text-gray-400">{row.mime || "-"}</td>
                  <td className="px-6 py-[18px] text-gray-700 text-theme-sm dark:text-gray-400">{fmtBytes(Number(row.size))}</td>
                  <td className="px-6 py-[18px] text-gray-700 text-theme-sm dark:text-gray-400">{row.createdAt ? new Date(row.createdAt).toLocaleString() : "—"}</td>

                  {/* Action cell */}
                  <td className="px-6 py-[12px]">
                    <div className="inline-flex items-center gap-1.5">
                      {/* Download */}
                      <IconBtn title="Download" onClick={() => onDownload(row._id, row.name, row.mime)}>
                        <DownloadSvg />
                      </IconBtn>

                      {/* Edit / Save / Cancel */}
                      {isEditing ? (
                        <>
                          <IconBtn title="Save" onClick={() => saveEdit(row)}>
                            <SaveSvg />
                          </IconBtn>
                          <IconBtn title="Cancel" onClick={cancelEdit}>
                            <CancelSvg />
                          </IconBtn>
                        </>
                      ) : (
                        <IconBtn title="Rename" onClick={() => startEdit(row)}>
                          <EditSvg />
                        </IconBtn>
                      )}

                      {/* NEW: Share */}
                      <IconBtn title="Share" onClick={() => openShare(row)}>
                        <ShareSvg />
                      </IconBtn>

                      {/* Delete */}
                      <IconBtn title="Delete" onClick={() => askDelete(row)} disabled={!!confirmDeleteId && confirmDeleteId !== row._id}>
                        <TrashSvg />
                      </IconBtn>
                    </div>
                  </td>
                </tr>
              );
            })}
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
              canPrev
                ? "text-gray-700 border-gray-300 hover:bg-gray-50 dark:text-white/80 dark:border-gray-700 dark:hover:bg-white/5"
                : "text-gray-400 border-gray-200 dark:border-gray-800 cursor-not-allowed"
            }`}
          >
            Prev
          </button>
          <button
            onClick={() => canNext && setPage(page + 1)}
            disabled={!canNext}
            className={`px-3 py-1.5 text-sm rounded-lg border shadow-theme-xs ${
              canNext
                ? "text-gray-700 border-gray-300 hover:bg-gray-50 dark:text-white/80 dark:border-gray-700 dark:hover:bg-white/5"
                : "text-gray-400 border-gray-200 dark:border-gray-800 cursor-not-allowed"
            }`}
          >
            Next
          </button>
        </div>
      </div>

      {/* NEW: Share Modal mount */}
      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        fileId={shareFile?._id || ""}
        fileName={shareFile?.name || ""}
        onShared={(msg) => {
          if (msg) showAlert("success", "Shared", msg);
          else showAlert("success", "Shared", "Share request sent to recipient.");
          refresh();
        }}
      />
    </div>
  );
}