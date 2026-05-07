// frontend/src/components/file-manager/AllFolders.tsx
import { Link } from "react-router";
import { useEffect, useMemo, useState } from "react";
import FolderCard from "./FolderCard";
import { useFiles } from "../../hooks/useFiles";
import { categorize, fmtBytes } from "../../utils/storage";
import { listSharedFiles } from "../../api/filesApi";
import { listFolders, createFolder, deleteFolder, Folder } from "../../api/foldersApi";

type Bucket = { count: number; bytes: number };

export default function AllFolders() {
  const { items: files } = useFiles({ page: 1, limit: 1000, sort: "createdAt:desc" });

  // Shared files count
  const [shared, setShared] = useState<Bucket>({ count: 0, bytes: 0 });

  // User-created folders
  const [userFolders, setUserFolders] = useState<Folder[]>([]);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderColor, setNewFolderColor] = useState("#6B7280");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  async function loadShared() {
    try {
      const res = await listSharedFiles();
      const items = (res?.items ?? res ?? []) as Array<{ size?: number }>;
      setShared({ count: items.length, bytes: items.reduce((n, f) => n + (Number(f?.size) || 0), 0) });
    } catch {
      setShared({ count: 0, bytes: 0 });
    }
  }

  async function loadFolders() {
    try {
      const items = await listFolders();
      setUserFolders(items);
    } catch {
      setUserFolders([]);
    }
  }

  useEffect(() => {
    loadShared();
    loadFolders();
    const onRefresh = () => { loadShared(); loadFolders(); };
    window.addEventListener("files:refresh", onRefresh);
    return () => window.removeEventListener("files:refresh", onRefresh);
  }, []);

  const buckets = useMemo(() => {
    const out: Record<"Images" | "Documents" | "Apps" | "Other", Bucket> = {
      Images: { count: 0, bytes: 0 },
      Documents: { count: 0, bytes: 0 },
      Apps: { count: 0, bytes: 0 },
      Other: { count: 0, bytes: 0 },
    };
    for (const f of files || []) {
      const size = Number(f.size) || 0;
      const cat = categorize(f.mime, f.name);
      if (cat === "Images") { out.Images.bytes += size; out.Images.count++; }
      else if (cat === "Documents") { out.Documents.bytes += size; out.Documents.count++; }
      else if (cat === "Apps") { out.Apps.bytes += size; out.Apps.count++; }
      else { out.Other.bytes += size; out.Other.count++; }
    }
    return out;
  }, [files]);

  async function handleCreateFolder() {
    const name = newFolderName.trim();
    if (!name) { setError("Name is required"); return; }
    setCreating(true);
    setError("");
    try {
      await createFolder(name, newFolderColor);
      setNewFolderName("");
      setNewFolderColor("#6B7280");
      setShowNewFolder(false);
      await loadFolders();
      window.dispatchEvent(new CustomEvent("files:refresh"));
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || "Failed to create folder");
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteFolder(id: string) {
    if (!confirm("Delete this folder? Files inside will be moved to the root.")) return;
    try {
      await deleteFolder(id);
      await loadFolders();
      window.dispatchEvent(new CustomEvent("files:refresh"));
    } catch {
      alert("Failed to delete folder");
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="px-4 py-4 sm:pl-6 sm:pr-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">All Folders</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setShowNewFolder(true); setError(""); }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
            >
              <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path fillRule="evenodd" clipRule="evenodd" d="M9.2502 4.99951C9.2502 4.5853 9.58599 4.24951 10.0002 4.24951C10.4144 4.24951 10.7502 4.5853 10.7502 4.99951V9.24971H15.0006C15.4148 9.24971 15.7506 9.5855 15.7506 9.99971C15.7506 10.4139 15.4148 10.7497 15.0006 10.7497H10.7502V15.0001C10.7502 15.4143 10.4144 15.7501 10.0002 15.7501C9.58599 15.7501 9.2502 15.4143 9.2502 15.0001V10.7497H5C4.58579 10.7497 4.25 10.4139 4.25 9.99971C4.25 9.5855 4.58579 9.24971 5 9.24971H9.2502V4.99951Z" />
              </svg>
              New Folder
            </button>
            <Link
              to="/file-manager"
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-500"
            >
              View All
              <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20" aria-hidden>
                <path fillRule="evenodd" clipRule="evenodd" d="M17.4175 9.9986C17.4178 10.1909 17.3446 10.3832 17.198 10.53L12.2013 15.5301C11.9085 15.8231 11.4337 15.8233 11.1407 15.5305C10.8477 15.2377 10.8475 14.7629 11.1403 14.4699L14.8604 10.7472L3.33301 10.7472C2.91879 10.7472 2.58301 10.4114 2.58301 9.99715C2.58301 9.58294 2.91879 9.24715 3.33301 9.24715L14.8549 9.24715L11.1403 5.53016C10.8475 5.23717 10.8477 4.7623 11.1407 4.4695C11.4336 4.1767 11.9085 4.17685 12.2013 4.46984L17.1588 9.43049C17.3173 9.568 17.4175 9.77087 17.4175 9.99715C17.4175 9.99763 17.4175 9.99812 17.4175 9.9986Z" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* New folder form */}
      {showNewFolder && (
        <div className="mx-5 mb-4 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-white/[0.03]">
          <p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">New Folder</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              autoFocus
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreateFolder(); if (e.key === "Escape") setShowNewFolder(false); }}
              placeholder="Folder name"
              className="h-9 flex-1 rounded-lg border border-gray-300 bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
            <input
              type="color"
              value={newFolderColor}
              onChange={(e) => setNewFolderColor(e.target.value)}
              title="Folder color"
              className="h-9 w-12 cursor-pointer rounded-lg border border-gray-300 bg-transparent dark:border-gray-700"
            />
            <button
              onClick={handleCreateFolder}
              disabled={creating}
              className="h-9 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {creating ? "Creating…" : "Create"}
            </button>
            <button
              onClick={() => setShowNewFolder(false)}
              className="h-9 rounded-lg border border-gray-300 px-3 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-400"
            >
              Cancel
            </button>
          </div>
          {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
        </div>
      )}

      <div className="p-5 border-t border-gray-100 dark:border-gray-800 sm:p-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {/* Static category folders */}
          <FolderCard title="Images" fileCount={`${buckets.Images.count}`} size={fmtBytes(buckets.Images.bytes)} to="/file-manager/folder/images" />
          <FolderCard title="Documents" fileCount={`${buckets.Documents.count}`} size={fmtBytes(buckets.Documents.bytes)} to="/file-manager/folder/documents" />
          <FolderCard title="Apps" fileCount={`${buckets.Apps.count}`} size={fmtBytes(buckets.Apps.bytes)} to="/file-manager/folder/apps" />
          <FolderCard title="Downloads" fileCount={`${buckets.Other.count}`} size={fmtBytes(buckets.Other.bytes)} to="/file-manager/folder/downloads" />
          <FolderCard title="Shared" fileCount={`${shared.count}`} size={fmtBytes(shared.bytes)} to="/shared" />

          {/* User-created folders */}
          {userFolders.map((folder) => (
            <div key={folder._id} className="relative group">
              <FolderCard
                title={folder.name}
                fileCount=""
                size=""
                to={`/file-manager/folder/custom/${folder._id}`}
                color={folder.color}
              />
              <button
                onClick={() => handleDeleteFolder(folder._id)}
                title="Delete folder"
                className="absolute top-2 right-2 hidden group-hover:flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-500 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
