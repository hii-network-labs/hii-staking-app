/**
 * Utility functions for reward calculations based on validator records
 * Following the documentation for APR/APY calculation
 */

/**
 * Calculate the time-based index for validator record queries
 * Based on the formula: index = currentBlockTime / breatheBlockInterval
 * 
 * @param currentBlockTime - Current block timestamp in seconds
 * @param breatheBlockInterval - The breathe block interval from the contract
 * @returns The calculated index for record queries
 */
export function calculateTimeIndex(
  currentBlockTime: number,
  breatheBlockInterval: bigint
): bigint {
  return BigInt(Math.floor(currentBlockTime / Number(breatheBlockInterval)));
}

/**
 * Calculate the daily rate from validator records
 * 
 * @param rewardAmount - The reward amount for the day (in wei)
 * @param totalPooledAmount - The total pooled amount for the day (in wei)
 * @returns The daily rate as a decimal (e.g., 0.001 for 0.1% daily)
 */
export function calculateDailyRate(
  rewardAmount: bigint,
  totalPooledAmount: bigint
): number {
  if (totalPooledAmount === 0n) {
    return 0;
  }

  const rewardFloat = parseFloat(rewardAmount.toString()) / 1e18;
  const totalPooledFloat = parseFloat(totalPooledAmount.toString()) / 1e18;
  
  return rewardFloat / totalPooledFloat;
}

/**
 * Calculate APR (Annual Percentage Rate) from daily rate
 * APR uses simple interest calculation
 * 
 * @param dailyRate - The daily rate as a decimal
 * @returns APR as a percentage
 */
export function calculateAPR(dailyRate: number): number {
  return dailyRate * 365 * 100;
}

/**
 * Calculate APY (Annual Percentage Yield) from daily rate
 * APY uses compound interest calculation: (1 + daily_rate)^365 - 1
 * 
 * @param dailyRate - The daily rate as a decimal
 * @returns APY as a percentage
 */
export function calculateAPY(dailyRate: number): number {
  return (Math.pow(1 + dailyRate, 365) - 1) * 100;
}

/**
 * Calculate reward estimates for different time periods
 * 
 * @param stakeAmount - The amount to stake
 * @param dailyRate - The daily rate as a decimal
 * @param apy - The APY as a percentage
 * @returns Object with daily, weekly, monthly, and yearly reward estimates
 */
export function calculateRewardEstimates(
  stakeAmount: number,
  dailyRate: number,
  apy: number
): {
  daily: number;
  weekly: number;
  monthly: number;
  yearly: number;
} {
  const dailyReward = stakeAmount * dailyRate;
  const weeklyReward = dailyReward * 7;
  const monthlyReward = dailyReward * 30;
  const yearlyReward = stakeAmount * (apy / 100); // Use APY for yearly calculation

  return {
    daily: dailyReward,
    weekly: weeklyReward,
    monthly: monthlyReward,
    yearly: yearlyReward,
  };
}

/**
 * Format reward amounts to a fixed number of decimal places
 * 
 * @param amount - The amount to format
 * @param decimals - Number of decimal places (default: 6)
 * @returns Formatted string
 */
export function formatRewardAmount(amount: number, decimals: number = 6): string {
  return amount.toFixed(decimals);
}

/**
 * Validate if a stake amount is valid for calculations
 * 
 * @param amount - The amount string to validate
 * @returns Object with isValid flag and parsed amount
 */
export function validateStakeAmount(amount: string): {
  isValid: boolean;
  parsedAmount: number;
  error?: string;
} {
  if (!amount || amount.trim() === '') {
    return {
      isValid: false,
      parsedAmount: 0,
      error: 'Amount is required',
    };
  }

  const parsedAmount = parseFloat(amount);
  
  if (isNaN(parsedAmount)) {
    return {
      isValid: false,
      parsedAmount: 0,
      error: 'Invalid amount format',
    };
  }

  if (parsedAmount <= 0) {
    return {
      isValid: false,
      parsedAmount: 0,
      error: 'Amount must be greater than zero',
    };
  }

  return {
    isValid: true,
    parsedAmount,
  };
}

/**
 * Convert wei to human-readable format
 * 
 * @param weiAmount - Amount in wei (as bigint)
 * @param decimals - Token decimals (default: 18)
 * @returns Human-readable amount as number
 */
export function weiToFloat(weiAmount: bigint, decimals: number = 18): number {
  return parseFloat(weiAmount.toString()) / Math.pow(10, decimals);
}

/**
 * Convert human-readable amount to wei
 * 
 * @param amount - Human-readable amount
 * @param decimals - Token decimals (default: 18)
 * @returns Amount in wei as bigint
 */
export function floatToWei(amount: number, decimals: number = 18): bigint {
  return BigInt(Math.floor(amount * Math.pow(10, decimals)));
}