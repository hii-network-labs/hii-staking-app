import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { STAKEHUB_ABI } from '@/config/abi';
import { TransactionState } from '@/types';
import { useValidation } from './useValidation';
import { useStakingInfo } from './useStakingInfo';
import { usePoolStats } from './usePoolStats';
import { useDebounce } from './useDebounce';
import { formatErrorMessage } from '@/utils/errorHandler';

export function useUndelegate() {
  const { address } = useAccount();
  const { validateUndelegateAmount, validatePendingRequests } = useValidation();
  const { stakingInfo, refetch: refetchStakingInfo } = useStakingInfo();
  const { refetch: refetchPoolStats } = usePoolStats(stakingInfo?.creditContractAddress);
  const [state, setState] = useState<TransactionState>({
    isLoading: false,
    isSuccess: false,
    isError: false,
    error: null,
    txHash: null,
  });

  // Debounce refetch calls to prevent excessive RPC requests
  const debouncedRefetch = useDebounce(async () => {
    await refetchStakingInfo();
    await refetchPoolStats();
  }, 1000); // 1 second debounce

  const { writeContract, data: hash, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
    pollingInterval: 2000, // Poll every 2 seconds instead of default
  });

  // Update state based on transaction status
  useEffect(() => {
    if (isConfirming) {
      setState(prev => ({ ...prev, isLoading: true }));
    } else if (isConfirmed) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        isSuccess: true, 
        txHash: hash || null 
      }));
    } else if (writeError) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        isError: true, 
        error: writeError 
      }));
    }
  }, [isConfirming, isConfirmed, writeError, hash]);

  const undelegate = async (amount: string) => {
    if (!address) {
      setState(prev => ({ ...prev, isError: true, error: new Error('Wallet not connected') }));
      return;
    }

    // Reset state when starting new transaction
    setState({
      isLoading: false,
      isSuccess: false,
      isError: false,
      error: null,
      txHash: null,
    });

    // Validate the amount before proceeding
    const amountValidation = validateUndelegateAmount(amount);
    if (!amountValidation.isValid) {
      setState(prev => ({ 
        ...prev, 
        isError: true, 
        error: new Error(amountValidation.error || 'Invalid amount') 
      }));
      return;
    }

    // Validate pending requests limit
    const pendingValidation = validatePendingRequests();
    if (!pendingValidation.isValid) {
      setState(prev => ({ 
        ...prev, 
        isError: true, 
        error: new Error(pendingValidation.error || 'Too many pending requests') 
      }));
      return;
    }

    try {
      setState(prev => ({ 
        ...prev, 
        isLoading: true, 
        isError: false, 
        isSuccess: false, 
        error: null 
      }));

      // For max amount, use all shares; otherwise calculate shares from amount
      let sharesToUndelegate: bigint;
      
      if (stakingInfo?.pooledHIIRaw && stakingInfo.pooledHIIRaw > 0n) {
        const amountWei = parseEther(amount);
        
        // Check if this is max amount (within small tolerance for precision)
        const isMaxAmount = amountWei >= stakingInfo.pooledHIIRaw * 999n / 1000n; // 99.9% threshold
        
        if (isMaxAmount) {
          // Use all shares for max amount to avoid precision issues
          sharesToUndelegate = stakingInfo.sharesRaw || 0n;
        } else {
          // Calculate proportional shares for partial amount
          sharesToUndelegate = (amountWei * (stakingInfo.sharesRaw || 0n)) / stakingInfo.pooledHIIRaw;
        }
      } else {
        // Fallback: convert amount to shares (this shouldn't happen in normal flow)
        sharesToUndelegate = parseEther(amount);
      }
      
      // Call undelegate function with operatorAddress and shares
      writeContract({
        address: CONTRACT_ADDRESSES.STAKEHUB as `0x${string}`,
        abi: STAKEHUB_ABI,
        functionName: 'undelegate',
        args: [CONTRACT_ADDRESSES.OPERATOR as `0x${string}`, sharesToUndelegate],
      });

    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isError: true, 
        error: new Error(formatErrorMessage(error)),
        isLoading: false 
      }));
    }
  };

  // Function to reset transaction state
  const resetState = () => {
    setState({
      isLoading: false,
      isSuccess: false,
      isError: false,
      error: null,
      txHash: null,
    });
  };

  // Update state based on transaction status
  React.useEffect(() => {
    if (isConfirming) {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
    } else if (isConfirmed) {
      setState(prev => ({ ...prev, isLoading: false, isSuccess: true }));
      // Use debounced refetch to prevent excessive RPC calls
      debouncedRefetch();
    } else if (writeError) {
      setState(prev => ({ ...prev, isLoading: false, error: new Error(formatErrorMessage(writeError)) }));
    }
  }, [isConfirming, isConfirmed, writeError, debouncedRefetch]);

  return {
    undelegate,
    resetState,
    ...state,
  };
}