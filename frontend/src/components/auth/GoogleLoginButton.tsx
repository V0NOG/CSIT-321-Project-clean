import { useEffect, useRef, useState } from "react";
import axios from "axios";
import Button from "../ui/button/Button";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

declare global {
  interface Window { google?: any }
}

export default function GoogleLoginButton() {
  const btnDiv = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string>("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!CLIENT_ID) {
      setError("Google Client ID is not set. Define VITE_GOOGLE_CLIENT_ID in frontend/.env");
      return;
    }
    const src = "https://accounts.google.com/gsi/client";
    if (document.querySelector(`script[src="${src}"]`)) { setReady(true); return; }
    const s = document.createElement("script");
    s.src = src; s.async = true; s.defer = true; s.onload = () => setReady(true);
    document.body.appendChild(s);
  }, [CLIENT_ID]);

  useEffect(() => {
    if (!ready || !window.google || !btnDiv.current || !CLIENT_ID) return;

    window.google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: async (resp: { credential: string }) => {
        try {
          const res = await axios.post(
            "http://localhost:5050/api/auth/google",
            { idToken: resp.credential },
            { withCredentials: true }
          );
          const { token, user } = res.data || {};
          if (token) localStorage.setItem("token", token);
          login(token || "", user);
          navigate("/", { replace: true });
        } catch (e: any) {
          alert(e?.response?.data?.error || "Google login failed");
        }
      },
      ux_mode: "popup",
      context: "signin",
    });

    window.google.accounts.id.renderButton(btnDiv.current, {
      theme: "outline", size: "large", shape: "pill", text: "signin_with", logo_alignment: "left", width: 320,
    });
  }, [ready, CLIENT_ID, login, navigate]);

  if (error) {
    return <p className="mt-3 text-sm text-error-600">{error}</p>;
  }

  return (
    <div className="mt-4 flex flex-col items-center">
      <div ref={btnDiv} />
      {!ready && (
        <Button variant="outline" size="sm" disabled className="mt-2">Loading Google…</Button>
      )}
    </div>
  );
}