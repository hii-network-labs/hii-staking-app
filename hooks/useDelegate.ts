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

export function useDelegate() {
  const { address } = useAccount();
  const { validateDelegateAmount } = useValidation();
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
  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed, 
    isError: isReceiptError,
    data: receipt 
  } = useWaitForTransactionReceipt({
    hash,
    pollingInterval: 2000, // Poll every 2 seconds instead of default
  });

  // Update state based on transaction status
  useEffect(() => {
    if (isConfirming) {
      setState(prev => ({ ...prev, isLoading: true }));
    } else if (isConfirmed && receipt) {
      // Check if transaction was successful by examining the receipt status
      if (receipt.status === 'success') {
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          isSuccess: true, 
          txHash: hash || null 
        }));
      } else {
        // Transaction was mined but failed (reverted)
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          isError: true, 
          error: new Error('Transaction failed: The transaction was reverted'),
          txHash: hash || null 
        }));
      }
    } else if (isReceiptError || writeError) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        isError: true, 
        error: writeError || new Error('Failed to get transaction receipt')
      }));
    }
  }, [isConfirming, isConfirmed, isReceiptError, writeError, hash, receipt]);

  const delegate = async (amount: string) => {
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

    const validation = validateDelegateAmount(amount);
    if (!validation.isValid) {
      setState(prev => ({ 
        ...prev, 
        isError: true, 
        error: new Error(validation.error || 'Invalid amount') 
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

      // Call delegate function with operatorAddress and amount
      writeContract({
        address: CONTRACT_ADDRESSES.STAKEHUB as `0x${string}`,
        abi: STAKEHUB_ABI,
        functionName: 'delegate',
        args: [CONTRACT_ADDRESSES.OPERATOR as `0x${string}`, true],
        value: parseEther(amount),
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
    delegate,
    resetState,
    ...state,
  };
}