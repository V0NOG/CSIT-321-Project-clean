import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useNavigate } from "react-router-dom";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import Button from "../ui/button/Button";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import Alert from "../ui/alert/Alert";

type AlertVariant = "success" | "warning" | "error" | "info";

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberEmail, setRememberEmail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showTotp, setShowTotp] = useState(false);
  const [totpCode, setTotpCode] = useState("");

  // TailAdmin alert state
  const [banner, setBanner] = useState<{
    show: boolean;
    variant: AlertVariant;
    title: string;
    message: string;
  }>({ show: false, variant: "info", title: "", message: "" });

  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    const savedEmail = localStorage.getItem("savedEmail");
    if (savedEmail) {
      setFormData((prev) => ({ ...prev, email: savedEmail }));
      setRememberEmail(true);
    }
  }, []);

  function showAlert(variant: AlertVariant, title: string, message: string) {
    setBanner({ show: true, variant, title, message });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setBanner((b) => ({ ...b, show: false }));

    try {
      const body: any = {
        email: formData.email,
        password: formData.password,
      };
      if (showTotp && totpCode.trim()) {
        body.totpCode = totpCode.trim();
      }

      const res = await axios.post(
        "http://localhost:5050/api/auth/login",
        body,
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      );

      const { token, user } = res.data || {};
      if (token) localStorage.setItem("token", token);

      login(token || "", user);

      if (rememberEmail) {
        localStorage.setItem("savedEmail", formData.email);
      } else {
        localStorage.removeItem("savedEmail");
      }

      navigate("/", { replace: true });
    } catch (err: any) {
      const apiMsg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Login failed";

      // If backend signals TOTP is required, reveal the TOTP field and guide the user
      if (/totp required/i.test(apiMsg)) {
        setShowTotp(true);
        showAlert(
          "warning",
          "Two-Factor Required",
          "Enter the 6-digit code from your authenticator app to finish signing in."
        );
      } else {
        showAlert("error", "Error", apiMsg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col flex-1">
      <div className="w-full max-w-md pt-10 mx-auto">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-200 dark:hover:text-white"
        >
          <ChevronLeftIcon className="size-5" />
          Back to dashboard
        </Link>
      </div>

      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign In
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-200">
              Enter your email and password to sign in.
            </p>
          </div>

          {/* TailAdmin alert banner */}
          {banner.show && (
            <div className="mb-4">
              <Alert
                variant={banner.variant}
                title={banner.title}
                message={banner.message}
                showLink={false}
              />
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <Label>
                  Email <span className="text-error-500">*</span>
                </Label>
                <Input
                  type="email"
                  placeholder="example@email.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label>
                  Password <span className="text-error-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                  />
                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                  >
                    {showPassword ? (
                      <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                    ) : (
                      <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                    )}
                  </span>
                </div>
              </div>

              {/* Conditionally render TOTP field when required */}
              {showTotp && (
                <div>
                  <Label>
                    6-Digit Authenticator Code{" "}
                    <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="123456"
                    maxLength={6}
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-200">
                    Open Google Authenticator, 1Password, or Authy to get your code.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={rememberEmail}
                    onChange={setRememberEmail}
                  />
                  <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-200">
                    Remember email
                  </span>
                </div>
                <Link
                  to="/reset-password"
                  className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Forgot password?
                </Link>
              </div>

              <div>
                <Button className="w-full" size="sm" type="submit" disabled={loading}>
                  {loading ? "Signing in…" : showTotp ? "Verify & Sign in" : "Sign in"}
                </Button>
              </div>
            </div>
          </form>

          <div className="mt-5">
            <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-200 sm:text-start">
              Don&apos;t have an account?{" "}
              <Link
                to="/signup"
                className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
              >
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}