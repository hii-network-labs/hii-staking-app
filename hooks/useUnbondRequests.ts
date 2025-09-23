import { useState, useEffect, useCallback, useRef } from 'react';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';

export interface UnbondRequest {
  shares: bigint;
  bnbAmount: bigint;
  unlockTime: bigint;
  requestTime: bigint;
  index: number;
  principle?: bigint;
  reward?: bigint;
}

interface UseUnbondRequestsResult {
  unbondRequests: UnbondRequest[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface CacheEntry {
  data: UnbondRequest[];
  timestamp: number;
  key: string;
}

// Global cache to persist data across component re-renders
const requestsCache = new Map<string, CacheEntry>();
const CACHE_DURATION = 30000; // 30 seconds cache duration

export function useUnbondRequests(
  pendingCount: number,
  claimableCount: number,
  creditContractAddress: string,
  enableAutoRefresh: boolean = false,
  refreshInterval: number = 5000
): UseUnbondRequestsResult {
  const { address } = useAccount();
  const [unbondRequests, setUnbondRequests] = useState<UnbondRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchUnbondRequests = useCallback(async (forceRefresh: boolean = false) => {
    if (!creditContractAddress || !address || (pendingCount === 0 && claimableCount === 0)) {
      setUnbondRequests([]);
      setError(null);
      return;
    }

    // Create cache key based on parameters
    const cacheKey = `${address}-${creditContractAddress}-${pendingCount}-${claimableCount}`;
    
    // Check cache first (unless force refresh is requested)
    if (!forceRefresh) {
      const cached = requestsCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        setUnbondRequests(cached.data);
        setError(null);
        return;
      }
    }

    setIsLoading(true);
    setError(null);
    const requests: UnbondRequest[] = [];

    try {
      // Fetch all unbond requests (both pending and claimable)
      const totalRequests = pendingCount + claimableCount;
      
      for (let i = 0; i < totalRequests; i++) {
        try {
          const response = await fetch('/api/unbond-request', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contractAddress: creditContractAddress,
              account: address,
              index: i,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            const bnbAmount = BigInt(data.hncAmount || '0');
            
            // Calculate principle and reward breakdown
            // For now, we'll assume the entire amount is principle
            // In a real scenario, you might need additional API calls or calculations
            const principle = bnbAmount; // This would need proper calculation
            const reward = 0n; // This would need proper calculation
            
            requests.push({
              shares: BigInt(data.shares || '0'),
              bnbAmount,
              unlockTime: BigInt(data.unlockTime || '0'),
              requestTime: BigInt(data.requestTime || '0'),
              index: i,
              principle,
              reward
            });
          } else {
            console.warn(`Failed to fetch unbond request ${i}:`, response.statusText);
          }
        } catch (error) {
          console.warn(`Error fetching unbond request ${i}:`, error);
        }
      }
      
      // Cache the results
      requestsCache.set(cacheKey, {
        data: requests,
        timestamp: Date.now(),
        key: cacheKey
      });
      
      setUnbondRequests(requests);
    } catch (error) {
      console.error('Error fetching unbond requests:', error);
      setError('Failed to load unbond requests');
    } finally {
      setIsLoading(false);
    }
  }, [pendingCount, claimableCount, creditContractAddress, address]);

  useEffect(() => {
    // Initial load
    fetchUnbondRequests();
    
    // Setup auto-refresh if enabled
    if (enableAutoRefresh && refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        fetchUnbondRequests(true); // Force refresh for interval updates
      }, refreshInterval);
    }
    
    // Cleanup interval on unmount or dependency change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchUnbondRequests, enableAutoRefresh, refreshInterval]);

  return {
    unbondRequests,
    isLoading,
    error,
    refetch: () => fetchUnbondRequests(true), // Force refresh when manually called
  };
}