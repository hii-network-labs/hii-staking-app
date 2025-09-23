import { useEffect, useRef } from 'react';
import { useStakingInfo } from './useStakingInfo';
import { useUnbondRequests } from './useUnbondRequests';

export function useStakingInfoWithAutoRefresh() {
  const stakingInfoResult = useStakingInfo();
  const { stakingInfo, refetch } = stakingInfoResult;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get unbond requests to check unlock times
  const { unbondRequests } = useUnbondRequests(
    parseInt(stakingInfo?.pendingUnbondRequest || '0'),
    parseInt(stakingInfo?.claimableUnbondRequest || '0'),
    stakingInfo?.creditContractAddress || '',
    false, // Don't enable auto-refresh in useUnbondRequests
    0
  );

  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Only set up auto-refresh if we have unbond requests
    if (unbondRequests.length === 0) {
      return;
    }

    // Find the next unlock time that hasn't passed yet
    const now = Math.floor(Date.now() / 1000);
    const nextUnlockTime = unbondRequests
      .map(request => Number(request.unlockTime))
      .filter(unlockTime => unlockTime > now)
      .sort((a, b) => a - b)[0];

    if (!nextUnlockTime) {
      // No pending requests, no need for auto-refresh
      return;
    }

    // Calculate time until next unlock (in milliseconds)
    const timeUntilUnlock = (nextUnlockTime - now) * 1000;
    
    // Set a timeout to refresh when the next request becomes claimable
    const timeoutId = setTimeout(() => {
      refetch();
      
      // After the first refresh, set up a regular interval to check for more unlocks
      // Check every 30 seconds to catch any subsequent unlocks
      intervalRef.current = setInterval(() => {
        refetch();
      }, 30000);
    }, timeUntilUnlock);

    // Cleanup function
    return () => {
      clearTimeout(timeoutId);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [unbondRequests, refetch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  return stakingInfoResult;
}