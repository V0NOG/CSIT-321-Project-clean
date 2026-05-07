// frontend/src/pages/Explorer.tsx
import { useEffect, useRef, useState } from "react";
import PageMeta from "../components/common/PageMeta";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import { listFolders, createFolder, renameFolder, deleteFolder, moveFileToFolder, Folder } from "../api/foldersApi";
import { listMyFiles, encryptWrapAndUpload, downloadDecryptedBlob, renameFile, deleteFile, FileRow } from "../api/filesApi";
import ShareModal from "../components/file-manager/ShareModal";

// ── Context menu ─────────────────────────────────────────────────────────────
interface MenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  divider?: boolean;
}

interface MenuState {
  x: number;
  y: number;
  items: MenuItem[];
}

function ContextMenu({ menu, onClose }: { menu: MenuState; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  // Clamp to viewport
  const style: React.CSSProperties = {
    position: "fixed",
    top: Math.min(menu.y, window.innerHeight - 240),
    left: Math.min(menu.x, window.innerWidth - 200),
    zIndex: 9999,
  };

  return (
    <div
      ref={ref}
      style={style}
      className="min-w-[180px] rounded-xl border border-gray-200 bg-white py-1.5 shadow-xl dark:border-gray-700 dark:bg-gray-900"
    >
      {menu.items.map((item, i) => (
        <div key={i}>
          {item.divider && i > 0 && (
            <div className="my-1 border-t border-gray-100 dark:border-gray-800" />
          )}
          <button
            onClick={() => { item.onClick(); onClose(); }}
            className={`flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm transition-colors ${
              item.danger
                ? "text-error-600 hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-500/10"
                : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/[0.04]"
            }`}
          >
            {item.icon && <span className="w-4 h-4 flex-shrink-0">{item.icon}</span>}
            {item.label}
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Inline text edit ──────────────────────────────────────────────────────────
function InlineInput({
  initial,
  onConfirm,
  onCancel,
}: {
  initial: string;
  onConfirm: (v: string) => void;
  onCancel: () => void;
}) {
  const [val, setVal] = useState(initial);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.select(); }, []);
  return (
    <input
      ref={ref}
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onConfirm(val.trim());
        if (e.key === "Escape") onCancel();
      }}
      onBlur={() => onConfirm(val.trim())}
      className="w-full rounded border border-brand-300 bg-white px-2 py-0.5 text-sm focus:outline-none dark:bg-gray-800 dark:border-brand-700 dark:text-white"
      autoFocus
    />
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────
const IconFolder = ({ color = "#6B7280" }: { color?: string }) => (
  <svg viewBox="0 0 24 24" className="w-full h-full" fill={color}>
    <path d="M19.5 21a3 3 0 003-3v-4.5a3 3 0 00-3-3h-15a3 3 0 00-3 3V18a3 3 0 003 3h15zM1.5 10.146V6a3 3 0 013-3h5.379a2.25 2.25 0 011.59.659l2.122 2.121c.14.141.331.22.53.22H19.5a3 3 0 013 3v1.146A4.483 4.483 0 0019.5 9h-15a4.483 4.483 0 00-3 1.146z" />
  </svg>
);

const IconFile = ({ mime = "" }: { mime?: string }) => {
  const color = mime.startsWith("image/")
    ? "#a855f7"
    : mime.startsWith("video/")
    ? "#3b82f6"
    : mime.startsWith("audio/")
    ? "#ec4899"
    : "#6b7280";
  return (
    <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" stroke={color} strokeWidth={1.5}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
      />
    </svg>
  );
};

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

// ── Main Explorer component ───────────────────────────────────────────────────
export default function Explorer() {
  // Folders
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null); // null = All Files / root
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);

  // Files
  const [files, setFiles] = useState<FileRow[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [renamingFileId, setRenamingFileId] = useState<string | null>(null);

  // Upload
  const [uploading, setUploading] = useState(false);

  // New folder creation
  const [creatingFolder, setCreatingFolder] = useState(false);

  // Context menu
  const [menu, setMenu] = useState<MenuState | null>(null);

  // Share modal
  const [shareTarget, setShareTarget] = useState<{ id: string; name: string } | null>(null);

  // Move modal
  const [moveTarget, setMoveTarget] = useState<FileRow | null>(null);

  // Drag-and-drop
  const [dragOverFolderId, setDragOverFolderId] = useState<string | "root" | null>(null);

  // Error banner
  const [error, setError] = useState<string | null>(null);

  async function loadFolders() {
    try {
      const items = await listFolders();
      setFolders(items);
    } catch {
      // ignore
    }
  }

  async function loadFiles(folderId: string | null) {
    try {
      setLoadingFiles(true);
      const params: any = {};
      if (folderId === null) {
        params.folder = "null"; // root
      } else {
        params.folder = folderId;
      }
      const res = await listMyFiles({ ...params, limit: 200, sort: "createdAt:desc" });
      setFiles(res.items || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load files");
    } finally {
      setLoadingFiles(false);
    }
  }

  useEffect(() => {
    loadFolders();
    loadFiles(null);
    const handler = () => { loadFolders(); loadFiles(selectedFolderId); };
    window.addEventListener("files:refresh", handler);
    return () => window.removeEventListener("files:refresh", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadFiles(selectedFolderId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFolderId]);

  function openMenu(e: React.MouseEvent, items: MenuItem[]) {
    e.preventDefault();
    e.stopPropagation();
    setMenu({ x: e.clientX, y: e.clientY, items });
  }

  // ── Upload ──
  async function handleUpload() {
    return new Promise<void>((resolve, reject) => {
      const picker = document.createElement("input");
      picker.type = "file";
      picker.multiple = true;
      picker.accept = "*/*";
      picker.onchange = async () => {
        const picked = Array.from(picker.files || []);
        if (!picked.length) return resolve();
        setUploading(true);
        try {
          for (const f of picked) {
            const { fileId } = await encryptWrapAndUpload(f);
            if (selectedFolderId) {
              await moveFileToFolder(fileId, selectedFolderId).catch(() => {});
            }
          }
          window.dispatchEvent(new CustomEvent("files:refresh"));
          resolve();
        } catch (e: any) {
          setError(e?.message || "Upload failed");
          reject(e);
        } finally {
          setUploading(false);
        }
      };
      picker.click();
    });
  }

  // ── Download ──
  async function handleDownload(f: FileRow) {
    try {
      const blob = await downloadDecryptedBlob(f);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = f.name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e?.message || "Download failed");
    }
  }

  // ── Create folder ──
  async function handleCreateFolder(name: string) {
    setCreatingFolder(false);
    if (!name) return;
    try {
      await createFolder(name);
      await loadFolders();
      window.dispatchEvent(new CustomEvent("files:refresh"));
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || "Failed to create folder");
    }
  }

  // ── Rename folder ──
  async function handleRenameFolder(id: string, name: string) {
    setRenamingFolderId(null);
    if (!name) return;
    try {
      await renameFolder(id, name);
      await loadFolders();
      window.dispatchEvent(new CustomEvent("files:refresh"));
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || "Failed to rename");
    }
  }

  // ── Delete folder ──
  async function handleDeleteFolder(id: string) {
    if (!confirm("Delete this folder? Files inside will be moved to All Files.")) return;
    try {
      await deleteFolder(id);
      if (selectedFolderId === id) setSelectedFolderId(null);
      await loadFolders();
      window.dispatchEvent(new CustomEvent("files:refresh"));
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || "Failed to delete folder");
    }
  }

  // ── Rename file ──
  async function handleRenameFile(id: string, name: string) {
    setRenamingFileId(null);
    if (!name) return;
    try {
      await renameFile(id, name);
      await loadFiles(selectedFolderId);
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || "Failed to rename");
    }
  }

  // ── Delete file ──
  async function handleDeleteFile(f: FileRow) {
    if (!confirm(`Delete "${f.name}"? This cannot be undone.`)) return;
    try {
      await deleteFile(f._id);
      window.dispatchEvent(new CustomEvent("files:refresh"));
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || "Failed to delete");
    }
  }

  // ── Move file ──
  async function handleMoveFile(fileId: string, folderId: string | null) {
    setMoveTarget(null);
    try {
      await moveFileToFolder(fileId, folderId);
      await loadFiles(selectedFolderId);
      window.dispatchEvent(new CustomEvent("files:refresh"));
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || "Failed to move");
    }
  }

  // ── Context menu builders ──
  function folderMenu(f: Folder): MenuItem[] {
    return [
      {
        label: "Rename",
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" /></svg>,
        onClick: () => setRenamingFolderId(f._id),
      },
      {
        label: "Delete Folder",
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>,
        danger: true,
        onClick: () => handleDeleteFolder(f._id),
      },
    ];
  }

  function fileMenu(f: FileRow): MenuItem[] {
    return [
      {
        label: "Download",
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>,
        onClick: () => handleDownload(f),
      },
      {
        label: "Rename",
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" /></svg>,
        onClick: () => setRenamingFileId(f._id),
      },
      {
        label: "Move to…",
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" /></svg>,
        onClick: () => setMoveTarget(f),
      },
      {
        label: "Share",
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" /></svg>,
        onClick: () => setShareTarget({ id: f._id, name: f.name }),
      },
      {
        label: "Delete",
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>,
        danger: true,
        divider: true,
        onClick: () => handleDeleteFile(f),
      },
    ];
  }

  function emptyAreaMenu(): MenuItem[] {
    return [
      {
        label: "Upload File",
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>,
        onClick: handleUpload,
      },
      {
        label: "New Folder",
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10.5v6m3-3H9m4.06-7.19l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" /></svg>,
        onClick: () => setCreatingFolder(true),
      },
    ];
  }

  const selectedFolderName = folders.find((f) => f._id === selectedFolderId)?.name || "All Files";

  return (
    <>
      <PageMeta title="File Explorer" description="Browse, organize, and manage your encrypted files." />
      <PageBreadcrumb pageTitle="Explorer" />

      {/* Context menu */}
      {menu && <ContextMenu menu={menu} onClose={() => setMenu(null)} />}

      {/* Share modal */}
      {shareTarget && (
        <ShareModal
          open={!!shareTarget}
          onClose={() => setShareTarget(null)}
          fileId={shareTarget.id}
          fileName={shareTarget.name}
          onShared={() => setShareTarget(null)}
        />
      )}

      {/* Move file modal */}
      {moveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-72 rounded-2xl border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-800 dark:bg-gray-900">
            <h4 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">
              Move "{moveTarget.name}" to…
            </h4>
            <div className="space-y-1">
              <button
                onClick={() => handleMoveFile(moveTarget._id, null)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/[0.06]"
              >
                <span className="w-4 h-4 flex items-center justify-center opacity-60">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                  </svg>
                </span>
                All Files (root)
              </button>
              {folders.map((f) => (
                <button
                  key={f._id}
                  onClick={() => handleMoveFile(moveTarget._id, f._id)}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/[0.06]"
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: f.color }} />
                  {f.name}
                </button>
              ))}
            </div>
            <button
              onClick={() => setMoveTarget(null)}
              className="mt-3 w-full rounded-lg border border-gray-200 py-2 text-sm text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/[0.04]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-500/10 dark:text-error-400">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-2 text-error-500 hover:text-error-700">×</button>
        </div>
      )}

      <div className="flex h-[calc(100vh-160px)] gap-4 overflow-hidden">
        {/* ── Left panel: folder tree ── */}
        <aside
          className="w-56 flex-shrink-0 overflow-y-auto rounded-2xl border border-gray-200 bg-white py-3 dark:border-gray-800 dark:bg-white/[0.03]"
          onContextMenu={(e) => {
            openMenu(e, [
              { label: "New Folder", onClick: () => setCreatingFolder(true) },
            ]);
          }}
        >
          <div className="px-4 mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-gray-400 dark:text-gray-500">Folders</span>
            <button
              title="New Folder"
              onClick={() => setCreatingFolder(true)}
              className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/[0.06]"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
          </div>

          {/* All Files */}
          <button
            onClick={() => setSelectedFolderId(null)}
            onDragOver={(e) => { e.preventDefault(); setDragOverFolderId("root"); }}
            onDragLeave={() => setDragOverFolderId(null)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverFolderId(null);
              const fileId = e.dataTransfer.getData("fileId");
              if (fileId) handleMoveFile(fileId, null);
            }}
            className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 mx-1 text-sm transition-colors ${
              dragOverFolderId === "root"
                ? "ring-2 ring-brand-400 bg-brand-50 dark:bg-brand-500/10"
                : selectedFolderId === null
                ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/[0.04]"
            }`}
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            <span className="truncate">All Files</span>
          </button>

          {/* User folders */}
          <div className="mt-1 space-y-0.5 px-1">
            {creatingFolder && (
              <div className="flex items-center gap-2 rounded-lg px-3 py-1.5">
                <span className="w-2 h-2 rounded-full bg-gray-300 flex-shrink-0" />
                <InlineInput
                  initial=""
                  onConfirm={handleCreateFolder}
                  onCancel={() => setCreatingFolder(false)}
                />
              </div>
            )}
            {folders.map((f) => (
              <div
                key={f._id}
                onContextMenu={(e) => openMenu(e, folderMenu(f))}
              >
                {renamingFolderId === f._id ? (
                  <div className="flex items-center gap-2 rounded-lg px-3 py-1.5">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: f.color }} />
                    <InlineInput
                      initial={f.name}
                      onConfirm={(name) => handleRenameFolder(f._id, name)}
                      onCancel={() => setRenamingFolderId(null)}
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => setSelectedFolderId(f._id)}
                    onDoubleClick={() => setRenamingFolderId(f._id)}
                    onDragOver={(e) => { e.preventDefault(); setDragOverFolderId(f._id); }}
                    onDragLeave={() => setDragOverFolderId(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOverFolderId(null);
                      const fileId = e.dataTransfer.getData("fileId");
                      if (fileId) handleMoveFile(fileId, f._id);
                    }}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                      dragOverFolderId === f._id
                        ? "ring-2 ring-brand-400 bg-brand-50 dark:bg-brand-500/10"
                        : selectedFolderId === f._id
                        ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                        : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/[0.04]"
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: f.color }}
                    />
                    <span className="truncate">{f.name}</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </aside>

        {/* ── Right panel: file grid ── */}
        <main
          className="flex-1 overflow-y-auto rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]"
          onContextMenu={(e) => {
            if ((e.target as HTMLElement).closest("[data-file-card]")) return;
            openMenu(e, emptyAreaMenu());
          }}
        >
          {/* Header */}
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {selectedFolderName}
              {files.length > 0 && (
                <span className="ml-2 text-xs font-normal text-gray-400">{files.length} item{files.length !== 1 ? "s" : ""}</span>
              )}
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleUpload}
                disabled={uploading}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-colors ${
                  uploading ? "bg-gray-400 cursor-not-allowed" : "bg-brand-500 hover:bg-brand-600"
                }`}
              >
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                {uploading ? "Uploading…" : "Upload"}
              </button>
            </div>
          </div>

          {/* File grid */}
          {loadingFiles ? (
            <div className="flex items-center justify-center py-20 text-sm text-gray-400">Loading…</div>
          ) : files.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-24 text-center"
              onContextMenu={(e) => { e.stopPropagation(); openMenu(e, emptyAreaMenu()); }}
            >
              <svg className="w-12 h-12 text-gray-300 dark:text-gray-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <p className="text-sm text-gray-400 dark:text-gray-500">No files here yet</p>
              <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">Right-click to upload or create a folder</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {files.map((f) => (
                <div
                  key={f._id}
                  data-file-card="true"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("fileId", f._id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onContextMenu={(e) => openMenu(e, fileMenu(f))}
                  onDoubleClick={() => handleDownload(f)}
                  className="group relative flex flex-col items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 p-3 cursor-pointer select-none transition-all hover:border-brand-200 hover:bg-brand-50 dark:border-gray-800 dark:bg-white/[0.02] dark:hover:border-brand-700 dark:hover:bg-brand-500/5"
                  title={`${f.name}\n${formatBytes(f.size)}\n${formatDate(f.createdAt)}`}
                >
                  {renamingFileId === f._id ? (
                    <div className="w-full">
                      <div className="w-10 h-10 mx-auto mb-1 opacity-50">
                        <IconFile mime={f.mime} />
                      </div>
                      <InlineInput
                        initial={f.name}
                        onConfirm={(name) => handleRenameFile(f._id, name)}
                        onCancel={() => setRenamingFileId(null)}
                      />
                    </div>
                  ) : (
                    <>
                      <div className="w-10 h-10">
                        <IconFile mime={f.mime} />
                      </div>
                      <span className="w-full truncate text-center text-xs text-gray-700 dark:text-gray-300">
                        {f.name}
                      </span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-600">
                        {formatBytes(f.size)}
                      </span>
                    </>
                  )}

                  {/* Quick action buttons on hover */}
                  {renamingFileId !== f._id && (
                    <div className="absolute top-1.5 right-1.5 hidden group-hover:flex gap-1">
                      <button
                        title="Download"
                        onClick={(e) => { e.stopPropagation(); handleDownload(f); }}
                        className="flex h-6 w-6 items-center justify-center rounded-md bg-white/80 text-gray-500 shadow-sm hover:text-brand-500 dark:bg-gray-800/80"
                      >
                        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                      </button>
                      <button
                        title="More"
                        onClick={(e) => openMenu(e, fileMenu(f))}
                        className="flex h-6 w-6 items-center justify-center rounded-md bg-white/80 text-gray-500 shadow-sm hover:text-brand-500 dark:bg-gray-800/80"
                      >
                        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor">
                          <path d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
