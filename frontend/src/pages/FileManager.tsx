// frontend/src/pages/FileManager.tsx
import { useEffect, useState } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import AllMediaCard from "../components/file-manager/AllMediaCard";
import AllFolders from "../components/file-manager/AllFolders";
import RecentFileTable from "../components/file-manager/RecentFileTable";
import StorageDetailsChart from "../components/file-manager/StorageDetailsChart";
import PageMeta from "../components/common/PageMeta";
import Alert from "../components/ui/alert/Alert";
import Button from "../components/ui/button/Button";
import { listMyPendingInvites, respondToInvite, PendingInvite } from "../api/sharesApi";
import { useAuth } from "../context/AuthContext";

export default function FileManager() {
  const { user } = useAuth();
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [hidden, setHidden] = useState<Record<string, boolean>>({});

  async function loadInvites() {
    try {
      const items = await listMyPendingInvites();
      setInvites(items || []);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    loadInvites();
  }, []);

  async function handleRespond(inv: PendingInvite, action: "accept" | "decline") {
    await respondToInvite(inv._id, action);
    // remove the banner
    setInvites((prev) => prev.filter((x) => x._id !== inv._id));
    // 🔔 tell all widgets (AllFolders, AllMediaCard, RecentFileTable, Storage chart) to reload
    window.dispatchEvent(new CustomEvent("files:refresh"));
  }

  return (
    <>
      <PageMeta
        title="React.js File Manager Page | TailAdmin - React.js Admin Dashboard Template"
        description="This is React.js File Manager page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle="File Manager" />

      {/* === Pending share alerts (persistent until acted or dismissed) === */}
      <div className="space-y-3 mb-4">
        {invites
          .filter((i) => !hidden[i._id])
          .map((inv) => (
            <div key={inv._id} className="relative">
              <Alert
                variant="info"
                title="File shared with you"
                message={`“${inv.fileName}” was shared with you (${inv.permission}).`}
                showLink={false}
              />
              <div className="px-5 pb-4 -mt-3 flex items-center gap-3">
                <Button size="sm" onClick={() => handleRespond(inv, "accept")}>Accept</Button>
                <Button size="sm" variant="outline" onClick={() => handleRespond(inv, "decline")}>Decline</Button>
                <button
                  className="ml-auto text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  onClick={() => setHidden((h) => ({ ...h, [inv._id]: true }))}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12">
          <AllMediaCard />
        </div>

        <div className="col-span-12 xl:col-span-8">
          {/* Folders now includes "Shared" card fed from /api/files/shared */}
          <AllFolders />
        </div>

        <div className="col-span-12 xl:col-span-4">
          <StorageDetailsChart />
        </div>

        <div className="col-span-12">
          <RecentFileTable />
        </div>
      </div>
    </>
  );
}