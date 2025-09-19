import { useContractRead } from 'wagmi';
import { formatEther } from 'viem';
import { STAKE_CREDIT_ABI } from '@/config/abi';

export interface PoolStats {
  totalSupply: string;
  totalPooledHII: string;
  exchangeRate: string;
}

export function usePoolStats(creditContractAddress: string | undefined) {
  // Read total supply (total shares)
  const { data: totalSupply, isError: totalSupplyError, isLoading: totalSupplyLoading, refetch: refetchTotalSupply } = useContractRead({
    address: creditContractAddress as `0x${string}`,
    abi: STAKE_CREDIT_ABI,
    functionName: 'totalSupply',
    query: {
      enabled: !!creditContractAddress && creditContractAddress !== '0x0000000000000000000000000000000000000000',
      refetchInterval: false, // Disable automatic polling
    },
  });

  // Read total pooled BNB
  const { data: totalPooledBNB, isError: totalPooledBNBError, isLoading: totalPooledBNBLoading, refetch: refetchTotalPooledBNB } = useContractRead({
    address: creditContractAddress as `0x${string}`,
    abi: STAKE_CREDIT_ABI,
    functionName: 'totalPooledBNB',
    query: {
      enabled: !!creditContractAddress && creditContractAddress !== '0x0000000000000000000000000000000000000000',
      refetchInterval: false, // Disable automatic polling
    },
  });

  // Calculate exchange rate (BNB per share)
  const exchangeRate = totalSupply && totalPooledBNB && totalSupply > 0n 
    ? (Number(totalPooledBNB) / Number(totalSupply)).toFixed(6)
    : '1.000000';

  const poolStats: PoolStats = {
    totalSupply: totalSupply ? formatEther(totalSupply) : '0',
    totalPooledHII: totalPooledBNB ? formatEther(totalPooledBNB) : '0',
    exchangeRate,
  };

  const isLoading = totalSupplyLoading || totalPooledBNBLoading;
  const isError = totalSupplyError || totalPooledBNBError;

  // Optimized refetch function with batching
  const refetch = async () => {
    try {
      // Batch both calls to reduce RPC load
      await Promise.all([
        refetchTotalSupply(),
        refetchTotalPooledBNB()
      ]);
    } catch (error) {
      console.error('Error during pool stats refetch:', error);
    }
  };

  return {
    poolStats,
    isLoading,
    isError,
    refetch,
  };
}