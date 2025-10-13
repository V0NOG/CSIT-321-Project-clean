import { useMemo } from "react";
import { useParams } from "react-router";
import PageMeta from "../components/common/PageMeta";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import RecentFileTable from "../components/file-manager/RecentFileTable";

// map URL bucket -> API `type`
function mapBucketToType(bucket?: string): { type?: string; title: string } {
  const b = (bucket || "").toLowerCase();
  if (b === "images") return { type: "image", title: "Images" };
  if (b === "documents") return { type: "document", title: "Documents" };
  if (b === "apps") return { type: "app", title: "Apps" };
  if (b === "downloads") return { type: "other", title: "Downloads" };
  return { type: undefined, title: "All Files" };
}

export default function FolderFiles() {
  const { bucket } = useParams<{ bucket: string }>();
  const { type, title } = useMemo(() => mapBucketToType(bucket), [bucket]);

  return (
    <>
      <PageMeta title={`${title} | File Manager`} description={`Browsing ${title}`} />
      <PageBreadcrumb pageTitle={title} />
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12">
          <RecentFileTable initialType={type} headerTitle={title} />
        </div>
      </div>
    </>
  );
}