import { useMemo } from 'react';
import { useValidatorAPY } from './useValidatorAPY';
import { usePoolStats } from './usePoolStats';

export interface RewardEstimation {
  daily: string;
  weekly: string;
  monthly: string;
  yearly: string;
  apy: number;
  error?: string;
}

export function useRewardEstimation(
  amount: string,
  stakingInfo?: any,
  activeTab?: 'delegate' | 'undelegate'
): RewardEstimation {
  console.log('💰 useRewardEstimation called with:', { amount, activeTab });
  
  const { poolStats } = usePoolStats(stakingInfo?.stakingInfo?.creditContractAddress);
  const { apy: validatorAPY, isLoading: apyLoading, isError: apyError, error: apyErrorMessage } = useValidatorAPY(
    stakingInfo?.stakingInfo?.operatorAddress
  );

  console.log('📈 APY Data:', { validatorAPY, apyLoading, apyError, apyErrorMessage });

  return useMemo(() => {
    console.log('🔄 Recalculating reward estimation...');
    
    // Handle APY errors
    if (apyError && apyErrorMessage) {
      console.error('❌ APY Error in reward estimation:', apyErrorMessage);
      return {
        daily: '0',
        weekly: '0',
        monthly: '0',
        yearly: '0',
        apy: 0,
        error: apyErrorMessage,
      };
    }

    // Handle loading state
    if (apyLoading) {
      console.log('⏳ APY still loading...');
      return {
        daily: '0',
        weekly: '0',
        monthly: '0',
        yearly: '0',
        apy: 0,
        error: 'Loading APY data...',
      };
    }

    // Validate amount
    const stakeAmount = parseFloat(amount);
    if (!amount || isNaN(stakeAmount) || stakeAmount <= 0) {
      console.log('⚠️ Invalid stake amount:', amount);
      return {
        daily: '0',
        weekly: '0',
        monthly: '0',
        yearly: '0',
        apy: validatorAPY,
        error: undefined,
      };
    }

    // Calculate rewards using validator APY
    const dailyRate = validatorAPY / 365 / 100;
    const dailyReward = stakeAmount * dailyRate;
    const weeklyReward = dailyReward * 7;
    const monthlyReward = dailyReward * 30;
    const yearlyReward = dailyReward * 365;

    console.log('📊 Reward calculations:', {
      stakeAmount,
      validatorAPY: validatorAPY + '%',
      dailyRate,
      dailyReward,
      weeklyReward,
      monthlyReward,
      yearlyReward
    });

    return {
      daily: dailyReward.toFixed(6),
      weekly: weeklyReward.toFixed(6),
      monthly: monthlyReward.toFixed(6),
      yearly: yearlyReward.toFixed(6),
      apy: validatorAPY,
      error: undefined,
    };
  }, [amount, validatorAPY, apyLoading, apyError, apyErrorMessage, activeTab]);
}