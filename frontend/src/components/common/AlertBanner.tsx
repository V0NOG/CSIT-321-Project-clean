import { useMemo } from "react";
import Alert from "../ui/alert/Alert";

type Kind = "success" | "warning" | "error" | "info";

export default function AlertBanner({
  kind,
  title,
  message,
  className = "",
  linkHref,
  linkText,
}: {
  kind: Kind;
  title?: string;
  message: string;
  className?: string;
  linkHref?: string;
  linkText?: string;
}) {
  const variant = useMemo(() => {
    switch (kind) {
      case "success":
      case "warning":
      case "error":
      case "info":
        return kind;
      default:
        return "info";
    }
  }, [kind]);

  return (
    <div className={className}>
      <Alert
        variant={variant}
        title={title ?? ""}
        message={message}
        showLink={!!linkHref && !!linkText}
        linkHref={linkHref}
        linkText={linkText}
      />
    </div>
  );
}