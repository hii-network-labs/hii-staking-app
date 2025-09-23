import { useState, useEffect } from 'react';
import { useUnbondRequests } from './useUnbondRequests';

interface RealTimeUnbondCounts {
  pendingCount: number;
  claimableCount: number;
  isLoading: boolean;
}

export function useRealTimeUnbondCounts(
  initialPendingCount: number,
  initialClaimableCount: number,
  creditContractAddress: string
): RealTimeUnbondCounts {
  const [realTimeCounts, setRealTimeCounts] = useState({
    pendingCount: initialPendingCount,
    claimableCount: initialClaimableCount,
  });

  // Fetch unbond requests with auto-refresh enabled
  const { unbondRequests, isLoading } = useUnbondRequests(
    initialPendingCount,
    initialClaimableCount,
    creditContractAddress,
    true, // Enable auto-refresh
    5000  // Refresh every 5 seconds
  );

  useEffect(() => {
    if (unbondRequests.length === 0) {
      setRealTimeCounts({
        pendingCount: 0,
        claimableCount: 0,
      });
      return;
    }

    // Calculate real-time counts based on unlock times
    const now = Math.floor(Date.now() / 1000);
    let pendingCount = 0;
    let claimableCount = 0;

    unbondRequests.forEach((request) => {
      const unlockTime = Number(request.unlockTime);
      if (unlockTime <= now) {
        claimableCount++;
      } else {
        pendingCount++;
      }
    });

    setRealTimeCounts({
      pendingCount,
      claimableCount,
    });
  }, [unbondRequests]);

  // Update counts every second to handle real-time transitions
  useEffect(() => {
    if (unbondRequests.length === 0) return;

    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      let pendingCount = 0;
      let claimableCount = 0;

      unbondRequests.forEach((request) => {
        const unlockTime = Number(request.unlockTime);
        if (unlockTime <= now) {
          claimableCount++;
        } else {
          pendingCount++;
        }
      });

      setRealTimeCounts((prev) => {
        // Only update if counts have changed to avoid unnecessary re-renders
        if (prev.pendingCount !== pendingCount || prev.claimableCount !== claimableCount) {
          return { pendingCount, claimableCount };
        }
        return prev;
      });
    }, 1000); // Check every second for real-time updates

    return () => clearInterval(interval);
  }, [unbondRequests]);

  return {
    pendingCount: realTimeCounts.pendingCount,
    claimableCount: realTimeCounts.claimableCount,
    isLoading,
  };
}