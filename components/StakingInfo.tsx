'use client';

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useStakingInfo, useClaim, usePoolStats } from '@/hooks';
import { Loader2, TrendingUp, Clock, CheckCircle, AlertCircle, BarChart3 } from 'lucide-react';
import { NumberDisplay } from '@/components/ui/NumberDisplay';
import { formatHII, formatShares, formatExchangeRate } from '@/utils/formatters';
import { UnbondRequestsDetail } from '@/components/UnbondRequestsDetail';
import TransactionHistory from './TransactionHistory';

export function StakingInfo({ onlyTransactionHistory = false, onlyStakingInfo = false }: { onlyTransactionHistory?: boolean; onlyStakingInfo?: boolean }) {
  const { address, isConnected } = useAccount();
  const { stakingInfo, isLoading, isError } = useStakingInfo();
  const { poolStats, isLoading: poolStatsLoading, isError: poolStatsError } = usePoolStats(stakingInfo?.creditContractAddress);
  const { claim, isLoading: isClaiming, isSuccess: claimSuccess, error: claimError } = useClaim();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleClaim = () => {
    claim(); // Claim all available unbond requests
  };

  // Show loading state during hydration
  if (!isClient) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 text-center">
        <p className="text-gray-600">Please connect your wallet to view staking information.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          <span className="text-gray-600">Loading staking information...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="flex items-center justify-center gap-2 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <span>Error loading staking information</span>
        </div>
      </div>
    );
  }

  if (!stakingInfo) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 text-center">
        <p className="text-gray-600">No staking information available.</p>
      </div>
    );
  }

  // If only showing transaction history
  if (onlyTransactionHistory) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-lg lg:text-xl font-semibold text-gray-900">
          <Clock className="w-5 h-5 lg:w-6 lg:h-6" />
          Transaction History
        </div>
        <TransactionHistory address={address} creditContractAddress={stakingInfo.creditContractAddress} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Staking Information */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-600" />
          Your Staking Information
        </h3>
        
        <div className="bg-gradient-to-r from-purple-50 via-blue-50 to-gray-50 rounded-xl p-8 hover:from-purple-100 hover:via-blue-100 hover:to-gray-100 transition-all duration-200">
          <div className="space-y-6">
            {/* Shares Balance */}
            <div className="text-center">
              <NumberDisplay
                value={stakingInfo.balance}
                formatted={formatShares(stakingInfo.balance)}
                fullValue={`${stakingInfo.balance} Shares`}
                label="Shares Balance"
                className="text-lg md:text-xl font-semibold text-gray-900"
              />
            </div>
            
            {/* Pooled HII */}
            <div className="text-center">
              <NumberDisplay
                value={stakingInfo.pooledHII}
              formatted={formatHII(stakingInfo.pooledHII)}
              fullValue={`${stakingInfo.pooledHII} HII`}
                label="Pooled HII"
                className="text-lg md:text-xl font-semibold text-gray-900"
              />
            </div>
            
            {/* Shares from Pooled HII */}
            <div className="text-center">
              <NumberDisplay
                value={stakingInfo.shares}
                formatted={formatHII(stakingInfo.shares)}
                fullValue={`${stakingInfo.shares} HII`}
                label="Shares from Pooled HII"
                className="text-lg md:text-xl font-semibold text-gray-900"
              />
            </div>
          </div>
        </div>
      </div>

      {!onlyStakingInfo && (
        <>
          {/* Pool Statistics Section */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Pool Statistics
            </h3>
            
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-8 hover:from-blue-100 hover:to-blue-200 transition-all duration-200">
              <div className="space-y-6">
                {/* Total Pooled HII */}
                <div className="text-center">
                  <NumberDisplay
                    value={poolStats.totalPooledHII}
              formatted={formatHII(poolStats.totalPooledHII)}
              fullValue={`${poolStats.totalPooledHII} HII`}
                    label="Total Pooled HII"
                    className="text-lg md:text-xl font-semibold text-gray-900"
                  />
                </div>
                
                {/* Total Supply (Shares) */}
                <div className="text-center">
                  <NumberDisplay
                    value={poolStats.totalSupply}
                    formatted={formatShares(poolStats.totalSupply)}
                    fullValue={`${poolStats.totalSupply} Shares`}
                    label="Total Supply (Shares)"
                    className="text-lg md:text-xl font-semibold text-gray-900"
                  />
                </div>
                
                {/* Exchange Rate */}
                <div className="text-center">
                  <NumberDisplay
                    value={poolStats.exchangeRate}
                    formatted={formatExchangeRate(poolStats.exchangeRate)}
                    fullValue={poolStats.exchangeRate}
                    label="Exchange Rate"
                    className="text-lg md:text-xl font-semibold text-gray-900"
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

