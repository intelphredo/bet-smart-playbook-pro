
import { useEffect } from "react";

export function useAutoRefresh(
  refreshInterval: number,
  callback: () => void
) {
  useEffect(() => {
    callback();
    const intervalId = setInterval(callback, refreshInterval);
    return () => clearInterval(intervalId);
  }, [refreshInterval, callback]);
}
