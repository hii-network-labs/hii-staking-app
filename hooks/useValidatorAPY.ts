import { useContractRead } from 'wagmi';
import { STAKEHUB_ABI, STAKE_CREDIT_ABI } from '../config/abi';
import { CONTRACT_ADDRESSES } from '../config/contracts';
import { useState, useEffect } from 'react';
import { createPublicClient, http } from 'viem';
import { ENV } from '../config/env';

interface ValidatorAPYResult {
  apy: number;
  isLoading: boolean;
  isError: boolean;
  error?: string;
}

export function useValidatorAPY(validatorAddress?: string): ValidatorAPYResult {
  console.log('🔍 useValidatorAPY called with validator:', validatorAddress);
  console.log('📡 RPC URL:', process.env.NEXT_PUBLIC_RPC_URL);
  console.log('📋 StakeHub Address:', CONTRACT_ADDRESSES.STAKEHUB);
  console.log('🎯 Operator Address (fallback):', CONTRACT_ADDRESSES.OPERATOR);

  // Use operator address as fallback if validator address is not provided
  const effectiveValidatorAddress = validatorAddress || CONTRACT_ADDRESSES.OPERATOR;
  console.log('✅ Using validator address:', effectiveValidatorAddress);

  // State for fallback implementation
  const [fallbackData, setFallbackData] = useState<{
    creditAddress?: string;
    totalPooled?: bigint;
    rewardData?: bigint;
    isLoading: boolean;
    error?: string;
  }>({ isLoading: true });

  // Create viem client for fallback
  const viemClient = createPublicClient({
    transport: http(ENV.RPC_URL, {
      retryCount: 3,
      retryDelay: 2000,
      timeout: 15000,
    })
  });

  // Fallback data fetching with direct viem calls
  useEffect(() => {
    let isMounted = true;
    
    const fetchFallbackData = async () => {
      if (!effectiveValidatorAddress) return;
      
      try {
        setFallbackData(prev => ({ ...prev, isLoading: true, error: undefined }));
        
        console.log('🔄 Fetching data with direct viem client...');
        
        // Get credit contract address
        const creditAddress = await viemClient.readContract({
          address: CONTRACT_ADDRESSES.STAKEHUB as `0x${string}`,
          abi: STAKEHUB_ABI,
          functionName: 'getValidatorCreditContract',
          args: [effectiveValidatorAddress as `0x${string}`]
        });
        
        console.log('✅ Credit contract address:', creditAddress);
        
        if (!isMounted) return;
        
        // Get total pooled BNB from credit contract
        const totalPooled = await viemClient.readContract({
          address: creditAddress as `0x${string}`,
          abi: STAKE_CREDIT_ABI,
          functionName: 'totalPooledBNB',
          args: []
        });
        
        console.log('✅ Total pooled BNB:', totalPooled?.toString());
        
        if (!isMounted) return;
        
        // Get reward data
        const rewardData = await viemClient.readContract({
          address: CONTRACT_ADDRESSES.STAKEHUB as `0x${string}`,
          abi: STAKEHUB_ABI,
          functionName: 'getValidatorRewardRecord',
          args: [effectiveValidatorAddress as `0x${string}`, 0n]
        });
        
        console.log('✅ Reward data:', rewardData?.toString());
        
        if (!isMounted) return;
        
        setFallbackData({
          creditAddress: creditAddress as string,
          totalPooled: totalPooled as bigint,
          rewardData: rewardData as bigint,
          isLoading: false,
          error: undefined
        });
        
      } catch (error) {
        console.error('❌ Fallback data fetch error:', error);
        if (!isMounted) return;
        
        setFallbackData(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }));
      }
    };
    
    fetchFallbackData();
    
    // Set up interval for periodic updates
    const interval = setInterval(fetchFallbackData, 10000); // Every 10 seconds
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [effectiveValidatorAddress, viemClient]);

  console.log('📊 Contract call results:');
  console.log('  - Credit Contract Address:', fallbackData.creditAddress, 'Loading:', fallbackData.isLoading, 'Error:', !!fallbackData.error);
  console.log('  - Total Pooled Data:', fallbackData.totalPooled?.toString(), 'Loading:', fallbackData.isLoading, 'Error:', !!fallbackData.error);
  console.log('  - Reward Data:', fallbackData.rewardData?.toString(), 'Loading:', fallbackData.isLoading, 'Error:', !!fallbackData.error);
  
  if (fallbackData.error) {
    console.error('❌ Error fetching data:', fallbackData.error);
  }

  const isLoading = fallbackData.isLoading;
  const isError = !!fallbackData.error;

  // Check for configuration errors first
  if (!CONTRACT_ADDRESSES.STAKEHUB) {
    const configError = 'StakeHub contract address is not configured. Please check your environment variables.';
    console.error('🚨 Configuration Error:', configError);
    return {
      apy: 0,
      isLoading: false,
      isError: true,
      error: configError,
    };
  }

  if (!effectiveValidatorAddress) {
    const validatorError = 'No validator address provided and no operator address configured.';
    console.error('🚨 Validator Error:', validatorError);
    return {
      apy: 0,
      isLoading: false,
      isError: true,
      error: validatorError,
    };
  }

  // Generate error message for user
  let errorMessage: string | undefined;
  if (isError) {
    errorMessage = fallbackData.error || 'Failed to fetch validator data from blockchain. Please check your network connection.';
    console.error('🚨 APY Calculation Error:', errorMessage);
  }

  // Calculate APY if we have both data points
  let apy = 0;
  if (fallbackData.totalPooled && fallbackData.rewardData && !isError) {
    try {
      console.log('🧮 Calculating APY...');
      // Convert BigInt to number for calculation
      const totalPooledHIZ = Number(fallbackData.totalPooled);
      const rewardAmount = Number(fallbackData.rewardData);
      
      console.log('  - Total Pooled HIZ:', totalPooledHIZ);
      console.log('  - Reward Amount:', rewardAmount);
      
      if (totalPooledHIZ > 0 && rewardAmount > 0) {
        // Based on BSC documentation: APY calculation using reward records
        // Assuming reward data represents daily rewards
        // APY = (Daily Reward / Total Pooled Amount) * 365 * 100
        apy = (rewardAmount / totalPooledHIZ) * 365 * 100;
        console.log('  - Calculated APY:', apy + '%');
      } else {
        console.warn('⚠️ Total pooled HIZ or reward amount is zero or invalid');
        if (totalPooledHIZ === 0) {
          errorMessage = 'Invalid validator data: Total pooled HIZ is zero.';
        } else {
          errorMessage = 'Invalid validator data: Reward amount is zero.';
        }
      }
    } catch (error) {
      console.error('❌ Error calculating APY:', error);
      errorMessage = 'Error calculating APY from validator data.';
    }
  }

  // Don't use fallback - throw error instead
  if (apy === 0 && !isLoading) {
    if (!errorMessage) {
      errorMessage = 'Unable to calculate APY: No valid data available from blockchain.';
    }
    console.error('🚨 Final APY Error:', errorMessage);
  }

  console.log('✅ useValidatorAPY result:', { apy, isLoading, isError, error: errorMessage });

  return {
    apy,
    isLoading,
    isError: isError || (apy === 0 && !isLoading),
    error: errorMessage,
  };
}