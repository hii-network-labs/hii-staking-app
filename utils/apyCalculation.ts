import { ENV } from '@/config/env';

export interface APYCalculationResult {
  apy: number;
  dailyRate: number;
  timeIndex: bigint;
  totalPooledBNB: bigint;
  rewardAmount: bigint;
  blockNumber: number;
  mode: 'development' | 'production';
}

export interface APYCalculationParams {
  validatorAddress: string;
  rpcUrl?: string;
  mode?: 'development' | 'production';
  devBlockNumber?: string;
}

/**
 * Calculate validator APY with dual-mode support
 * Mode 1 (development): Uses hardcoded block number with known rewards
 * Mode 2 (production): Uses latest block for real-time data
 */
export async function calculateValidatorAPY(params: APYCalculationParams): Promise<APYCalculationResult | null> {
  const {
    validatorAddress,
    rpcUrl = ENV.RPC_URL,
    mode = ENV.APY_CALCULATION_MODE as 'development' | 'production',
    devBlockNumber = ENV.DEV_BLOCK_NUMBER
  } = params;

  try {
    // Dynamic import to avoid SSR issues
    const Web3 = (await import('web3')).default;
    const { STAKEHUB_ABI } = await import('@/config/abi');
    
    const web3 = new Web3(rpcUrl);
    const STAKE_HUB_ADDRESS = ENV.STAKEHUB_ADDRESS;
    const stakeHub = new web3.eth.Contract(STAKEHUB_ABI, STAKE_HUB_ADDRESS);

    // Determine which block to use based on mode
    let targetBlock;
    if (mode === 'development') {
      // Use hardcoded block number with known rewards
      targetBlock = await web3.eth.getBlock(parseInt(devBlockNumber));
      console.log(`🔧 [DEV MODE] Using hardcoded block: ${devBlockNumber}`);
    } else {
      // Use latest block for production
      targetBlock = await web3.eth.getBlock('latest');
      console.log(`🚀 [PROD MODE] Using latest block: ${targetBlock.number}`);
    }

    // Get breathe interval (time between reward distributions)
    const interval = await stakeHub.methods.BREATHE_BLOCK_INTERVAL().call();
    console.log(`📊 BREATHE_BLOCK_INTERVAL: ${interval.toString()}`);

    // Calculate time index based on block timestamp
    const timeIndex = BigInt(Math.floor(Number(targetBlock.timestamp) / Number(interval)));
    console.log(`⏰ Calculated time index: ${timeIndex.toString()}`);

    // Get total pooled BNB for this validator at this time index
    const totalPooledBNB = await stakeHub.methods
      .getValidatorTotalPooledBNBRecord(validatorAddress, timeIndex)
      .call();
    console.log(`💰 Total pooled BNB: ${totalPooledBNB}`);

    // Get reward amount for this validator at this time index
    const rewardAmount = await stakeHub.methods
      .getValidatorRewardRecord(validatorAddress, timeIndex)
      .call();
    console.log(`🎁 Reward amount: ${rewardAmount}`);

    // Convert to float for calculation (18 decimals)
    const totalPooledBNBFloat = totalPooledBNB ? Number(web3.utils.fromWei(String(totalPooledBNB), 'ether')) : 0;
    const rewardFloat = rewardAmount ? Number(web3.utils.fromWei(String(rewardAmount), 'ether')) : 0;

    console.log(`📈 Total pooled (BNB): ${totalPooledBNBFloat}`);
    console.log(`📈 Reward (BNB): ${rewardFloat}`);

    if (totalPooledBNBFloat === 0) {
      console.warn('⚠️ Total pooled BNB is 0, cannot calculate APY');
      return null;
    }

    // Calculate daily rate and APY
    const dailyRate = rewardFloat / totalPooledBNBFloat;
    const apy = Math.pow(1 + dailyRate, 365) - 1;

    console.log(`📊 Daily rate: ${dailyRate}`);
    console.log(`🎯 Estimated APY: ${(apy * 100).toFixed(4)}%`);

    return {
      apy,
      dailyRate,
      timeIndex,
      totalPooledBNB: totalPooledBNB ? BigInt(String(totalPooledBNB)) : 0n,
      rewardAmount: rewardAmount ? BigInt(String(rewardAmount)) : 0n,
      blockNumber: Number(targetBlock.number),
      mode
    };

  } catch (error) {
    console.error('❌ Error calculating validator APY:', error);
    return null;
  }
}

/**
 * Format APY result for display
 */
export function formatAPYResult(result: APYCalculationResult | null): {
  apy: string;
  dailyRate: string;
  mode: string;
  blockNumber: string;
} {
  if (!result) {
    return {
      apy: '0.00%',
      dailyRate: '0.00%',
      mode: 'N/A',
      blockNumber: 'N/A'
    };
  }

  return {
    apy: `${(result.apy * 100).toFixed(4)}%`,
    dailyRate: `${(result.dailyRate * 100).toFixed(6)}%`,
    mode: result.mode,
    blockNumber: result.blockNumber.toString()
  };
}