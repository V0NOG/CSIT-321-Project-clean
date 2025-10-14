// frontend/src/components/file-manager/ShareModal.tsx
import { useEffect, useState } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import Alert from "../ui/alert/Alert";
import {
  listFileShares,
  createShare,
  updateShare,
  revokeShare,
  SharePermission,
  ShareItem,
} from "../../api/sharesApi";

export default function ShareModal({
  open,
  onClose,
  fileId,
  fileName,
  onShared,
}: {
  open: boolean;
  onClose: () => void;
  fileId: string;
  fileName: string;
  onShared?: (message?: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<SharePermission>("viewer");
  const [busy, setBusy] = useState(false);
  const [shares, setShares] = useState<ShareItem[]>([]);
  const [topAlert, setTopAlert] = useState<{ kind: "none" | "success" | "error" | "info" | "warning"; title?: string; message?: string }>({ kind: "none" });

  async function load() {
    if (!fileId) return;
    try {
      const items = await listFileShares(fileId);
      setShares(items);
    } catch (e: any) {
      setTopAlert({ kind: "error", title: "Failed to load shares", message: e?.response?.data?.error || e?.message || "Please try again." });
    }
  }

  useEffect(() => {
    if (open) {
      setEmail("");
      setPermission("viewer");
      setTopAlert({ kind: "none" });
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, fileId]);

  async function onInvite() {
    if (!email) {
      setTopAlert({ kind: "warning", title: "Missing email", message: "Please enter the recipient's email." });
      return;
    }
    try {
      setBusy(true);
      const res = await createShare(fileId, { email, permission });
      const msg = res?.message || `Invitation sent to ${email}`;
      setTopAlert({ kind: "success", title: "Invitation sent", message: msg });
      setEmail("");
      await load();
      onShared?.(msg); // let parent show alert too
    } catch (e: any) {
      setTopAlert({ kind: "error", title: "Share failed", message: e?.response?.data?.error || e?.message || "Unable to share this file." });
    } finally {
      setBusy(false);
    }
  }

  async function onChangePermission(shareId: string, perm: SharePermission) {
    try {
      await updateShare(shareId, { permission: perm });
      await load();
      setTopAlert({ kind: "success", title: "Updated", message: "Permission updated." });
    } catch (e: any) {
      setTopAlert({ kind: "error", title: "Update failed", message: e?.response?.data?.error || e?.message || "Could not update permission." });
    }
  }

  async function onRevoke(shareId: string) {
    try {
      await revokeShare(shareId);
      await load();
      setTopAlert({ kind: "success", title: "Revoked", message: "Share revoked." });
    } catch (e: any) {
      setTopAlert({ kind: "error", title: "Revoke failed", message: e?.response?.data?.error || e?.message || "Could not revoke share." });
    }
  }

  return (
    <Modal isOpen={open} onClose={onClose} className="max-w-[720px] m-4">
      <div className="p-4 rounded-3xl bg-white dark:bg-gray-900 lg:p-10">
        <h4 className="text-xl font-semibold text-gray-800 dark:text-white/90">Share “{fileName || "File"}”</h4>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Invite a user and set their permission.</p>

        {topAlert.kind !== "none" && (
          <div className="mt-4">
            <Alert
              variant={topAlert.kind}
              title={topAlert.title || ""}
              message={topAlert.message || ""}
              showLink={false}
            />
          </div>
        )}

        {/* Invite row */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-12">
          <div className="sm:col-span-7">
            <Label>Email</Label>
            <Input
              type="email"
              placeholder="recipient@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="sm:col-span-3">
            <Label>Permission</Label>
            <select
              className="h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              value={permission}
              onChange={(e) => setPermission(e.target.value as SharePermission)}
            >
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
            </select>
          </div>
          <div className="sm:col-span-2 flex items-end">
            <Button className="w-full" onClick={onInvite} disabled={busy || !fileId}>
              Invite
            </Button>
          </div>
        </div>

        {/* Existing shares */}
        <div className="mt-6">
          <h5 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">People with access</h5>
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-50 dark:bg-white/[0.03]">
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Email</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Permission</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {shares.length === 0 && (
                  <tr>
                    <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400" colSpan={4}>
                      No one has access yet.
                    </td>
                  </tr>
                )}
                {shares.map((s) => (
                  <tr key={s._id} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="px-4 py-3 text-sm text-gray-800 dark:text-white/90">{s.email}</td>
                    <td className="px-4 py-3">
                      <select
                        className="h-9 rounded-md border border-gray-300 bg-transparent px-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                        value={s.permission}
                        onChange={(e) => onChangePermission(s._id, e.target.value as SharePermission)}
                      >
                        <option value="viewer">Viewer</option>
                        <option value="editor">Editor</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-400 capitalize">{s.status}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => onRevoke(s._id)}
                        className="inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-white/80 dark:border-gray-700 dark:hover:bg-white/5"
                      >
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}