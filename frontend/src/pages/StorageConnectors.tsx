// frontend/src/pages/StorageConnectors.tsx
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PageMeta from "../components/common/PageMeta";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import Alert from "../components/ui/alert/Alert";
import { listConnectors, deleteConnector, getGoogleAuthUrl, getDropboxAuthUrl, StorageConnector } from "../api/connectorsApi";

export default function StorageConnectors() {
  const [connectors, setConnectors] = useState<StorageConnector[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<{ kind: "none" | "success" | "error" | "info"; title?: string; message?: string }>({ kind: "none" });
  const [searchParams] = useSearchParams();

  async function load() {
    try {
      const items = await listConnectors();
      setConnectors(items);
    } catch {
      setAlert({ kind: "error", title: "Error", message: "Failed to load connectors" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // Handle OAuth callback results
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    if (success === "google") setAlert({ kind: "success", title: "Google Drive Connected", message: "Your Google Drive account has been linked successfully." });
    else if (success === "dropbox") setAlert({ kind: "success", title: "Dropbox Connected", message: "Your Dropbox account has been linked successfully." });
    else if (error) setAlert({ kind: "error", title: "Connection Failed", message: decodeURIComponent(error) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function connectGoogle() {
    try {
      const url = await getGoogleAuthUrl();
      window.location.href = url;
    } catch {
      setAlert({ kind: "error", title: "Error", message: "Failed to start Google Drive connection" });
    }
  }

  async function connectDropbox() {
    try {
      const url = await getDropboxAuthUrl();
      window.location.href = url;
    } catch {
      setAlert({ kind: "error", title: "Error", message: "Failed to start Dropbox connection" });
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Disconnect "${name}"? Files stored there will no longer be accessible.`)) return;
    try {
      await deleteConnector(id);
      setAlert({ kind: "info", title: "Disconnected", message: `"${name}" has been removed.` });
      await load();
    } catch {
      setAlert({ kind: "error", title: "Error", message: "Failed to disconnect storage" });
    }
  }

  const providerIcon = (provider: string) => {
    if (provider === "google_drive") {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M4.56 20l4-6.928H21l-4 6.928H4.56z" fill="#0F9D58" />
          <path d="M3 17.072L7 10l4 6.928H3z" fill="#4285F4" />
          <path d="M8.56 10h8l4 6.928H12.56L8.56 10z" fill="#FBBC05" />
          <path d="M12 3l4 6.928H8L12 3z" fill="#EA4335" />
        </svg>
      );
    }
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-blue-500" aria-hidden>
        <path d="M6 6l6-4 6 4-6 4-6-4zm0 6l6-4 6 4-6 4-6-4zM0 9l6 4-6 4v-8zm12 0v8l6-4-6-4z" />
      </svg>
    );
  };

  return (
    <>
      <PageMeta title="Storage Connectors" description="Connect cloud storage providers" />
      <PageBreadcrumb pageTitle="Storage Connectors" />

      <div className="space-y-6">
        {alert.kind !== "none" && (
          <Alert variant={alert.kind as any} title={alert.title || ""} message={alert.message || ""} showLink={false} />
        )}

        {/* Info box */}
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-900/40 dark:bg-blue-900/10">
          <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">Zero-Knowledge Architecture</h3>
          <p className="text-sm text-blue-700 dark:text-blue-400">
            All files are encrypted in your browser before being sent to any storage provider. Neither this app
            nor your connected cloud accounts can read your file contents — only you hold the keys.
          </p>
        </div>

        {/* Default connector */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">Default Storage</h3>
          <div className="flex items-center gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="text-blue-600 dark:text-blue-400" aria-hidden>
                <path d="M6 6l6-4 6 4-6 4-6-4zm0 6l6-4 6 4-6 4-6-4zM0 9l6 4-6 4v-8zm12 0v8l6-4-6-4z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">App Dropbox (Shared)</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Managed by the application. Used by default if no connector is selected.</p>
            </div>
            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
              Active
            </span>
          </div>
        </div>

        {/* Connected accounts */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Connected Accounts</h3>
          </div>

          {loading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : connectors.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              No personal cloud accounts connected yet. Add one below to store files in your own account.
            </p>
          ) : (
            <div className="space-y-3 mb-6">
              {connectors.map((c) => (
                <div key={c._id} className="flex items-center gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                    {providerIcon(c.provider)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90 truncate">{c.name}</p>
                    {c.providerEmail && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{c.providerEmail}</p>
                    )}
                  </div>
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    Connected
                  </span>
                  <button
                    onClick={() => handleDelete(c._id, c.name)}
                    className="ml-2 rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-900/40 dark:text-red-400 dark:hover:bg-red-900/10"
                  >
                    Disconnect
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add connectors */}
          <h4 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">Add a Storage Account</h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <button
              onClick={connectGoogle}
              className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-5 py-4 text-left hover:bg-gray-100 transition-colors dark:border-gray-800 dark:bg-white/[0.02] dark:hover:bg-white/[0.05]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                {providerIcon("google_drive")}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">Google Drive</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Store encrypted files in your Google Drive</p>
              </div>
            </button>

            <button
              onClick={connectDropbox}
              className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-5 py-4 text-left hover:bg-gray-100 transition-colors dark:border-gray-800 dark:bg-white/[0.02] dark:hover:bg-white/[0.05]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                {providerIcon("dropbox")}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">Personal Dropbox</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Use your own Dropbox account instead of the shared one</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
