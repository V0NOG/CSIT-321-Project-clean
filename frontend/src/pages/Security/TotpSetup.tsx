import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Button from "../../components/ui/button/Button";

export default function TotpSetup() {
  const [qr, setQr] = useState<string>("");
  const [tempSecret, setTempSecret] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [enabled, setEnabled] = useState<boolean>(false);
  const [busy, setBusy] = useState(false);

  const loc = useLocation();
  const navigate = useNavigate();
  const onboarding = useMemo(() => new URLSearchParams(loc.search).get("onboarding") === "1", [loc.search]);

  async function fetchSetup() {
    try {
      setBusy(true);
      const res = await axios.post("http://localhost:5050/api/auth/totp/setup", {}, { withCredentials: true, headers: authHeader() });
      setQr(res.data.qr);
      setTempSecret(res.data.tempSecret);
    } catch (e: any) {
      alert(e?.response?.data?.error || "Failed to start TOTP setup");
    } finally {
      setBusy(false);
    }
  }

  async function enable() {
    if (!tempSecret || !code) return alert("Scan the QR then enter the code.");
    try {
      setBusy(true);
      const res = await axios.post(
        "http://localhost:5050/api/auth/totp/enable",
        { tempSecret, code },
        { withCredentials: true, headers: authHeader() }
      );
      setEnabled(true);
      alert(res.data?.message || "Two-factor enabled");
      navigate("/", { replace: true });
    } catch (e: any) {
      alert(e?.response?.data?.error || "Enable failed");
    } finally {
      setBusy(false);
    }
  }

  function skip() {
    navigate("/", { replace: true });
  }

  return (
    <>
      <PageMeta title="Two-Factor Authentication" description="Protect your account with a one-time code." />
      <PageBreadcrumb pageTitle="Security / Two-Factor Authentication" />
      <div className="max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Set up Two-Factor Authentication</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Scan the QR with Google Authenticator, 1Password, or Authy. Then enter the 6-digit code.
            </p>
          </div>
          {onboarding && (
            <Button size="sm" variant="ghost" onClick={skip} className="text-gray-500 hover:text-gray-700">
              Skip for now
            </Button>
          )}
        </div>

        <div className="mt-6 flex items-start gap-6">
          <div className="flex flex-col items-center">
            <div className="h-48 w-48 rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 flex items-center justify-center overflow-hidden">
              {qr ? <img src={qr} alt="QR" className="h-full w-full object-contain" /> : <span className="text-xs text-gray-400">QR will appear here</span>}
            </div>
            <Button className="mt-4" onClick={fetchSetup} disabled={busy || !!qr}>
              {qr ? "QR Generated" : "Generate QR"}
            </Button>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">6-digit code</label>
            <input
              className="mt-2 w-56 rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              placeholder="123456"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={!qr}
            />
            <div className="mt-4 flex gap-3">
              <Button onClick={enable} disabled={busy || !code}>Enable 2FA</Button>
              {!onboarding && (
                <Button variant="outline" onClick={() => navigate(-1)} disabled={busy}>Cancel</Button>
              )}
            </div>
            {enabled && <p className="mt-3 text-sm text-success-600">Two-factor is enabled.</p>}
          </div>
        </div>
      </div>
    </>
  );
}

function authHeader() {
  const token = localStorage.getItem("token") || "";
  return token ? { Authorization: `Bearer ${token}` } : {};
}