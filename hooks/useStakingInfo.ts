import { useAccount, useContractRead } from 'wagmi';
import { formatEther } from 'viem';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { STAKEHUB_ABI, STAKE_CREDIT_ABI } from '@/config/abi';
import { useCallback } from 'react';

export interface StakingInfo {
  balance: string;
  pooledHII: string;
  pooledHIIRaw: bigint;
  shares: string;
  sharesRaw: bigint;
  pendingUnbondRequest: string;
  claimableUnbondRequest: string;
  creditContractAddress?: string;
}

export function useStakingInfo() {
  const { address } = useAccount();
  
  // Use the connected wallet address directly
  const effectiveAddress = address;

  // Get credit contract address for the operator
  const { data: creditContractAddress, isError: creditError, isLoading: creditLoading, refetch: refetchCredit } = useContractRead({
    address: CONTRACT_ADDRESSES.STAKEHUB as `0x${string}`,
    abi: STAKEHUB_ABI,
    functionName: 'getValidatorCreditContract',
    args: [CONTRACT_ADDRESSES.OPERATOR as `0x${string}`],
    query: {
      enabled: !!effectiveAddress,
      refetchInterval: false, // Disable automatic polling
    },
  });

  // Read balance from credit contract
  const { data: balance, isError: balanceError, isLoading: balanceLoading, refetch: refetchBalance } = useContractRead({
    address: creditContractAddress,
    abi: STAKE_CREDIT_ABI,
    functionName: 'balanceOf',
    args: effectiveAddress ? [effectiveAddress] : undefined,
    query: {
      enabled: !!creditContractAddress && !!effectiveAddress && creditContractAddress !== '0x0000000000000000000000000000000000000000',
      refetchInterval: false, // Disable automatic polling
    },
  });

  // Read pooled BNB for the user's account
  const { data: pooledBNB, isError: pooledBNBError, isLoading: pooledBNBLoading, refetch: refetchPooledBNB } = useContractRead({
    address: creditContractAddress,
    abi: STAKE_CREDIT_ABI,
    functionName: 'getPooledBNB',
    args: effectiveAddress ? [effectiveAddress] : undefined,
    query: {
      enabled: !!creditContractAddress && !!effectiveAddress && creditContractAddress !== '0x0000000000000000000000000000000000000000',
      refetchInterval: false, // Disable automatic polling
    },
  });

  // Read shares by pooled BNB amount
  const { data: shares, isError: sharesError, isLoading: sharesLoading, refetch: refetchShares } = useContractRead({
    address: creditContractAddress,
    abi: STAKE_CREDIT_ABI,
    functionName: 'getSharesByPooledBNB',
    args: pooledBNB ? [pooledBNB] : undefined,
    query: {
      enabled: !!creditContractAddress && !!pooledBNB && creditContractAddress !== '0x0000000000000000000000000000000000000000',
      refetchInterval: false, // Disable automatic polling
    },
  });

  // Read pending unbond request from credit contract
  const { data: pendingUnbondRequest, isError: pendingError, isLoading: pendingLoading, refetch: refetchPending } = useContractRead({
    address: creditContractAddress,
    abi: STAKE_CREDIT_ABI,
    functionName: 'pendingUnbondRequest',
    args: effectiveAddress ? [effectiveAddress] : undefined,
    query: {
      enabled: !!creditContractAddress && !!effectiveAddress && creditContractAddress !== '0x0000000000000000000000000000000000000000',
      refetchInterval: false, // Disable automatic polling
    },
  });

  // Read claimable unbond request from credit contract
  const { data: claimableUnbondRequest, isError: claimableError, isLoading: claimableLoading, refetch: refetchClaimable } = useContractRead({
    address: creditContractAddress,
    abi: STAKE_CREDIT_ABI,
    functionName: 'claimableUnbondRequest',
    args: effectiveAddress ? [effectiveAddress] : undefined,
    query: {
      enabled: !!creditContractAddress && !!effectiveAddress && creditContractAddress !== '0x0000000000000000000000000000000000000000',
      refetchInterval: false, // Disable automatic polling
    },
  });

  const stakingInfo: StakingInfo = {
    balance: balance ? formatEther(balance) : '0',
    pooledHII: pooledBNB ? formatEther(pooledBNB) : '0',
    pooledHIIRaw: pooledBNB || 0n,
    shares: shares ? formatEther(shares) : '0',
    sharesRaw: shares || 0n,
    pendingUnbondRequest: pendingUnbondRequest ? pendingUnbondRequest.toString() : '0',
    claimableUnbondRequest: claimableUnbondRequest ? claimableUnbondRequest.toString() : '0',
    creditContractAddress: creditContractAddress as string,
  };

  const isLoading = creditLoading || balanceLoading || pooledBNBLoading || sharesLoading || pendingLoading || claimableLoading;
  const isError = creditError || balanceError || pooledBNBError || sharesError || pendingError || claimableError;

  // Optimized refetch function with debouncing and batching
  const refetch = useCallback(async () => {
    try {
      // Batch critical calls first (credit contract and balance)
      await Promise.all([
        refetchCredit(),
        refetchBalance()
      ]);
      
      // Small delay to ensure credit contract is available
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Batch remaining calls with longer intervals to reduce RPC load
      await Promise.all([
        refetchPooledBNB(),
        refetchPending(),
        refetchClaimable()
      ]);
      
      // Shares calculation depends on pooledBNB, so call it last
      await new Promise(resolve => setTimeout(resolve, 100));
      refetchShares();
      
    } catch (error) {
      console.error('Error during refetch:', error);
    }
  }, [refetchCredit, refetchBalance, refetchPooledBNB, refetchShares, refetchPending, refetchClaimable]);

  return {
    stakingInfo,
    isLoading,
    isError,
    refetch,
  };
}