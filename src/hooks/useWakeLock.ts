import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "pulse-keep-awake";

type WakeLockSentinelLike = {
  released: boolean;
  release: () => Promise<void>;
  addEventListener: (type: string, cb: () => void) => void;
};

function readStored(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === null ? true : raw === "true";
  } catch {
    return true;
  }
}

/**
 * Keeps the device screen awake while the app is open (Screen Wake Lock API).
 * The user's preference persists in localStorage.
 */
export function useWakeLock() {
  const [enabled, setEnabled] = useState<boolean>(readStored);
  const [active, setActive] = useState(false);
  const sentinelRef = useRef<WakeLockSentinelLike | null>(null);

  const supported =
    typeof navigator !== "undefined" && "wakeLock" in navigator;

  const release = useCallback(async () => {
    const s = sentinelRef.current;
    sentinelRef.current = null;
    setActive(false);
    if (s && !s.released) {
      try {
        await s.release();
      } catch {
        /* ignore */
      }
    }
  }, []);

  const request = useCallback(async () => {
    if (!supported || sentinelRef.current) return;
    if (document.visibilityState !== "visible") return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const s = (await (navigator as any).wakeLock.request("screen")) as WakeLockSentinelLike;
      sentinelRef.current = s;
      setActive(true);
      s.addEventListener("release", () => {
        if (sentinelRef.current === s) sentinelRef.current = null;
        setActive(false);
      });
    } catch {
      setActive(false);
    }
  }, [supported]);

  // Persist preference
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(enabled));
    } catch {
      /* ignore */
    }
  }, [enabled]);

  // Acquire / release based on preference and reacquire when tab becomes visible
  useEffect(() => {
    if (!supported) return;

    if (enabled) request();
    else release();

    const onVisibility = () => {
      if (document.visibilityState === "visible" && enabled) request();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled, supported, request, release]);

  // Release on unmount
  useEffect(() => () => { void release(); }, [release]);

  const toggle = useCallback(() => setEnabled((v) => !v), []);

  return { supported, enabled, active, toggle };
}
