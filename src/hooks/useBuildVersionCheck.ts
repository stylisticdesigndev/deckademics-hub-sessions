import { useEffect, useRef } from "react";
import { toast } from "sonner";

declare const __BUILD_ID__: string;

const POLL_MS = 60_000; // every minute
const GRACE_MS = 10_000; // 10s grace before auto reload

/**
 * Polls /build-id.json and reloads when a new build is deployed.
 * Avoids users running stale JS bundles (esp. installed PWAs).
 */
export function useBuildVersionCheck() {
  const currentRef = useRef<string>(typeof __BUILD_ID__ !== "undefined" ? __BUILD_ID__ : "");
  const promptedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      if (promptedRef.current) return;
      try {
        const res = await fetch(`/build-id.json?ts=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { buildId?: string };
        if (cancelled || !data?.buildId) return;
        if (currentRef.current && data.buildId !== currentRef.current) {
          promptedRef.current = true;
          toast.message("A new version is available", {
            description: "Reloading shortly to apply the latest update…",
            duration: GRACE_MS,
            action: {
              label: "Reload now",
              onClick: () => window.location.reload(),
            },
          });
          setTimeout(() => window.location.reload(), GRACE_MS);
        }
      } catch {
        /* offline / network error — ignore */
      }
    };

    const interval = setInterval(check, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", check);
    // initial check shortly after mount
    const initial = setTimeout(check, 5_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
      clearTimeout(initial);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", check);
    };
  }, []);
}