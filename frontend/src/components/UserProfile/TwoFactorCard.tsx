// frontend/src/components/UserProfile/TwoFactorCard.tsx
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import { Link } from "react-router-dom";

export default function TwoFactorCard() {
  const { token } = useAuth();
  const [enabled, setEnabled] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    async function fetchStatus() {
      try {
        const res = await axios.get("http://localhost:5050/api/user/me", {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        // expects backend user to expose something like user.totpEnabled (boolean)
        if (mounted) setEnabled(!!res.data?.totpEnabled);
      } catch {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (token) fetchStatus();
    return () => { mounted = false };
  }, [token]);

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">Two-Factor Authentication</h4>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Add an extra layer of security to your account.
          </p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs
                          border-gray-200 dark:border-gray-700">
            <span className={`h-2 w-2 rounded-full ${enabled ? "bg-success-500" : "bg-gray-300 dark:bg-gray-600"}`} />
            <span className="text-gray-700 dark:text-gray-300">
              {loading ? "Checking…" : enabled ? "Enabled" : "Disabled"}
            </span>
          </div>
        </div>

        <Link
          to="/security/mfa"
          className="flex items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium shadow-theme-xs
                     hover:bg-gray-50 dark:hover:bg-white/[0.03]"
        >
          Manage
        </Link>
      </div>
    </div>
  );
}