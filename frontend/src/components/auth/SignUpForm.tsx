// frontend/src/components/auth/SignUpForm.tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import axios from "axios";
import AlertBanner from "../common/AlertBanner";
import Button from "../ui/button/Button";
import GoogleAuthButton from "./GoogleAuthButton";

export default function SignUpForm() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [alert, setAlert] = useState<{ kind: "success" | "warning" | "error" | "info"; msg: string } | null>(null);

  const [formData, setFormData] = useState({
    fname: "",
    lname: "",
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAlert(null);

    if (!isChecked) {
      setAlert({ kind: "warning", msg: "Please accept the Terms and Privacy Policy to continue." });
      return;
    }

    try {
      await axios.post(
        "http://localhost:5050/api/auth/register",
        {
          firstName: formData.fname,
          lastName: formData.lname,
          email: formData.email,
          password: formData.password,
        },
        { withCredentials: true }
      );

      // Navigate to sign-in after successful registration
      navigate("/signin", { replace: true });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string; message?: string } } };
      const apiMsg = e?.response?.data?.error || e?.response?.data?.message || "Signup failed";
      setAlert({ kind: "error", msg: apiMsg });
    }
  };

  return (
    <div className="flex flex-col flex-1 w-full overflow-y-auto lg:w-1/2 no-scrollbar">
      <div className="w-full max-w-md mx-auto mb-5 sm:pt-10">
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
              Sign Up
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-200">Create your account</p>
          </div>

          {alert && (
            <AlertBanner
              kind={alert.kind}
              title={alert.kind === "error" ? "Error" : "Notice"}
              message={alert.msg}
              className="mb-4"
            />
          )}

          <div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <Label>
                      First Name<span className="text-error-500">*</span>
                    </Label>
                    <Input
                      type="text"
                      placeholder="Enter your first name"
                      value={formData.fname}
                      onChange={(e) => setFormData({ ...formData, fname: e.target.value })}
                      required
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <Label>
                      Last Name<span className="text-error-500">*</span>
                    </Label>
                    <Input
                      type="text"
                      placeholder="Enter your last name"
                      value={formData.lname}
                      onChange={(e) => setFormData({ ...formData, lname: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label>
                    Email<span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label>
                    Password<span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      placeholder="Enter your password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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

                <div className="flex items-center gap-3">
                  <Checkbox className="w-5 h-5" checked={isChecked} onChange={setIsChecked} />
                  <p className="inline-block font-normal text-gray-500 dark:text-gray-200">
                    By creating an account you agree to the{" "}
                    <span className="text-gray-800 dark:text-white/90">Terms</span> and our{" "}
                    <span className="text-gray-800 dark:text-white">Privacy Policy</span>
                  </p>
                </div>

                <div className="grid gap-3">
                  <Button type="submit" size="sm" className="w-full" disabled={!isChecked}>
                    Sign Up
                  </Button>

                  {/* Google button – doubles as sign up if user doesn't exist */}
                  <GoogleAuthButton onError={(msg) => setAlert({ kind: "error", msg })} />
                </div>
              </div>
            </form>

            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-200 sm:text-start">
                Already have an account?{" "}
                <Link to="/signin" className="text-brand-500 hover:text-brand-600 dark:text-brand-400">
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
