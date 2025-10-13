// frontend/src/utils/storage.ts
export type Category = "Images" | "Videos" | "Audios" | "Documents" | "Apps" | "Other";

export function fmtBytes(bytes: number) {
  if (!bytes && bytes !== 0) return "0 B";
  const u = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(u.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${u[i]}`;
}

export function categorize(mime: string, name: string): Category {
  if (mime?.startsWith("image/")) return "Images";
  if (mime?.startsWith("video/")) return "Videos";
  if (mime?.startsWith("audio/")) return "Audios";

  const ext = (name.split(".").pop() || "").toLowerCase();
  const docExts = ["pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "txt", "rtf", "md", "csv"];
  if (mime?.startsWith("text/") || docExts.includes(ext)) return "Documents";

  const appExts = ["zip", "rar", "7z", "apk", "dmg", "exe", "msi"];
  if (appExts.includes(ext)) return "Apps";

  return "Other";
}