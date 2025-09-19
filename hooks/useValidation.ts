import { parseEther } from 'viem';
import { useBalance } from 'wagmi';
import { useAccount } from 'wagmi';
import { useStakingInfo } from './useStakingInfo';

export interface ValidationRules {
  minDelegationAmount: bigint;
  maxUnstakeAmount: bigint;
  walletBalance: bigint;
  isLoading: boolean;
}

export function useValidation() {
  const { address } = useAccount();
  const { stakingInfo, isLoading: stakingLoading } = useStakingInfo();
  const { data: balance, isLoading: balanceLoading } = useBalance({
    address,
    query: {
      refetchInterval: false, // Disable automatic polling
    },
  });

  const validationRules: ValidationRules = {
    minDelegationAmount: parseEther('1'), // 1 HII minimum
    maxUnstakeAmount: stakingInfo?.pooledHIIRaw || 0n,
    walletBalance: balance?.value || 0n,
    isLoading: stakingLoading || balanceLoading,
  };


  const validateDelegateAmount = (amount: string): { isValid: boolean; error?: string } => {
    if (!amount || amount === '0') {
      return { isValid: false, error: 'Amount is required' };
    }

    try {
      const amountWei = parseEther(amount);
      
      if (amountWei < validationRules.minDelegationAmount) {
        return { isValid: false, error: 'Minimum delegation amount is 1 HII' };
      }

      if (amountWei > validationRules.walletBalance) {
        return { isValid: false, error: 'Insufficient wallet balance' };
      }

      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: 'Invalid amount format' };
    }
  };

  const validateUndelegateAmount = (amount: string): { isValid: boolean; error?: string } => {
    if (!amount || amount === '0') {
      return { isValid: false, error: 'Amount is required' };
    }

    try {
      const amountWei = parseEther(amount);
      
      if (amountWei > validationRules.maxUnstakeAmount) {
        return { isValid: false, error: 'Amount exceeds staked balance' };
      }

      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: 'Invalid amount format' };
    }
  };

  const validatePendingRequests = (): { isValid: boolean; error?: string } => {
    // Check if there are too many pending unbond requests
    const maxPendingRequests = 7; // BSC StakeHub limit
    const currentPendingRequests = Number(stakingInfo?.pendingUnbondRequest || 0);
    
    if (currentPendingRequests >= maxPendingRequests) {
      return { 
        isValid: false, 
        error: `Maximum ${maxPendingRequests} pending unbond requests allowed. You currently have ${currentPendingRequests}.` 
      };
    }

    return { isValid: true };
  };

  return {
    validationRules,
    validateDelegateAmount,
    validateUndelegateAmount,
    validatePendingRequests,
  };
}