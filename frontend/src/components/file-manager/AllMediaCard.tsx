import { useCallback, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  AudioIcon, DownloadIcon, FileIcon, FolderIcon, GridIcon, VideoIcon,
} from "../../icons";
import FileCard from "./FileCard";
import { encryptFileBlob } from "../../crypto/encrypt";
import { initUpload, uploadCiphertext, setFileKey } from "../../api/filesApi";
import { categorize, fmtBytes, Category } from "../../utils/storage";
import { useFiles } from "../../hooks/useFiles";

async function genAesKey(): Promise<{ keyB64: string; ivB64: string }> {
  const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt","decrypt"]);
  const raw = await crypto.subtle.exportKey("raw", key);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const keyB64 = btoa(String.fromCharCode(...new Uint8Array(raw)));
  const ivB64  = btoa(String.fromCharCode(...iv));
  return { keyB64, ivB64 };
}

export default function AllMediaCard() {
  const { items: files } = useFiles({ page: 1, limit: 1000 });
  const [uploading, setUploading] = useState(false);
  const [uploadCount, setUploadCount] = useState<{ done: number; total: number }>({ done: 0, total: 0 });

  const cardStats = useMemo(() => {
    const buckets: Record<
      Category,
      { fileCount: number; totalBytes: number; icon: React.ReactNode; iconStyle: string }
    > = {
      Images: { fileCount: 0, totalBytes: 0, icon: <FolderIcon className="size-5" />, iconStyle: "bg-success-500/[0.08] text-success-500" },
      Videos: { fileCount: 0, totalBytes: 0, icon: <VideoIcon className="size-6" />, iconStyle: "bg-theme-pink-500/[0.08] text-theme-pink-500" },
      Audios: { fileCount: 0, totalBytes: 0, icon: <AudioIcon className="size-6" />, iconStyle: "bg-blue-500/[0.08] text-blue-light-500" },
      Apps:   { fileCount: 0, totalBytes: 0, icon: <GridIcon className="size-6" />,  iconStyle: "bg-orange-500/[0.08] text-orange-500" },
      Documents:{ fileCount: 0, totalBytes: 0, icon: <FileIcon className="size-6" />, iconStyle: "bg-warning-500/[0.08] text-warning-500" },
      Other:  { fileCount: 0, totalBytes: 0, icon: <DownloadIcon className="size-6" />, iconStyle: "bg-theme-purple-500/[0.08] text-theme-purple-500" },
    };

    for (const f of files) {
      const cat = categorize(f.mime, f.name);
      buckets[cat].fileCount += 1;
      buckets[cat].totalBytes += Number(f.size) || 0;
    }

    const totalAll = files.reduce((n, f) => n + (Number(f.size) || 0), 0);
    return (Object.keys(buckets) as Category[]).map((cat) => {
      const b = buckets[cat];
      const percent = totalAll > 0 ? Math.round((b.totalBytes / totalAll) * 100) : 0;
      return {
        title: cat,
        usage: `${percent}% Used`,
        fileCount: b.fileCount,
        storageUsed: totalAll === 0 ? "0 B" : fmtBytes(b.totalBytes),
        icon: b.icon,
        iconStyle: b.iconStyle,
      };
    });
  }, [files]);

  async function pickSingleFile(): Promise<File> {
    return new Promise((resolve, reject) => {
      const picker = document.createElement("input");
      picker.type = "file";
      picker.multiple = false;
      picker.accept = "*/*";
      picker.onchange = () => {
        const f = picker.files?.[0];
        if (f) resolve(f);
        else reject(new Error("No file selected"));
      };
      picker.click();
    });
  }

  async function encryptAndUpload(file: File) {
    // 1) init server metadata
    const { fileId } = await initUpload({
      name: file.name,
      size: file.size,
      mime: file.type || "application/octet-stream",
    });

    // 2) make per-file AES key/iv and save to server
    const { keyB64, ivB64 } = await genAesKey();
    await setFileKey(fileId, keyB64, ivB64);

    // 3) client-side encrypt, upload ciphertext (raw octet-stream)
    const { ciphertext } = await encryptFileBlob(file, { keyB64, ivB64 });
    await uploadCiphertext(fileId, ciphertext);
  }

  async function onUploadClick() {
    if (uploading) return;
    setUploading(true);
    try {
      const f = await pickSingleFile();
      await encryptAndUpload(f);
      window.dispatchEvent(new CustomEvent("files:refresh"));
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!acceptedFiles?.length || uploading) return;
      setUploading(true);
      setUploadCount({ done: 0, total: acceptedFiles.length });
      try {
        for (let i = 0; i < acceptedFiles.length; i++) {
          await encryptAndUpload(acceptedFiles[i]);
          setUploadCount({ done: i + 1, total: acceptedFiles.length });
        }
        window.dispatchEvent(new CustomEvent("files:refresh"));
      } catch (e: any) {
        console.error(e);
        alert(e?.message || "One or more uploads failed");
      } finally {
        setUploading(false);
        setTimeout(() => setUploadCount({ done: 0, total: 0 }), 600);
      }
    },
    [uploading]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    noClick: true,
  });

  return (
    <div className="relative rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]" {...getRootProps()}>
      {isDragActive && (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl border-2 border-dashed border-brand-500/50 bg-brand-500/5 backdrop-blur-sm">
          <div className="px-4 py-2 text-sm font-medium text-brand-600 bg-white/80 rounded-lg dark:bg-gray-900/60 dark:text-brand-400">
            Drop files to upload…
          </div>
        </div>
      )}
      <input {...getInputProps()} />

      <div className="px-4 py-4 sm:pl-6 sm:pr-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">All Media</h3>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pl-[42px] pr-3.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[300px]"
                disabled
              />
              <span className="absolute text-gray-500 -translate-y-1/2 left-4 top-1/2 dark:text-gray-400">
                🔍
              </span>
            </div>

            <button
              type="button"
              onClick={onUploadClick}
              disabled={uploading}
              className={`flex items-center justify-center w-full gap-2 px-4 py-3 text-sm font-medium text-white rounded-lg shadow-theme-xs sm:w-auto ${
                uploading ? "bg-gray-400 cursor-not-allowed" : "bg-brand-500 hover:bg-brand-600"
              }`}
              title={uploading ? "Uploading…" : "Upload File"}
            >
              <span className={uploading ? "animate-pulse" : ""}>➕</span>
              {uploading
                ? `Uploading… ${uploadCount.total ? `${uploadCount.done}/${uploadCount.total}` : ""}`
                : "Upload File"}
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-100 dark:border-gray-800 sm:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3">
          {cardStats.map((item, i) => (
            <FileCard
              key={i + 1}
              icon={item.icon}
              title={item.title}
              usage={item.usage}
              fileCount={item.fileCount}
              storageUsed={item.storageUsed}
              iconStyle={item.iconStyle}
            />
          ))}
        </div>
      </div>
    </div>
  );
}