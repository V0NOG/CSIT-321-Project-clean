// frontend/src/components/security/TOTPSetupCard.tsx
import { useEffect, useState } from "react";
import axios from "axios";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import AlertBanner from "../common/AlertBanner";
import { useAuth } from "../../context/AuthContext";

type SetupResp = {
  otpauthUrl: string;
  secret: string;    // just for dev preview; ignore showing it in prod
  qrDataUrl: string; // data:image/png;base64,...
};

export default function TOTPSetupCard() {
  const { token } = useAuth();
  const [enabled, setEnabled] = useState<boolean>(false);
  const [setup, setSetup] = useState<SetupResp | null>(null);
  const [code, setCode] = useState("");
  const [alert, setAlert] = useState<{ kind: "success"|"warning"|"error"|"info"; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch current user to show enabled state
  useEffect(() => {
    (async () => {
      try {
        const me = await axios.get("/api/user/me", {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        setEnabled(!!me.data?.totpEnabled);
      } catch {
        // noop
      }
    })();
  }, [token]);

  const beginSetup = async () => {
    setAlert(null);
    setLoading(true);
    try {
      const res = await axios.post<SetupResp>(
        "/api/auth/totp/setup",
        {},
        { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
      );
      setSetup(res.data);
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || "Failed to start TOTP setup";
      setAlert({ kind: "error", msg });
    } finally {
      setLoading(false);
    }
  };

  const enableTotp = async () => {
    setAlert(null);
    setLoading(true);
    try {
      await axios.post(
        "/api/auth/totp/enable",
        { code },
        { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
      );
      setEnabled(true);
      setSetup(null);
      setCode("");
      setAlert({ kind: "success", msg: "Two-factor authentication enabled." });
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || "Failed to enable TOTP";
      setAlert({ kind: "error", msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Two-Factor Authentication (TOTP)
          </h4>
          {!enabled ? (
            <Button size="sm" onClick={beginSetup} disabled={loading}>
              {loading ? "Preparing…" : "Set up 2FA"}
            </Button>
          ) : (
            <span className="text-sm text-success-600">Enabled</span>
          )}
        </div>

        {alert && (
          <AlertBanner
            kind={alert.kind}
            title={alert.kind === "error" ? "Error" : "Notice"}
            message={alert.msg}
          />
        )}

        {!enabled && setup && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Scan this QR with Google Authenticator, Microsoft Authenticator, or any TOTP app.
              </p>
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
                <img src={setup.qrDataUrl} alt="TOTP QR code" className="mx-auto" />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 break-all">
                If you can’t scan: <code>{setup.otpauthUrl}</code>
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Enter 6-digit code</Label>
                <Input
                  type="text"
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  maxLength={6}
                />
              </div>
              <Button size="sm" onClick={enableTotp} disabled={loading || code.length < 6}>
                {loading ? "Verifying…" : "Enable 2FA"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}