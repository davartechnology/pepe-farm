"use client";
import { useCallback, useEffect, useRef } from "react";

interface ShowPromiseResult {
  done: boolean;
  description: string;
  state: "load" | "render" | "playing" | "destroy";
  error: boolean;
}

export function useAdsgram({
  blockId,
  onReward,
  onError,
}: {
  blockId: string;
  onReward: () => void;
  onError?: (result: ShowPromiseResult) => void;
}) {
  const AdControllerRef = useRef<any>(undefined);

  useEffect(() => {
    AdControllerRef.current = (window as any).Adsgram?.init({ blockId });
  }, [blockId]);

  return useCallback(async () => {
    if (!AdControllerRef.current) {
      onError?.({ done: false, description: "SDK not ready", state: "load", error: true });
      return;
    }
    AdControllerRef.current
      .show()
      .then(() => onReward())
      .catch((result: ShowPromiseResult) => onError?.(result));
  }, [onError, onReward]);
}
