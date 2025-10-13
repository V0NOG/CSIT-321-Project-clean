// src/utils/storage.ts
export type Category = "Images" | "Videos" | "Audios" | "Apps" | "Documents" | "Other";

export function categorize(mime?: string, name?: string): Category {
  const m = (mime || "").toLowerCase();
  const n = (name || "").toLowerCase();
  if (m.startsWith("image/")) return "Images";
  if (m.startsWith("video/")) return "Videos";
  if (m.startsWith("audio/")) return "Audios";
  if (m === "application/vnd.android.package-archive" || n.endsWith(".apk") || n.endsWith(".exe") || n.endsWith(".dmg")) return "Apps";
  if (
    m === "application/pdf" || n.endsWith(".pdf") ||
    m.includes("word") || n.endsWith(".doc") || n.endsWith(".docx") ||
    m.includes("excel") || n.endsWith(".xls") || n.endsWith(".xlsx") ||
    m.includes("powerpoint") || n.endsWith(".ppt") || n.endsWith(".pptx") ||
    n.endsWith(".txt") || n.endsWith(".rtf") || n.endsWith(".md")
  ) return "Documents";
  return "Other";
}

// ROCK-SOLID formatter: never returns NaN or "undefined"
export function fmtBytes(input?: number | string | null): string {
  const bytes = Number(input);
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(val >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}