// frontend/src/pages/StorageConnectors.tsx
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PageMeta from "../components/common/PageMeta";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import Alert from "../components/ui/alert/Alert";
import {
  listConnectors,
  deleteConnector,
  getGoogleAuthUrl,
  getDropboxAuthUrl,
  getConnectorConfig,
  getOAuthSettings,
  saveOAuthSettings,
  StorageConnector,
  ConnectorConfig,
  OAuthSettingsResponse,
} from "../api/connectorsApi";

// ── Small helpers ─────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() =>
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        })
      }
      className="ml-2 rounded px-2 py-0.5 text-xs font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10 transition-colors"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function RedirectUriRow({ label, uri }: { label: string; uri: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 dark:bg-white/[0.04]">
      <span className="w-24 flex-shrink-0 text-xs font-medium text-gray-500 dark:text-gray-400">
        {label}
      </span>
      <code className="flex-1 truncate text-xs text-gray-800 dark:text-white/80">{uri}</code>
      <CopyButton text={uri} />
    </div>
  );
}

function StatusBadge({ present, source }: { present: boolean; source: string }) {
  if (!present)
    return (
      <span className="text-xs text-error-500 dark:text-error-400 font-medium">Not set</span>
    );
  return (
    <span className="text-xs text-success-600 dark:text-success-400 font-medium">
      ✓ {source === "db" ? "Saved" : "From env"}
    </span>
  );
}

function SecretInput({
  label,
  fieldKey,
  value,
  onChange,
}: {
  label: string;
  fieldKey: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <label className="w-36 flex-shrink-0 text-xs text-gray-600 dark:text-gray-400">{label}</label>
      <div className="relative flex-1">
        <input
          type={show ? "text" : "password"}
          placeholder="Paste value here to set or update"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 pr-8 text-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white/80 focus:outline-none focus:ring-1 focus:ring-brand-400"
          autoComplete="off"
          data-1p-ignore
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          tabIndex={-1}
        >
          {show ? (
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function StorageConnectors() {
  const [connectors, setConnectors] = useState<StorageConnector[]>([]);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<ConnectorConfig | null>(null);
  const [oauthStatus, setOauthStatus] = useState<OAuthSettingsResponse | null>(null);
  const [alert, setAlert] = useState<{
    kind: "none" | "success" | "error" | "info" | "warning";
    title?: string;
    message?: string;
  }>({ kind: "none" });
  const [searchParams] = useSearchParams();
  const [showSetup, setShowSetup] = useState(false);

  // credential form state
  const [creds, setCreds] = useState({
    GOOGLE_CLIENT_ID: "",
    GOOGLE_CLIENT_SECRET: "",
    DROPBOX_APP_KEY: "",
    DROPBOX_APP_SECRET: "",
  });
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const [items, cfg, status] = await Promise.all([
        listConnectors(),
        getConnectorConfig().catch(() => null),
        getOAuthSettings().catch(() => null),
      ]);
      setConnectors(items);
      if (cfg) setConfig(cfg);
      if (status) setOauthStatus(status);
    } catch {
      setAlert({ kind: "error", title: "Error", message: "Failed to load connectors" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    if (success === "google") {
      setAlert({ kind: "success", title: "Google Drive Connected", message: "Your Google Drive account has been linked." });
    } else if (success === "dropbox") {
      setAlert({ kind: "success", title: "Dropbox Connected", message: "Your Dropbox account has been linked." });
    } else if (error) {
      const decoded = decodeURIComponent(error);
      let message = decoded;
      let title = "Connection Failed";
      if (decoded.includes("redirect_uri_mismatch") || decoded.includes("redirect_uri") || decoded.includes("Invalid redirect_uri")) {
        title = "Redirect URI Not Registered";
        message = "The redirect URI isn't registered with the OAuth provider. Expand the setup guide below and copy the exact URI into your provider's app settings.";
        setShowSetup(true);
      } else if (decoded.includes("invalid_client") || decoded.includes("access_denied")) {
        title = "OAuth Client Error";
        message = `${decoded}. Check that your credentials are correct in the setup guide below.`;
        setShowSetup(true);
      } else if (decoded.includes("invalid_state")) {
        title = "Session Expired";
        message = "The authorization session expired. Please try connecting again.";
      }
      setAlert({ kind: "error", title, message });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSaveCreds() {
    setSaving(true);
    try {
      await saveOAuthSettings(creds);
      setCreds({ GOOGLE_CLIENT_ID: "", GOOGLE_CLIENT_SECRET: "", DROPBOX_APP_KEY: "", DROPBOX_APP_SECRET: "" });
      await load();
      setAlert({ kind: "success", title: "Credentials Saved", message: "OAuth credentials have been saved. You can now connect your accounts." });
    } catch {
      setAlert({ kind: "error", title: "Error", message: "Failed to save credentials" });
    } finally {
      setSaving(false);
    }
  }

  async function connectGoogle() {
    try {
      const url = await getGoogleAuthUrl();
      window.location.href = url;
    } catch {
      setAlert({ kind: "error", title: "Error", message: "Failed to start Google Drive connection. Is the backend running?" });
    }
  }

  async function connectDropbox() {
    try {
      const url = await getDropboxAuthUrl();
      window.location.href = url;
    } catch {
      setAlert({ kind: "error", title: "Error", message: "Failed to start Dropbox connection. Is the backend running?" });
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Disconnect "${name}"? Files stored there will no longer be accessible.`)) return;
    try {
      await deleteConnector(id);
      setAlert({ kind: "info", title: "Disconnected", message: `"${name}" has been removed.` });
      await load();
    } catch {
      setAlert({ kind: "error", title: "Error", message: "Failed to disconnect storage" });
    }
  }

  const providerIcon = (provider: string) => {
    if (provider === "google_drive") {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M4.56 20l4-6.928H21l-4 6.928H4.56z" fill="#0F9D58" />
          <path d="M3 17.072L7 10l4 6.928H3z" fill="#4285F4" />
          <path d="M8.56 10h8l4 6.928H12.56L8.56 10z" fill="#FBBC05" />
          <path d="M12 3l4 6.928H8L12 3z" fill="#EA4335" />
        </svg>
      );
    }
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-blue-500" aria-hidden>
        <path d="M6 6l6-4 6 4-6 4-6-4zm0 6l6-4 6 4-6 4-6-4zM0 9l6 4-6 4v-8zm12 0v8l6-4-6-4z" />
      </svg>
    );
  };

  const googleReady = config?.googleClientIdPresent && config?.googleClientSecretPresent;
  const dropboxReady = config?.dropboxAppKeyPresent && config?.dropboxAppSecretPresent;

  const anyCredInput = Object.values(creds).some((v) => v.trim());

  return (
    <>
      <PageMeta title="Storage Connectors" description="Connect cloud storage providers" />
      <PageBreadcrumb pageTitle="Storage Connectors" />

      <div className="space-y-6">
        {alert.kind !== "none" && (
          <Alert variant={alert.kind as any} title={alert.title || ""} message={alert.message || ""} showLink={false} />
        )}

        {/* Zero-Knowledge info */}
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-900/40 dark:bg-blue-900/10">
          <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">
            Zero-Knowledge Architecture
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-400">
            All files are encrypted in your browser before being sent to any storage provider. Neither this app
            nor your connected cloud accounts can read your file contents — only you hold the keys.
          </p>
        </div>

        {/* ── Setup Guide ───────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:border-amber-800/40 dark:bg-amber-900/10">
          <button
            onClick={() => setShowSetup((s) => !s)}
            className="flex w-full items-center justify-between px-5 py-4 text-left"
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
              <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                OAuth Setup Guide — Required before connecting
              </span>
            </div>
            <svg className={`w-4 h-4 text-amber-600 dark:text-amber-400 transition-transform ${showSetup ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showSetup && (
            <div className="px-5 pb-5 space-y-6">

              {/* Step 1 — Redirect URIs */}
              {config && (
                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase text-amber-700 dark:text-amber-400 tracking-wide">
                    Step 1 — Register these Redirect URIs with each provider
                  </h4>
                  <div className="space-y-2">
                    <RedirectUriRow label="Google Drive" uri={config.googleRedirectUri} />
                    <RedirectUriRow label="Dropbox" uri={config.dropboxRedirectUri} />
                  </div>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="rounded-lg bg-white dark:bg-white/[0.04] border border-amber-100 dark:border-amber-800/30 p-3">
                      <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">Google Cloud Console</p>
                      <ol className="list-decimal list-inside space-y-0.5 text-xs text-amber-800 dark:text-amber-300">
                        <li>APIs &amp; Services → Credentials</li>
                        <li>Open your OAuth 2.0 Client ID</li>
                        <li>Add the Google URI above under Authorized redirect URIs</li>
                        <li>Enable <strong>Google Drive API</strong> + <strong>People API</strong></li>
                      </ol>
                    </div>
                    <div className="rounded-lg bg-white dark:bg-white/[0.04] border border-amber-100 dark:border-amber-800/30 p-3">
                      <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">Dropbox App Console</p>
                      <ol className="list-decimal list-inside space-y-0.5 text-xs text-amber-800 dark:text-amber-300">
                        <li>developers.dropbox.com → Your App → Settings</li>
                        <li>Add the Dropbox URI above under Redirect URIs</li>
                        <li>Set permissions: <code className="bg-amber-100 dark:bg-amber-900/30 px-1 rounded">files.content.read</code>, <code className="bg-amber-100 dark:bg-amber-900/30 px-1 rounded">files.content.write</code></li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2 — Enter Credentials */}
              <div>
                <h4 className="mb-3 text-xs font-semibold uppercase text-amber-700 dark:text-amber-400 tracking-wide">
                  Step 2 — Enter Your OAuth Credentials
                </h4>

                <div className="space-y-4">
                  {/* Google */}
                  <div className="rounded-xl bg-white dark:bg-white/[0.04] border border-amber-100 dark:border-amber-800/30 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                          <path d="M4.56 20l4-6.928H21l-4 6.928H4.56z" fill="#0F9D58" />
                          <path d="M3 17.072L7 10l4 6.928H3z" fill="#4285F4" />
                          <path d="M8.56 10h8l4 6.928H12.56L8.56 10z" fill="#FBBC05" />
                          <path d="M12 3l4 6.928H8L12 3z" fill="#EA4335" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Google Drive</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {oauthStatus && (
                          <>
                            <StatusBadge present={oauthStatus.GOOGLE_CLIENT_ID.present} source={oauthStatus.GOOGLE_CLIENT_ID.source} />
                            <span className="text-gray-300 dark:text-gray-700">·</span>
                            <StatusBadge present={oauthStatus.GOOGLE_CLIENT_SECRET.present} source={oauthStatus.GOOGLE_CLIENT_SECRET.source} />
                          </>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <SecretInput
                        label="Client ID"
                        fieldKey="GOOGLE_CLIENT_ID"
                        value={creds.GOOGLE_CLIENT_ID}
                        onChange={(v) => setCreds((c) => ({ ...c, GOOGLE_CLIENT_ID: v }))}
                      />
                      <SecretInput
                        label="Client Secret"
                        fieldKey="GOOGLE_CLIENT_SECRET"
                        value={creds.GOOGLE_CLIENT_SECRET}
                        onChange={(v) => setCreds((c) => ({ ...c, GOOGLE_CLIENT_SECRET: v }))}
                      />
                    </div>
                  </div>

                  {/* Dropbox */}
                  <div className="rounded-xl bg-white dark:bg-white/[0.04] border border-amber-100 dark:border-amber-800/30 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-blue-500" aria-hidden>
                          <path d="M6 6l6-4 6 4-6 4-6-4zm0 6l6-4 6 4-6 4-6-4zM0 9l6 4-6 4v-8zm12 0v8l6-4-6-4z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Personal Dropbox</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {oauthStatus && (
                          <>
                            <StatusBadge present={oauthStatus.DROPBOX_APP_KEY.present} source={oauthStatus.DROPBOX_APP_KEY.source} />
                            <span className="text-gray-300 dark:text-gray-700">·</span>
                            <StatusBadge present={oauthStatus.DROPBOX_APP_SECRET.present} source={oauthStatus.DROPBOX_APP_SECRET.source} />
                          </>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <SecretInput
                        label="App Key"
                        fieldKey="DROPBOX_APP_KEY"
                        value={creds.DROPBOX_APP_KEY}
                        onChange={(v) => setCreds((c) => ({ ...c, DROPBOX_APP_KEY: v }))}
                      />
                      <SecretInput
                        label="App Secret"
                        fieldKey="DROPBOX_APP_SECRET"
                        value={creds.DROPBOX_APP_SECRET}
                        onChange={(v) => setCreds((c) => ({ ...c, DROPBOX_APP_SECRET: v }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <button
                    onClick={handleSaveCreds}
                    disabled={saving || !anyCredInput}
                    className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving ? "Saving…" : "Save Credentials"}
                  </button>
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    Credentials are encrypted before being stored.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Default connector */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">Default Storage</h3>
          <div className="flex items-center gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="text-blue-600 dark:text-blue-400" aria-hidden>
                <path d="M6 6l6-4 6 4-6 4-6-4zm0 6l6-4 6 4-6 4-6-4zM0 9l6 4-6 4v-8zm12 0v8l6-4-6-4z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">App Dropbox (Shared)</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Managed by the application. Used by default if no connector is selected.
              </p>
            </div>
            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
              Active
            </span>
          </div>
        </div>

        {/* Connected accounts */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Connected Accounts</h3>
          </div>

          {loading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : connectors.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              No personal cloud accounts connected yet. Add one below.
            </p>
          ) : (
            <div className="space-y-3 mb-6">
              {connectors.map((c) => (
                <div
                  key={c._id}
                  className="flex items-center gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.02]"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                    {providerIcon(c.provider)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90 truncate">{c.name}</p>
                    {c.providerEmail && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{c.providerEmail}</p>
                    )}
                  </div>
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    Connected
                  </span>
                  <button
                    onClick={() => handleDelete(c._id, c.name)}
                    className="ml-2 rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-900/40 dark:text-red-400 dark:hover:bg-red-900/10"
                  >
                    Disconnect
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add connectors */}
          <h4 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">Add a Storage Account</h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <button
              onClick={googleReady ? connectGoogle : () => setShowSetup(true)}
              className={`flex items-center gap-3 rounded-xl border bg-gray-50 px-5 py-4 text-left transition-colors dark:bg-white/[0.02] ${
                googleReady
                  ? "border-gray-200 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/[0.05]"
                  : "border-amber-200 hover:bg-amber-50 dark:border-amber-800/40 dark:hover:bg-amber-900/10"
              }`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                {providerIcon("google_drive")}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">Google Drive</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {googleReady
                    ? "Store encrypted files in your Google Drive"
                    : "Credentials required — click to configure"}
                </p>
              </div>
            </button>

            <button
              onClick={dropboxReady ? connectDropbox : () => setShowSetup(true)}
              className={`flex items-center gap-3 rounded-xl border bg-gray-50 px-5 py-4 text-left transition-colors dark:bg-white/[0.02] ${
                dropboxReady
                  ? "border-gray-200 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/[0.05]"
                  : "border-amber-200 hover:bg-amber-50 dark:border-amber-800/40 dark:hover:bg-amber-900/10"
              }`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                {providerIcon("dropbox")}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">Personal Dropbox</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {dropboxReady
                    ? "Use your own Dropbox account"
                    : "Credentials required — click to configure"}
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
