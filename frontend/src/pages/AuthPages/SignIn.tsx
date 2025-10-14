// frontend/src/pages/AuthPages/SignIn.tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import AuthLayout from "./AuthPageLayout";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import AlertBanner from "../../components/common/AlertBanner";

type Alert = { kind: "success" | "warning" | "error" | "info"; msg: string };

export default function SignIn() {
  const navigate = useNavigate();
  const [alert, setAlert] = useState<Alert | null>(null);
  const [loading, setLoading] = useState(false);

  const [step, setStep] = useState<"creds" | "totp">("creds");
  const [tempToken, setTempToken] = useState<string>("");

  const [form, setForm] = useState({ email: "", password: "" });
  const [totp, setTotp] = useState(["", "", "", "", "", ""]); // 6 separate inputs

  function totpValue() {
    return totp.join("");
  }

  async function handleCreds(e: React.FormEvent) {
    e.preventDefault();
    setAlert(null);
    setLoading(true);
    try {
      const { data } = await axios.post(
        "http://localhost:5050/api/auth/login",
        { email: form.email, password: form.password },
        { withCredentials: true }
      );

      // Case 1: TOTP required
      if (data?.requiresTotp && data?.tempToken) {
        setTempToken(data.tempToken);
        setStep("totp");
        return;
      }

      // Case 2: fully authenticated
      navigate("/", { replace: true });
    } catch (err: any) {
      const apiMsg = err?.response?.data?.message || err?.response?.data?.error || "Login failed";
      setAlert({ kind: "error", msg: apiMsg });
    } finally {
      setLoading(false);
    }
  }

  async function handleTotp(e: React.FormEvent) {
    e.preventDefault();
    const code = totpValue();
    if (code.length !== 6) {
      setAlert({ kind: "warning", msg: "Enter the 6-digit code." });
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        "http://localhost:5050/api/auth/totp/verify",
        { code, tempToken },
        { withCredentials: true }
      );
      navigate("/", { replace: true });
    } catch (err: any) {
      const apiMsg = err?.response?.data?.message || err?.response?.data?.error || "Invalid code";
      setAlert({ kind: "error", msg: apiMsg });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <div className="flex flex-col flex-1 w-full overflow-y-auto lg:w-1/2 no-scrollbar">
        <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
          <div className="mb-6">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              {step === "creds" ? "Sign In" : "Two-Factor Authentication"}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {step === "creds" ? "Access your account" : "Enter the 6-digit code from your authenticator app"}
            </p>
          </div>

          {alert && (
            <AlertBanner
              kind={alert.kind}
              title={alert.kind === "error" ? "Error" : "Notice"}
              message={alert.msg}
              className="mb-4"
            />
          )}

          {step === "creds" ? (
            <form onSubmit={handleCreds} className="space-y-5">
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Password</Label>
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" size="sm" className="w-full" disabled={loading}>
                {loading ? "Signing in…" : "Sign In"}
              </Button>
              <p className="text-sm text-center text-gray-700 dark:text-gray-400">
                Don’t have an account?{" "}
                <Link to="/signup" className="text-brand-500 hover:text-brand-600 dark:text-brand-400">
                  Sign Up
                </Link>
              </p>
            </form>
          ) : (
            <form onSubmit={handleTotp} className="space-y-6">
              <div className="flex items-center justify-between gap-2">
                {totp.map((v, i) => (
                  <input
                    key={i}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={v}
                    onChange={(e) => {
                      const next = e.target.value.replace(/\D/g, "").slice(0, 1);
                      setTotp((prev) => {
                        const copy = [...prev];
                        copy[i] = next;
                        return copy;
                      });
                      if (next && i < 5) {
                        const el = document.getElementById(`totp-${i + 1}`) as HTMLInputElement | null;
                        el?.focus();
                        el?.select();
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !totp[i] && i > 0) {
                        const el = document.getElementById(`totp-${i - 1}`) as HTMLInputElement | null;
                        el?.focus();
                        el?.select();
                      }
                    }}
                    id={`totp-${i}`}
                    className="h-14 w-12 text-center text-xl rounded-lg border border-gray-300 bg-transparent dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  />
                ))}
              </div>
              <Button type="submit" size="sm" className="w-full" disabled={loading}>
                {loading ? "Verifying…" : "Verify Code"}
              </Button>
              <button
                type="button"
                onClick={() => setStep("creds")}
                className="mx-auto block text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                Use different account
              </button>
            </form>
          )}
        </div>
      </div>
    </AuthLayout>
  );
}