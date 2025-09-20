import { useMemo } from 'react';
import { useRewardEstimationV2 } from './useRewardEstimationV2';
import { CONTRACT_ADDRESSES } from '../config/contracts';

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
  
  // Use the new V2 implementation based on validator records
  const rewardEstimationV2 = useRewardEstimationV2(
    CONTRACT_ADDRESSES.OPERATOR,
    amount
  );

  console.log('📈 Reward Estimation V2 Data:', rewardEstimationV2);

  return useMemo(() => {
    console.log('🔄 Recalculating reward estimation...');
    
    // Handle empty amount gracefully (don't show as error)
    if (!amount || amount.trim() === '') {
      console.log('📝 No amount entered yet, showing placeholder values');
      return {
        daily: '0',
        weekly: '0',
        monthly: '0',
        yearly: '0',
        apy: 0,
        error: undefined, // Don't show error for empty amount
      };
    }
    
    // Handle loading state
    if (rewardEstimationV2.isLoading) {
      console.log('⏳ Reward estimation still loading...');
      return {
        daily: '0',
        weekly: '0',
        monthly: '0',
        yearly: '0',
        apy: 0,
        error: 'Loading reward data...',
      };
    }

    // Handle error state (but not for "Amount is required" since we handle that above)
    if (rewardEstimationV2.error && rewardEstimationV2.error !== 'Amount is required') {
      console.error('❌ Error in reward estimation:', rewardEstimationV2.error);
      return {
        daily: '0',
        weekly: '0',
        monthly: '0',
        yearly: '0',
        apy: 0,
        error: rewardEstimationV2.error,
      };
    }

    // Return the calculated values from V2
    console.log('📊 Final reward calculations:', {
      daily: rewardEstimationV2.rewards.daily,
      weekly: rewardEstimationV2.rewards.weekly,
      monthly: rewardEstimationV2.rewards.monthly,
      yearly: rewardEstimationV2.rewards.yearly,
      apy: rewardEstimationV2.apy + '%',
    });

    return {
      daily: rewardEstimationV2.rewards.daily.toFixed(15),
      weekly: rewardEstimationV2.rewards.weekly.toFixed(15),
      monthly: rewardEstimationV2.rewards.monthly.toFixed(15),
      yearly: rewardEstimationV2.rewards.yearly.toFixed(15),
      apy: rewardEstimationV2.apy,
      error: undefined,
    };
  }, [rewardEstimationV2, activeTab]);
}