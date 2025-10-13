// src/utils/storage.ts
export type Category = "Images" | "Videos" | "Audios" | "Apps" | "Documents" | "Other";

export function fmtBytes(bytes?: number) {
  const n = Number.isFinite(bytes) ? (bytes as number) : 0;
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0, v = n;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function categorize(mime?: string, name?: string): Category {
  const m = (mime || "").toLowerCase();
  const n = (name || "").toLowerCase();

  if (m.startsWith("image/")) return "Images";
  if (m.startsWith("video/")) return "Videos";
  if (m.startsWith("audio/")) return "Audios";

  const docExts = ["pdf","doc","docx","ppt","pptx","xls","xlsx","txt","rtf","md","csv"];
  const appExts = ["zip","rar","7z","apk","dmg","exe","msi"];

  if (m.startsWith("text/")) return "Documents";
  if (docExts.some((e) => n.endsWith(`.${e}`))) return "Documents";
  if (appExts.some((e) => n.endsWith(`.${e}`))) return "Apps";

  return "Other";
}