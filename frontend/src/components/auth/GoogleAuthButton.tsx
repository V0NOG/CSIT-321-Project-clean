// frontend/src/components/auth/GoogleAuthButton.tsx
import { useEffect, useRef } from "react";
import axios from "axios";

declare global {
  interface Window {
    google?: any;
  }
}

export default function GoogleAuthButton({
  onError,
}: {
  onError?: (msg: string) => void;
}) {
  const divRef = useRef<HTMLDivElement | null>(null);
  const onErrorRef = useRef(onError);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  useEffect(() => {
    const src = "https://accounts.google.com/gsi/client";
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);

    if (!existing) {
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.defer = true;
      s.onload = init;
      document.head.appendChild(s);
    } else {
      if ((existing as any)._loaded) init();
      else existing.addEventListener("load", init, { once: true });
    }

    function init() {
      (document.querySelector(`script[src="${src}"]`) as any)._loaded = true;
      const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!CLIENT_ID) {
        onErrorRef.current?.("Missing VITE_GOOGLE_CLIENT_ID in frontend/.env");
        return;
      }
      if (!window.google || !divRef.current) return;

      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: async (resp: { credential?: string }) => {
          try {
            if (!resp?.credential) throw new Error("No Google credential from GIS");
            const result = await axios.post(
              "/api/auth/google",
              { idToken: resp.credential },
              { withCredentials: true }
            );
            const { token } = result.data || {};
            if (token) localStorage.setItem("token", token);
            window.location.href = "/";
          } catch (e: any) {
            const msg =
              e?.response?.data?.error ||
              e?.response?.data?.message ||
              e?.message ||
              "Google login failed";
            onErrorRef.current?.(msg);
          }
        },
        auto_select: false,
        ux_mode: "popup",
      });

      window.google.accounts.id.renderButton(divRef.current, {
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "pill",
      });
    }
  }, []);

  return (
    <div className="flex justify-center">
      <div ref={divRef} />
    </div>
  );
}