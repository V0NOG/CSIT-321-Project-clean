// backend/controllers/analyticsController.js
import mongoose from "mongoose";
import AuditLog from "../models/AuditLog.js";
import File from "../models/File.js";

/** Mirror the frontend categorize() for consistent buckets */
function categorize(mime = "", name = "") {
  const m = String(mime).toLowerCase();
  const n = String(name).toLowerCase();
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

/** Helper for day buckets (local midnight -> ISO date) */
function dayKey(d = new Date()) {
  const x = new Date(d); x.setHours(0,0,0,0);
  return x.toISOString().slice(0,10);
}

export async function summary(req, res) {
  const userId = req.user.id;

  // Fetch user’s files once, then derive aggregates in memory (fast for < few 100k)
  const files = await File.find({ owner: userId }).lean();

  const totalFiles = files.length;
  const totalBytes = files.reduce((s, f) => s + (Number(f.size) || 0), 0);

  // Storage by category
  const byType = { Images:0, Videos:0, Audios:0, Documents:0, Apps:0, Other:0 };
  for (const f of files) {
    const cat = categorize(f.mime, f.name);
    byType[cat] += Number(f.size) || 0;
  }

  // Uploads/Downloads last 30 days from AuditLog (privacy: only aggregates)
  const since = new Date(); since.setDate(since.getDate() - 29); since.setHours(0,0,0,0);

  const audits = await AuditLog.find(
    { actorId: new mongoose.Types.ObjectId(userId), ts: { $gte: since } },
    { action: 1, ts: 1 },
    { sort: { ts: 1 } }
  ).lean();

  const uploads30 = {};
  const downloads30 = {};
  for (let i=0;i<30;i++){
    const d = new Date(since); d.setDate(since.getDate()+i);
    uploads30[dayKey(d)] = 0; downloads30[dayKey(d)] = 0;
  }

  for (const a of audits) {
    const k = dayKey(new Date(a.ts));
    if (a.action === "upload") uploads30[k] = (uploads30[k] || 0) + 1;
    if (a.action === "download") downloads30[k] = (downloads30[k] || 0) + 1;
  }

  // Top actions (last 30d)
  const actionCounts = { upload:0, download:0, "acl:upsert":0, "acl:remove":0, login:0 };
  for (const a of audits) {
    if (actionCounts[a.action] !== undefined) actionCounts[a.action]++;
  }

  res.json({
    totalFiles,
    totalBytes,
    byType,                     // bytes per category
    uploads30: Object.entries(uploads30).map(([date,count]) => ({ date, count })),
    downloads30: Object.entries(downloads30).map(([date,count]) => ({ date, count })),
    topActions30d: actionCounts // counts only
  });
}