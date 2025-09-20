import { useMemo } from 'react';
import { useContractRead } from 'wagmi';
import { STAKEHUB_ABI, STAKE_CREDIT_ABI } from '../config/abi';
import { CONTRACT_ADDRESSES } from '../config/contracts';
import {
  calculateTimeIndex,
  calculateDailyRate,
  calculateAPR,
  calculateAPY,
  calculateRewardEstimates,
  validateStakeAmount,
} from '../utils/rewardCalculations';
import { useValidatorAPYDual } from './useValidatorAPYDual';
import { ENV } from '@/config/env';

interface RewardEstimationV2Result {
  apy: number;
  apr: number;
  dailyRate: number;
  isLoading: boolean;
  error: string | null;
  rewards: {
    daily: number;
    weekly: number;
    monthly: number;
    yearly: number;
  };
  // New dual-mode APY data
  dualModeAPY?: {
    apy: number;
    mode: 'development' | 'production';
    blockNumber: string;
    timeIndex: string;
  };
}

interface ValidatorRecordData {
  totalPooledAmount: bigint;
  rewardAmount: bigint;
  breatheBlockInterval: bigint;
  currentBlockTime: number;
  index: bigint;
}

export function useRewardEstimationV2(
  validatorAddress: string,
  stakeAmount: string
): RewardEstimationV2Result {
  // Validate stake amount
  const { isValid, parsedAmount, error: validationError } = validateStakeAmount(stakeAmount);

  // Use dual-mode APY calculation for better accuracy
  const dualModeAPY = useValidatorAPYDual({
    validatorAddress,
    enabled: !!validatorAddress && isValid,
    mode: ENV.APY_CALCULATION_MODE as 'development' | 'production'
  });

  // Get breathe block interval
  const { data: breatheBlockInterval, isLoading: isLoadingInterval } = useContractRead({
    address: CONTRACT_ADDRESSES.STAKEHUB as `0x${string}`,
    abi: STAKEHUB_ABI,
    functionName: 'BREATHE_BLOCK_INTERVAL',
  });

  // Get latest block to use its timestamp for time index calculation
  const { data: latestBlock } = useContractRead({
    address: CONTRACT_ADDRESSES.STAKEHUB as `0x${string}`,
    abi: [],
    functionName: 'number', // This will get the latest block
    query: {
      enabled: false, // We'll use a different approach
    },
  });

  // Calculate current time index based on latest block timestamp and breathe interval
  const currentTimeIndex = useMemo(() => {
    if (!breatheBlockInterval) return 0n;
    
    // For development mode, use the hardcoded block timestamp approach
    if (ENV.APY_CALCULATION_MODE === 'development' && ENV.DEV_BLOCK_NUMBER) {
      // Use a known timestamp that corresponds to block 439878
      // This ensures consistency with the dual-mode calculation
      const devBlockTimestamp = 1758250800; // Timestamp from the working dual-mode calculation
      return calculateTimeIndex(devBlockTimestamp, breatheBlockInterval as bigint);
    }
    
    // For production, we need to get the actual latest block timestamp
    // For now, use current time but subtract some buffer to account for block time lag
    const currentTime = Math.floor(Date.now() / 1000) - 300; // 5 minute buffer
    return calculateTimeIndex(currentTime, breatheBlockInterval as bigint);
  }, [breatheBlockInterval]);

  // Get validator credit contract address
  const { data: creditContract } = useContractRead({
    address: CONTRACT_ADDRESSES.STAKEHUB as `0x${string}`,
    abi: STAKEHUB_ABI,
    functionName: 'getValidatorCreditContract',
    args: [validatorAddress as `0x${string}`],
    query: {
      enabled: !!validatorAddress && isValid,
    },
  });

  // Check if validator has active credit contract
  const hasActiveCreditContract = creditContract && creditContract !== '0x0000000000000000000000000000000000000000';

  // Get total pooled BNB amount for current time index (using correct function name from ABI)
  const { data: totalPooledAmount, isLoading: isLoadingPooled } = useContractRead({
    address: CONTRACT_ADDRESSES.STAKEHUB as `0x${string}`,
    abi: STAKEHUB_ABI,
    functionName: 'getValidatorTotalPooledBNBRecord',
    args: [validatorAddress as `0x${string}`, currentTimeIndex],
    query: {
      enabled: !!validatorAddress && !!currentTimeIndex && isValid && hasActiveCreditContract,
    },
  });

  // Get reward amount for current time index (using correct function name from ABI)
  const { data: rewardAmount, isLoading: isLoadingReward } = useContractRead({
    address: CONTRACT_ADDRESSES.STAKEHUB as `0x${string}`,
    abi: STAKEHUB_ABI,
    functionName: 'getValidatorRewardRecord',
    args: [validatorAddress as `0x${string}`, currentTimeIndex],
    query: {
      enabled: !!validatorAddress && !!currentTimeIndex && isValid && hasActiveCreditContract,
    },
  });

  // Fallback: Try previous time index if current returns zero
  const previousTimeIndex = currentTimeIndex ? currentTimeIndex - 1n : undefined;
  const { data: previousRewardAmount, isLoading: isLoadingPreviousReward } = useContractRead({
    address: CONTRACT_ADDRESSES.STAKEHUB as `0x${string}`,
    abi: STAKEHUB_ABI,
    functionName: 'getValidatorRewardRecord',
    args: previousTimeIndex ? [validatorAddress as `0x${string}`, previousTimeIndex] : undefined,
    query: {
      enabled: !!validatorAddress && !!previousTimeIndex && isValid && hasActiveCreditContract && rewardAmount === 0n,
    },
  });

  // Fallback: Try time index from 2 periods ago if previous also returns zero
  const olderTimeIndex = currentTimeIndex ? currentTimeIndex - 2n : undefined;
  const { data: olderRewardAmount, isLoading: isLoadingOlderReward } = useContractRead({
    address: CONTRACT_ADDRESSES.STAKEHUB as `0x${string}`,
    abi: STAKEHUB_ABI,
    functionName: 'getValidatorRewardRecord',
    args: olderTimeIndex ? [validatorAddress as `0x${string}`, olderTimeIndex] : undefined,
    query: {
      enabled: !!validatorAddress && !!olderTimeIndex && isValid && hasActiveCreditContract && rewardAmount === 0n && previousRewardAmount === 0n,
    },
  });

  // Extended fallback: Try even older time indices (up to 10 periods back)
  const muchOlderTimeIndex = currentTimeIndex ? currentTimeIndex - 10n : undefined;
  const { data: muchOlderRewardAmount, isLoading: isLoadingMuchOlderReward } = useContractRead({
    address: CONTRACT_ADDRESSES.STAKEHUB as `0x${string}`,
    abi: STAKEHUB_ABI,
    functionName: 'getValidatorRewardRecord',
    args: muchOlderTimeIndex ? [validatorAddress as `0x${string}`, muchOlderTimeIndex] : undefined,
    query: {
      enabled: !!validatorAddress && !!muchOlderTimeIndex && isValid && hasActiveCreditContract && 
               rewardAmount === 0n && previousRewardAmount === 0n && olderRewardAmount === 0n,
    },
  });

  // Last resort: Try 30 periods back for very inactive validators
  const veryOldTimeIndex = currentTimeIndex ? currentTimeIndex - 30n : undefined;
  const { data: veryOldRewardAmount, isLoading: isLoadingVeryOldReward } = useContractRead({
    address: CONTRACT_ADDRESSES.STAKEHUB as `0x${string}`,
    abi: STAKEHUB_ABI,
    functionName: 'getValidatorRewardRecord',
    args: veryOldTimeIndex ? [validatorAddress as `0x${string}`, veryOldTimeIndex] : undefined,
    query: {
      enabled: !!validatorAddress && !!veryOldTimeIndex && isValid && hasActiveCreditContract && 
               rewardAmount === 0n && previousRewardAmount === 0n && olderRewardAmount === 0n && muchOlderRewardAmount === 0n,
    },
  });

  return useMemo(() => {
    const isLoading = isLoadingInterval || (hasActiveCreditContract && (isLoadingPooled || isLoadingReward || isLoadingPreviousReward || isLoadingOlderReward || isLoadingMuchOlderReward || isLoadingVeryOldReward));

    // Determine which reward amount to use (current, previous, older, much older, or very old)
    const effectiveRewardAmount = rewardAmount && rewardAmount > 0n 
      ? rewardAmount 
      : previousRewardAmount && previousRewardAmount > 0n 
        ? previousRewardAmount 
        : olderRewardAmount && olderRewardAmount > 0n
          ? olderRewardAmount
          : muchOlderRewardAmount && muchOlderRewardAmount > 0n
            ? muchOlderRewardAmount
            : veryOldRewardAmount || 0n;

    const effectiveTimeIndex = rewardAmount && rewardAmount > 0n 
      ? currentTimeIndex 
      : previousRewardAmount && previousRewardAmount > 0n 
        ? previousTimeIndex 
        : olderRewardAmount && olderRewardAmount > 0n
          ? olderTimeIndex
          : muchOlderRewardAmount && muchOlderRewardAmount > 0n
            ? muchOlderTimeIndex
            : veryOldTimeIndex;

    console.log('🔍 Reward estimation debug:', {
      validatorAddress,
      stakeAmount,
      creditContract,
      hasActiveCreditContract,
      currentTimeIndex: currentTimeIndex?.toString(),
      previousTimeIndex: previousTimeIndex?.toString(),
      olderTimeIndex: olderTimeIndex?.toString(),
      muchOlderTimeIndex: muchOlderTimeIndex?.toString(),
      veryOldTimeIndex: veryOldTimeIndex?.toString(),
      totalPooledAmount: totalPooledAmount?.toString(),
      rewardAmount: rewardAmount?.toString(),
      previousRewardAmount: previousRewardAmount?.toString(),
      olderRewardAmount: olderRewardAmount?.toString(),
      muchOlderRewardAmount: muchOlderRewardAmount?.toString(),
      veryOldRewardAmount: veryOldRewardAmount?.toString(),
      effectiveRewardAmount: effectiveRewardAmount?.toString(),
      effectiveTimeIndex: effectiveTimeIndex?.toString(),
      isLoading,
      validationError,
      isValid
    });

    if (validationError) {
      return {
        apy: 0,
        apr: 0,
        dailyRate: 0,
        isLoading: false,
        error: validationError,
        rewards: { daily: 0, weekly: 0, monthly: 0, yearly: 0 },
        dualModeAPY: undefined,
      };
    }

    if (isLoading) {
      return {
        apy: 0,
        apr: 0,
        dailyRate: 0,
        isLoading: true,
        error: null,
        rewards: { daily: 0, weekly: 0, monthly: 0, yearly: 0 },
        dualModeAPY: undefined,
      };
    }

    // Handle validators without active credit contracts
    if (!hasActiveCreditContract) {
      return {
        apy: 0,
        apr: 0,
        dailyRate: 0,
        isLoading: false,
        error: 'Validator has no active credit contract - cannot calculate rewards',
        rewards: { daily: 0, weekly: 0, monthly: 0, yearly: 0 },
        dualModeAPY: undefined,
      };
    }

    // Check if we have valid data from the contract calls
    if (totalPooledAmount === undefined || effectiveRewardAmount === undefined) {
      return {
        apy: 0,
        apr: 0,
        dailyRate: 0,
        isLoading: false,
        error: 'Unable to fetch validator reward data from contract',
        rewards: { daily: 0, weekly: 0, monthly: 0, yearly: 0 },
        dualModeAPY: undefined,
      };
    }

    try {
      // Convert BigInt values to numbers for calculation
      const totalPooledBNB = Number(totalPooledAmount) / 1e18; // Convert from wei to BNB
      const rewardBNB = Number(effectiveRewardAmount) / 1e18; // Convert from wei to BNB

      console.log('📊 Contract data:', {
        totalPooledBNB: totalPooledBNB.toFixed(6),
        rewardBNB: rewardBNB.toFixed(6),
        timeIndex: effectiveTimeIndex?.toString(),
        usingFallback: effectiveRewardAmount !== rewardAmount
      });

      // If no pooled BNB, log and return zero values (this is valid - sometimes rewards are zero)
      if (totalPooledBNB === 0) {
        console.log('No pooled BNB found for this validator - returning zero rewards');
        return {
          apy: 0,
          apr: 0,
          dailyRate: 0,
          isLoading: false,
          error: null,
          rewards: { daily: 0, weekly: 0, monthly: 0, yearly: 0 },
        };
      }

      // Calculate daily rate using BSC documentation formula: rate = reward / totalPooledBNB
      const dailyRate = rewardBNB / totalPooledBNB;
      
      // Calculate APY using compound interest formula: APY = (1 + dailyRate)^365 - 1
      const apy = Math.pow(1 + dailyRate, 365) - 1;
      
      // Calculate APR (simple interest): APR = dailyRate * 365
      const apr = dailyRate * 365;

      // Calculate reward estimates for the given stake amount
      const rewards = calculateRewardEstimates(parsedAmount, dailyRate, apy);

      console.log('📈 Calculated rates:', {
        dailyRate: (dailyRate * 100).toFixed(4) + '%',
        apr: (apr * 100).toFixed(2) + '%',
        apy: (apy * 100).toFixed(2) + '%',
        dualModeAPY: dualModeAPY.apy ? `${dualModeAPY.apy.toFixed(2)}%` : 'N/A',
        mode: dualModeAPY.mode
      });

      // Use dual-mode APY if available and valid, otherwise fallback to contract calculation
      const finalAPY = dualModeAPY.apy > 0 ? dualModeAPY.apy * 100 : apy * 100;
      const finalDailyRate = dualModeAPY.dailyRate > 0 ? dualModeAPY.dailyRate / 100 : dailyRate;

      return {
        apy: finalAPY, // Already in percentage from dual-mode or converted from contract
        apr: apr * 100, // Convert to percentage
        dailyRate: finalDailyRate,
        isLoading: false,
        error: null,
        rewards: calculateRewardEstimates(parsedAmount, finalDailyRate, finalAPY / 100),
        dualModeAPY: dualModeAPY.apy > 0 ? {
          apy: dualModeAPY.apy,
          mode: dualModeAPY.mode,
          blockNumber: dualModeAPY.blockNumber,
          timeIndex: dualModeAPY.timeIndex
        } : undefined,
      };
    } catch (error) {
      console.error('Error calculating rewards:', error);
      return {
        apy: 0,
        apr: 0,
        dailyRate: 0,
        isLoading: false,
        error: 'Error calculating rewards from contract data',
        rewards: { daily: 0, weekly: 0, monthly: 0, yearly: 0 },
        dualModeAPY: undefined,
      };
    }
  }, [
    isLoadingInterval,
    isLoadingPooled,
    isLoadingReward,
    isLoadingPreviousReward,
    isLoadingOlderReward,
    isLoadingMuchOlderReward,
    isLoadingVeryOldReward,
    totalPooledAmount,
    rewardAmount,
    previousRewardAmount,
    olderRewardAmount,
    muchOlderRewardAmount,
    veryOldRewardAmount,
    parsedAmount,
    isValid,
    validationError,
    creditContract,
    hasActiveCreditContract,
    currentTimeIndex,
    previousTimeIndex,
    olderTimeIndex,
    muchOlderTimeIndex,
    veryOldTimeIndex,
  ]);
}