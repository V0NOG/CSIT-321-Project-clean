// frontend/src/pages/SharedWithMe.tsx
import { useEffect, useState } from "react";
import PageMeta from "../components/common/PageMeta";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import Button from "../components/ui/button/Button";
import Alert from "../components/ui/alert/Alert";
import { acceptShare, declineShare, getShareInbox, listSharedWithMe } from "../api/sharesApi";
import { downloadSharedDecryptedBlob } from "../api/filesApi";
import { initUserKeypair } from "../crypto/asymmetric";
import { getMyKeys, rotateKeys } from "../api/keysApi";

type AlertState =
  | { kind: "none" }
  | { kind: "success" | "warning" | "error" | "info"; title: string; message: string };

function fmtBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "—";
  const u = ["B", "KB", "MB", "GB"];
  const i = Math.min(u.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${u[i]}`;
}

export default function SharedWithMe() {
  const [inbox, setInbox] = useState<any[]>([]);
  const [accepted, setAccepted] = useState<any[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [alert, setAlert] = useState<AlertState>({ kind: "none" });

  function show(kind: AlertState["kind"], title: string, message: string) {
    if (kind === "none") return setAlert({ kind: "none" });
    setAlert({ kind, title, message } as any);
    if (kind === "success" || kind === "info") setTimeout(() => setAlert({ kind: "none" }), 2200);
  }

  async function load() {
    const [pending, acc] = await Promise.all([getShareInbox(), listSharedWithMe(false)]);
    setInbox(pending);
    setAccepted(acc);
  }

  useEffect(() => {
    // Ensure this user's RSA keypair is initialized (needed to decrypt shared file keys)
    initUserKeypair(getMyKeys, rotateKeys).catch(() => {});
    load().catch(() => {});
  }, []);

  async function onAccept(id: string) {
    try {
      setBusy(id);
      await acceptShare(id);
      show("success", "Accepted", "You can now access this file.");
      await load();
    } catch (e: any) {
      show("error", "Failed", e?.response?.data?.error || "Could not accept invitation");
    } finally {
      setBusy(null);
    }
  }

  async function onDecline(id: string) {
    try {
      setBusy(id);
      await declineShare(id);
      show("info", "Declined", "Invite declined.");
      await load();
    } catch (e: any) {
      show("error", "Failed", e?.response?.data?.error || "Could not decline invitation");
    } finally {
      setBusy(null);
    }
  }

  async function onDownload(row: any) {
    setDownloading(row._id);
    try {
      const blob = await downloadSharedDecryptedBlob(row._id, {
        _id: row.fileId,
        name: row.fileName,
        mime: row.mime || "application/octet-stream",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = row.fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      show("error", "Download failed", e?.message || "Unable to decrypt this file. The owner may need to re-share it.");
    } finally {
      setDownloading(null);
    }
  }

  return (
    <>
      <PageMeta title="Shared With Me" description="Files others shared with you" />
      <PageBreadcrumb pageTitle="Shared With Me" />

      <div className="space-y-6">
        {alert.kind !== "none" && (
          <Alert
            variant={alert.kind as any}
            title={(alert as any).title}
            message={(alert as any).message}
            showLink={false}
          />
        )}

        {/* Inbox */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Invites</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Accept to gain access; decline to ignore. Accepted files are decrypted in your browser using end-to-end encryption.
            </p>
          </div>
          <div className="max-w-full overflow-x-auto">
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr className="border-t border-gray-200 dark:border-gray-800">
                  <th className="px-4 py-2 text-left text-theme-sm text-gray-500 dark:text-gray-400">File</th>
                  <th className="px-4 py-2 text-left text-theme-sm text-gray-500 dark:text-gray-400">From</th>
                  <th className="px-4 py-2 text-left text-theme-sm text-gray-500 dark:text-gray-400">Permission</th>
                  <th className="px-4 py-2 text-center text-theme-sm text-gray-500 dark:text-gray-400">Action</th>
                </tr>
              </thead>
              <tbody>
                {inbox.length === 0 ? (
                  <tr>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400" colSpan={4}>
                      No pending invites
                    </td>
                  </tr>
                ) : inbox.map((row) => (
                  <tr key={row._id} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="px-4 py-3 text-sm text-gray-800 dark:text-white/90">{row.fileName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {row.owner?.name || ""}{row.owner?.email ? ` (${row.owner.email})` : ""}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 capitalize">{row.permission}</td>
                    <td className="px-4 py-2 text-center">
                      <div className="inline-flex gap-2">
                        <Button size="sm" onClick={() => onAccept(row._id)} disabled={busy === row._id}>Accept</Button>
                        <Button size="sm" variant="outline" onClick={() => onDecline(row._id)} disabled={busy === row._id}>Decline</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Accepted shared files */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Accessible Files</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Files are decrypted end-to-end in your browser — the server never sees plaintext content.
            </p>
          </div>
          <div className="max-w-full overflow-x-auto">
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr className="border-t border-gray-200 dark:border-gray-800">
                  <th className="px-4 py-2 text-left text-theme-sm text-gray-500 dark:text-gray-400">File</th>
                  <th className="px-4 py-2 text-left text-theme-sm text-gray-500 dark:text-gray-400">Owner</th>
                  <th className="px-4 py-2 text-left text-theme-sm text-gray-500 dark:text-gray-400">Permission</th>
                  <th className="px-4 py-2 text-left text-theme-sm text-gray-500 dark:text-gray-400">Size</th>
                  <th className="px-4 py-2 text-left text-theme-sm text-gray-500 dark:text-gray-400">Shared on</th>
                  <th className="px-4 py-2 text-left text-theme-sm text-gray-500 dark:text-gray-400">Action</th>
                </tr>
              </thead>
              <tbody>
                {accepted.length === 0 ? (
                  <tr>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400" colSpan={6}>Nothing yet</td>
                  </tr>
                ) : accepted.map((row) => (
                  <tr key={row._id} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="px-4 py-3 text-sm text-gray-800 dark:text-white/90">{row.fileName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {row.owner?.name || ""}{row.owner?.email ? ` (${row.owner.email})` : ""}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 capitalize">{row.permission}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {Number.isFinite(row.size) ? fmtBytes(row.size) : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {row.createdAt ? new Date(row.createdAt).toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => onDownload(row)}
                        disabled={downloading === row._id}
                        className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:text-white/80 dark:border-gray-700 dark:hover:bg-white/5"
                      >
                        {downloading === row._id ? (
                          <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                            <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                            <path d="M12 2a10 10 0 0 1 10 10" />
                          </svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                            <path d="M12 3v10m0 0l4-4m-4 4l-4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                        {downloading === row._id ? "Decrypting…" : "Download"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
