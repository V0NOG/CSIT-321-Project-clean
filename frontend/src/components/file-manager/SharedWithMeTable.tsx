// frontend/src/components/file-manager/SharedWithMeTable.tsx
import { useEffect, useMemo, useState } from "react";
import Alert from "../ui/alert/Alert";
import Button from "../ui/button/Button";
import { downloadDecryptedBlob, renameFile as apiRenameFile, deleteFile as apiDeleteFile } from "../../api/filesApi";
import { listSharedFiles } from "../../api/filesApi";
import ShareModal from "./ShareModal";

function fmtBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  const u = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(u.length - 1, Math.floor(Math.log(bytes || 1) / Math.log(1024)));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${u[i]}`;
}

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
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M12 3v10m0 0l4-4m-4 4l-4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const EditSvg = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M12 20h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" fill="none" />
  </svg>
);
const TrashSvg = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m1 0l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m3 0v14m4-14v14m4-14v14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const SaveSvg = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const CancelSvg = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const ShareSvg = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M15 8a3 3 0 100-6 3 3 0 000 6zM6 15a3 3 0 100-6 3 3 0 000 6zM18 22a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeWidth="1.8" />
    <path d="M7.59 12.51l6.82-3.34M13.41 14.83l3.18 1.56" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

type AlertState = { kind: "none" } | { kind: "success" | "warning" | "error" | "info"; title: string; message: string };

export default function SharedWithMeTable() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [alert, setAlert] = useState<AlertState>({ kind: "none" });

  // inline edit/delete modal
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>("");

  // share modal
  const [shareOpen, setShareOpen] = useState(false);
  const [shareFile, setShareFile] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await listSharedFiles();
        setItems(data?.items || data || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((f) => (f.name || "").toLowerCase().includes(s));
  }, [items, q]);

  function showAlert(kind: AlertState["kind"], title: string, message: string) {
    if (kind === "none") return setAlert({ kind: "none" });
    setAlert({ kind, title, message } as any);
    if (kind === "success" || kind === "info") {
      setTimeout(() => setAlert({ kind: "none" }), 2500);
    }
  }

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
    if (!next || next === row.name) return cancelEdit();
    try {
      await apiRenameFile(row._id, next);
      showAlert("success", "Renamed", `“${row.name}” → “${next}”`);
      setItems((prev) => prev.map((x) => (x._id === row._id ? { ...x, name: next } : x)));
      cancelEdit();
    } catch (e: any) {
      showAlert("error", "Rename failed", e?.message || "Could not rename the file.");
    }
  }

  async function doDelete(row: any) {
    try {
      await apiDeleteFile(row._id);
      showAlert("success", "Deleted", `“${row.name}” has been removed.`);
      setItems((prev) => prev.filter((x) => x._id !== row._id));
    } catch (e: any) {
      showAlert("error", "Delete failed", e?.message || "Could not delete the file.");
    }
  }

  function openShare(row: any) {
    setShareFile(row);
    setShareOpen(true);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white pt-4 dark:border-gray-800 dark:bg-white/[0.03]">
      {alert.kind !== "none" && (
        <div className="px-6 mb-3">
          <Alert variant={alert.kind as any} title={"title" in alert ? alert.title : ""} message={"message" in alert ? alert.message : ""} showLink={false} />
        </div>
      )}

      <div className="flex flex-col gap-3 px-6 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text:white/90">Shared with Me</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{items.length} total</p>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          type="text"
          placeholder="Search files…"
          className="h-10 w-[220px] rounded-lg border border-gray-300 bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
        />
      </div>

      <div className="max-w-full overflow-x-auto">
        <table className="w-full border-collapse table-auto">
          <thead>
            <tr className="border-t border-gray-200 dark:border-gray-800">
              <th className="px-6 py-3 text-left text-gray-500 text-theme-sm dark:text-gray-400">File Name</th>
              <th className="px-6 py-3 text-left text-gray-500 text-theme-sm dark:text-gray-400">Type</th>
              <th className="px-6 py-3 text-left text-gray-500 text-theme-sm dark:text-gray-400">Size</th>
              <th className="px-6 py-3 text-left text-gray-500 text-theme-sm dark:text-gray-400">Date Added</th>
              <th className="px-6 py-3 text-left text-gray-500 text-theme-sm dark:text-gray-400">Action</th>
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
            {!loading && filtered.length === 0 && (
              <tr>
                <td className="px-6 py-4 text-gray-500" colSpan={5}>
                  No files
                </td>
              </tr>
            )}
            {filtered.map((row) => {
              const isEditing = editingId === row._id;
              const canEdit = row?.permission === "editor"; // only allow if editor
              return (
                <tr key={row._id} className="border-t border-gray-100 dark:border-gray-800">
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
                  <td className="px-6 py-[18px] text-theme-sm text-gray-700 dark:text-gray-400">{row.mime || "-"}</td>
                  <td className="px-6 py-[18px] text-theme-sm text-gray-700 dark:text-gray-400">{fmtBytes(Number(row.size))}</td>
                  <td className="px-6 py-[18px] text-theme-sm text-gray-700 dark:text-gray-400">{row.createdAt ? new Date(row.createdAt).toLocaleString() : "—"}</td>
                  <td className="px-6 py-[12px]">
                    <div className="inline-flex items-center gap-1.5">
                      <IconBtn title="Download" onClick={() => onDownload(row._id, row.name, row.mime)}>
                        <DownloadSvg />
                      </IconBtn>

                      {isEditing ? (
                        <>
                          <IconBtn title="Save" onClick={() => saveEdit(row)} disabled={!canEdit}>
                            <SaveSvg />
                          </IconBtn>
                          <IconBtn title="Cancel" onClick={cancelEdit}>
                            <CancelSvg />
                          </IconBtn>
                        </>
                      ) : (
                        <IconBtn title="Rename" onClick={() => (canEdit ? startEdit(row) : undefined)} disabled={!canEdit}>
                          <EditSvg />
                        </IconBtn>
                      )}

                      <IconBtn title="Share" onClick={() => openShare(row)}>
                        <ShareSvg />
                      </IconBtn>

                      <IconBtn title="Delete" onClick={() => (canEdit ? doDelete(row) : undefined)} disabled={!canEdit}>
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

      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        fileId={shareFile?._id || ""}
        fileName={shareFile?.name || ""}
        onShared={(msg) => {
          if (msg) showAlert("success", "Shared", msg);
        }}
      />
    </div>
  );
}