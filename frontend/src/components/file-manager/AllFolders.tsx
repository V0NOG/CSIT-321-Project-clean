// frontend/src/components/file-manager/AllFolders.tsx
import { Link } from "react-router";
import { useEffect, useMemo, useState } from "react";
import FolderCard from "./FolderCard";
import { useFiles } from "../../hooks/useFiles";
import { categorize, fmtBytes } from "../../utils/storage";
import { listSharedFiles } from "../../api/filesApi";

type Bucket = {
  count: number;
  bytes: number;
};

export default function AllFolders() {
  // Your own files
  const { items: files } = useFiles({ page: 1, limit: 1000, sort: "createdAt:desc" });

  // Shared (accepted) copies fetched from /api/files/shared
  const [shared, setShared] = useState<Bucket>({ count: 0, bytes: 0 });
  const [sharedLoading, setSharedLoading] = useState(false);

  async function loadShared() {
    try {
      setSharedLoading(true);
      const res = await listSharedFiles(); // returns { items } or array
      const items = (res?.items ?? res ?? []) as Array<{ size?: number }>;
      let count = 0;
      let bytes = 0;
      for (const f of items) {
        count += 1;
        bytes += Number(f?.size) || 0;
      }
      setShared({ count, bytes });
    } catch {
      setShared({ count: 0, bytes: 0 });
    } finally {
      setSharedLoading(false);
    }
  }

  useEffect(() => {
    loadShared();
    // refresh when uploads or accept/decline fire a files:refresh event
    const onRefresh = () => loadShared();
    window.addEventListener("files:refresh", onRefresh);
    return () => window.removeEventListener("files:refresh", onRefresh);
  }, []);

  // Build buckets (own files only; shared is its own tile)
  const buckets = useMemo(() => {
    const out: Record<"Images" | "Documents" | "Apps" | "Other", Bucket> = {
      Images: { count: 0, bytes: 0 },
      Documents: { count: 0, bytes: 0 },
      Apps: { count: 0, bytes: 0 },
      Other: { count: 0, bytes: 0 },
    };
    for (const f of files || []) {
      const size = Number(f.size) || 0;
      const cat = categorize(f.mime, f.name); // "Images" | "Videos" | "Audios" | "Apps" | "Documents" | "Other"
      if (cat === "Images") {
        out.Images.bytes += size;
        out.Images.count += 1;
      } else if (cat === "Documents") {
        out.Documents.bytes += size;
        out.Documents.count += 1;
      } else if (cat === "Apps") {
        out.Apps.bytes += size;
        out.Apps.count += 1;
      } else {
        // Videos, Audios, Other → "Downloads" tile
        out.Other.bytes += size;
        out.Other.count += 1;
      }
    }
    return out;
  }, [files]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="px-4 py-4 sm:pl-6 sm:pr-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            All Folders
          </h3>

          <Link
            to="/file-manager"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-500"
          >
            View All
            <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20" aria-hidden>
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M17.4175 9.9986C17.4178 10.1909 17.3446 10.3832 17.198 10.53L12.2013 15.5301C11.9085 15.8231 11.4337 15.8233 11.1407 15.5305C10.8477 15.2377 10.8475 14.7629 11.1403 14.4699L14.8604 10.7472L3.33301 10.7472C2.91879 10.7472 2.58301 10.4114 2.58301 9.99715C2.58301 9.58294 2.91879 9.24715 3.33301 9.24715L14.8549 9.24715L11.1403 5.53016C10.8475 5.23717 10.8477 4.7623 11.1407 4.4695C11.4336 4.1767 11.9085 4.17685 12.2013 4.46984L17.1588 9.43049C17.3173 9.568 17.4175 9.77087 17.4175 9.99715C17.4175 9.99763 17.4175 9.99812 17.4175 9.9986Z"
              />
            </svg>
          </Link>
        </div>
      </div>

      <div className="p-5 border-t border-gray-100 dark:border-gray-800 sm:p-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
          <FolderCard
            title="Images"
            fileCount={`${buckets.Images.count}`}
            size={fmtBytes(buckets.Images.bytes)}
            to="/file-manager/folder/images"
          />
          <FolderCard
            title="Documents"
            fileCount={`${buckets.Documents.count}`}
            size={fmtBytes(buckets.Documents.bytes)}
            to="/file-manager/folder/documents"
          />
          <FolderCard
            title="Apps"
            fileCount={`${buckets.Apps.count}`}
            size={fmtBytes(buckets.Apps.bytes)}
            to="/file-manager/folder/apps"
          />
          <FolderCard
            title="Downloads"
            fileCount={`${buckets.Other.count}`}
            size={fmtBytes(buckets.Other.bytes)}
            to="/file-manager/folder/downloads"
          />
          <FolderCard
            title="Shared"
            fileCount={sharedLoading ? "…" : `${shared.count}`}
            size={sharedLoading ? "…" : fmtBytes(shared.bytes)}
            to="/shared"
          />
        </div>
      </div>
    </div>
  );
}