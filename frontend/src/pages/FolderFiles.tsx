// frontend/src/pages/FolderFiles.tsx
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import PageMeta from "../components/common/PageMeta";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import RecentFileTable from "../components/file-manager/RecentFileTable";
import { listFolders, Folder } from "../api/foldersApi";

function mapBucketToType(bucket?: string): { type?: string; title: string } {
  const b = (bucket || "").toLowerCase();
  if (b === "images") return { type: "image", title: "Images" };
  if (b === "documents") return { type: "document", title: "Documents" };
  if (b === "apps") return { type: "app", title: "Apps" };
  if (b === "downloads") return { type: "other", title: "Downloads" };
  return { type: undefined, title: "All Files" };
}

export default function FolderFiles() {
  const { bucket, folderId } = useParams<{ bucket?: string; folderId?: string }>();
  const [folderName, setFolderName] = useState<string>("");

  // Load user folder name if this is a custom folder
  useEffect(() => {
    if (folderId) {
      listFolders()
        .then((folders) => {
          const found = folders.find((f: Folder) => f._id === folderId);
          setFolderName(found?.name || "Folder");
        })
        .catch(() => setFolderName("Folder"));
    }
  }, [folderId]);

  const { type, title } = useMemo(() => {
    if (folderId) return { type: undefined, title: folderName || "Folder" };
    return mapBucketToType(bucket);
  }, [bucket, folderId, folderName]);

  return (
    <>
      <PageMeta title={`${title} | File Manager`} description={`Browsing ${title}`} />
      <PageBreadcrumb pageTitle={title} />
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12">
          <RecentFileTable
            initialType={type}
            headerTitle={title}
            folderId={folderId}
          />
        </div>
      </div>
    </>
  );
}
