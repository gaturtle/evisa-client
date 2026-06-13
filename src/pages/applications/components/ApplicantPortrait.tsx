import { useEffect, useState } from "react";
import { env } from "@/config/env";

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

export function ApplicantPortrait({
  portraitPhotoPath,
  firstName,
  lastName,
  size = 40,
}: {
  portraitPhotoPath: string | null;
  firstName: string;
  lastName: string;
  size?: number;
}) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!portraitPhotoPath) return;
    let cancelled = false;
    const token = localStorage.getItem("token");
    fetch(`${env.apiBaseUrl}${portraitPhotoPath}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => res.blob())
      .then((blob) => {
        if (!cancelled) setBlobUrl(URL.createObjectURL(blob));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      setBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [portraitPhotoPath]);

  const style = { width: size, height: size };

  if (!portraitPhotoPath || !blobUrl) {
    return (
      <div
        className="flex shrink-0 items-center justify-center rounded bg-muted text-xs font-medium text-muted-foreground"
        style={style}
      >
        {getInitials(firstName, lastName) || "?"}
      </div>
    );
  }

  return (
    <img
      src={blobUrl}
      alt={`${firstName} ${lastName}`}
      className="shrink-0 rounded object-cover"
      style={style}
    />
  );
}
