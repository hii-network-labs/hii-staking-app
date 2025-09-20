import { useState, useEffect } from 'react';
import { calculateValidatorAPY, APYCalculationResult, formatAPYResult } from '@/utils/apyCalculation';
import { ENV } from '@/config/env';

interface UseValidatorAPYDualResult {
  apy: number;
  dailyRate: number;
  isLoading: boolean;
  error: string | null;
  mode: 'development' | 'production';
  blockNumber: string;
  timeIndex: string;
  formattedResult: {
    apy: string;
    dailyRate: string;
    mode: string;
    blockNumber: string;
  };
}

interface UseValidatorAPYDualParams {
  validatorAddress: string;
  enabled?: boolean;
  mode?: 'development' | 'production';
  devBlockNumber?: string;
}

/**
 * Hook for dual-mode validator APY calculation
 * Supports both development mode (hardcoded block) and production mode (latest block)
 */
export function useValidatorAPYDual({
  validatorAddress,
  enabled = true,
  mode = ENV.APY_CALCULATION_MODE as 'development' | 'production',
  devBlockNumber = ENV.DEV_BLOCK_NUMBER
}: UseValidatorAPYDualParams): UseValidatorAPYDualResult {
  const [result, setResult] = useState<APYCalculationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !validatorAddress) {
      return;
    }

    let isCancelled = false;

    const fetchAPY = async () => {
      setIsLoading(true);
      setError(null);

      try {
        console.log(`🔄 Fetching APY for validator: ${validatorAddress} (mode: ${mode})`);
        
        const apyResult = await calculateValidatorAPY({
          validatorAddress,
          mode,
          devBlockNumber
        });

        if (isCancelled) return;

        if (apyResult) {
          setResult(apyResult);
          console.log(`✅ APY calculation successful:`, {
            apy: `${(apyResult.apy * 100).toFixed(4)}%`,
            mode: apyResult.mode,
            blockNumber: apyResult.blockNumber
          });
        } else {
          setError('Failed to calculate APY - no valid data found');
          console.warn('⚠️ APY calculation returned null');
        }
      } catch (err) {
        if (isCancelled) return;
        
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        console.error('❌ APY calculation failed:', err);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchAPY();

    return () => {
      isCancelled = true;
    };
  }, [validatorAddress, enabled, mode, devBlockNumber]);

  const formattedResult = formatAPYResult(result);

  return {
    apy: result ? result.apy * 100 : 0, // Convert to percentage
    dailyRate: result ? result.dailyRate * 100 : 0, // Convert to percentage
    isLoading,
    error,
    mode: result?.mode || mode,
    blockNumber: result?.blockNumber.toString() || 'N/A',
    timeIndex: result?.timeIndex.toString() || 'N/A',
    formattedResult
  };
}

/**
 * Hook for getting APY calculation in both modes for comparison
 */
export function useValidatorAPYComparison(validatorAddress: string, enabled = true) {
  const devResult = useValidatorAPYDual({
    validatorAddress,
    enabled,
    mode: 'development'
  });

  const prodResult = useValidatorAPYDual({
    validatorAddress,
    enabled,
    mode: 'production'
  });

  return {
    development: devResult,
    production: prodResult,
    isLoading: devResult.isLoading || prodResult.isLoading,
    hasError: !!devResult.error || !!prodResult.error
  };
}