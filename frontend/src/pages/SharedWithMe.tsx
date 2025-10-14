// frontend/src/pages/SharedWithMe.tsx
import { useEffect, useState } from "react";
import PageMeta from "../components/common/PageMeta";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import Button from "../components/ui/button/Button";
import Alert from "../components/ui/alert/Alert";
import SharedWithMeTable from "../components/file-manager/SharedWithMeTable";
import { acceptShare, declineShare, getShareInbox, listSharedWithMe } from "../api/sharesApi";

type AlertState =
  | { kind: "none" }
  | { kind: "success" | "warning" | "error" | "info"; title: string; message: string };

export default function SharedWithMe() {
  const [inbox, setInbox] = useState<any[]>([]);
  const [accepted, setAccepted] = useState<any[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
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

  return (
    <>
      <PageMeta title="Shared With Me" description="Files others shared with you" />
      <PageBreadcrumb pageTitle="Shared With Me" />
      <SharedWithMeTable />

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
            <p className="text-sm text-gray-500 dark:text-gray-400">Accept to add access; decline to ignore.</p>
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
                  <tr><td className="px-4 py-3 text-gray-500 dark:text-gray-400" colSpan={4}>No pending invites</td></tr>
                ) : inbox.map((row) => (
                  <tr key={row._id} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="px-4 py-3 text-sm text-gray-800 dark:text-white/90">{row.fileName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{row.owner?.name} ({row.owner?.email})</td>
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

        {/* Accepted */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Accessible Files</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Files you can access from others (viewer/editor).</p>
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
                </tr>
              </thead>
              <tbody>
                {accepted.length === 0 ? (
                  <tr><td className="px-4 py-3 text-gray-500 dark:text-gray-400" colSpan={5}>Nothing yet</td></tr>
                ) : accepted.map((row) => (
                  <tr key={row._id} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="px-4 py-3 text-sm text-gray-800 dark:text-white/90">{row.fileName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{row.owner?.name} ({row.owner?.email})</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 capitalize">{row.permission}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{row.size ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{row.createdAt ? new Date(row.createdAt).toLocaleString() : "—"}</td>
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