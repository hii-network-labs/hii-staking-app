'use client';

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { useDelegate } from '@/hooks/useDelegate';
import { useUndelegate } from '@/hooks/useUndelegate';
import { useClaim } from '@/hooks/useClaim';
import { useStakingInfoWithAutoRefresh } from '@/hooks/useStakingInfoWithAutoRefresh';
import { useValidation } from '@/hooks/useValidation';
import { useRewardEstimation } from '@/hooks/useRewardEstimation';
import { formatHII } from '@/utils/formatters';
import { Loader2, ArrowUpCircle, ArrowDownCircle, ExternalLink, AlertCircle, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { ConnectWalletButton } from './ConnectWalletButton';
import { useUnbondRequests } from '@/hooks/useUnbondRequests';
import { UnbondRequestsDetail } from './UnbondRequestsDetail';

interface DelegateFormProps {
  onTransactionSuccess?: () => void;
}

export function DelegateForm({ onTransactionSuccess }: DelegateFormProps) {
  const { address, isConnected } = useAccount();
  const { delegate, resetState: resetDelegateState, isLoading: delegateLoading, isSuccess: delegateSuccess, isError: delegateError, error: delegateErrorMsg, txHash: delegateTxHash } = useDelegate();
  const { undelegate, resetState: resetUndelegateState, isLoading: undelegateLoading, isSuccess: undelegateSuccess, isError: undelegateError, error: undelegateErrorMsg, txHash: undelegateTxHash } = useUndelegate();
  const { claim, resetState: resetClaimState, isLoading: claimLoading, isSuccess: claimSuccess, isError: claimError, error: claimErrorMsg, txHash: claimTxHash } = useClaim();
  const { stakingInfo } = useStakingInfoWithAutoRefresh();
  const { validateDelegateAmount, validateUndelegateAmount, validationRules } = useValidation();
  
  const [amount, setAmount] = useState('');
  const [activeTab, setActiveTab] = useState<'delegate' | 'undelegate' | 'claim'>('delegate');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  
  // Initialize unbond requests hook early to load data on page init
  // Enable auto-refresh only when on claim tab for real-time updates
  const { unbondRequests, isLoading: unbondRequestsLoading } = useUnbondRequests(
    parseInt(stakingInfo?.pendingUnbondRequest || '0'),
    parseInt(stakingInfo?.claimableUnbondRequest || '0'),
    stakingInfo?.creditContractAddress || '',
    activeTab === 'claim', // Enable auto-refresh only on claim tab
    5000 // Refresh every 5 seconds
  );
  
  const rewardEstimation = useRewardEstimation(amount, stakingInfo, activeTab as 'delegate' | 'undelegate');

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleAmountChange = (value: string) => {
    setAmount(value);
    
    // Clear success states when user starts typing
    if (delegateSuccess) resetDelegateState();
    if (undelegateSuccess) resetUndelegateState();
    if (claimSuccess) resetClaimState();
    
    // Real-time validation (only for delegate/undelegate tabs)
    if (value && validationRules && !validationRules.isLoading && activeTab !== 'claim') {
      const validation = activeTab === 'delegate' 
        ? validateDelegateAmount(value)
        : validateUndelegateAmount(value);
      
      setValidationError(validation.isValid ? null : validation.error || null);
    } else {
      setValidationError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (activeTab === 'claim') {
      // Handle claim operation
      await claim();
      return;
    }
    
    if (!amount) {
      setValidationError('Amount is required');
      return;
    }

    if (!isConnected) {
      setValidationError('Please connect your wallet');
      return;
    }

    // Final validation before submission
    const validation = activeTab === 'delegate' 
      ? validateDelegateAmount(amount)
      : validateUndelegateAmount(amount);
    
    if (!validation.isValid) {
      setValidationError(validation.error || 'Invalid amount');
      return;
    }

    setValidationError(null);

    if (activeTab === 'delegate') {
      await delegate(amount);
    } else {
      await undelegate(amount);
    }
  };

  const isLoading = (delegateLoading || undelegateLoading || claimLoading) ?? false;
  const isSuccess = (delegateSuccess || undelegateSuccess || claimSuccess) ?? false;
  const error = delegateErrorMsg || undelegateErrorMsg || claimErrorMsg || null;
  const txHash = delegateTxHash || undelegateTxHash || claimTxHash || null;

  // Call onTransactionSuccess when any transaction succeeds
  useEffect(() => {
    if (isSuccess && onTransactionSuccess) {
      onTransactionSuccess();
    }
  }, [isSuccess, onTransactionSuccess]);

  // Show loading state during hydration or when validation rules are loading
  if (!mounted || !validationRules) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl shadow-xl p-6 border-2 border-blue-200">
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800 text-center">Please connect your wallet to perform staking</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl shadow-xl p-6 border-2 border-blue-200 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-blue-200 rounded-full opacity-20 -translate-y-10 translate-x-10"></div>
      <div className="absolute bottom-0 left-0 w-16 h-16 bg-indigo-200 rounded-full opacity-20 translate-y-8 -translate-x-8"></div>
      
      {/* Header with emphasis */}
      {/* Compact Tab Buttons */}
      <div className="flex gap-1 mb-5 p-1 bg-gray-100 rounded-lg">
        <button
          onClick={() => {
            setActiveTab('delegate');
            setAmount(''); // Clear input
            setValidationError(null); // Clear validation error
            if (undelegateSuccess) resetUndelegateState();
            if (claimSuccess) resetClaimState();
          }}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-md font-medium transition-all text-sm ${
            activeTab === 'delegate'
              ? 'bg-white text-green-700 shadow-sm border border-green-200'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <ArrowUpCircle className="w-4 h-4" />
          Stake
        </button>
        <button
          onClick={() => {
            setActiveTab('undelegate');
            setAmount(''); // Clear input
            setValidationError(null); // Clear validation error
            if (delegateSuccess) resetDelegateState();
            if (claimSuccess) resetClaimState();
          }}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-md font-medium transition-all text-sm ${
            activeTab === 'undelegate'
              ? 'bg-white text-red-700 shadow-sm border border-red-200'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <ArrowDownCircle className="w-4 h-4" />
          Unstake
        </button>
        <button
          onClick={() => {
            setActiveTab('claim');
            setAmount(''); // Clear input
            setValidationError(null); // Clear validation error
            if (delegateSuccess) resetDelegateState();
            if (undelegateSuccess) resetUndelegateState();
          }}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-md font-medium transition-all text-sm ${
            activeTab === 'claim'
              ? 'bg-white text-blue-700 shadow-sm border border-blue-200'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          Claim
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Amount Input - Only show for delegate/undelegate tabs */}
        {activeTab !== 'claim' && (
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Amount (HII)
            </label>
            <div className="relative">
              <input
                id="amount"
                type="text"
                inputMode="decimal"
                pattern="[0-9]*\.?[0-9]*"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="Enter amount to stake"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              {activeTab === 'undelegate' && validationRules && !validationRules.isLoading && (
                <button
                  type="button"
                  onClick={() => {
                    const maxAmount = validationRules.maxUnstakeAmount;
                    if (maxAmount > 0n) {
                      const maxAmountStr = formatEther(maxAmount);
                      // Format for input field: use plain number with dots for decimals, no commas
                      const numValue = parseFloat(maxAmountStr);
                      const inputFormattedAmount = numValue.toFixed(4);
                      handleAmountChange(inputFormattedAmount);
                    }
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-all"
                >
                  MAX
                </button>
              )}
            </div>
            {validationError && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {validationError}
              </p>
            )}
            {validationRules && validationRules.isLoading && (
              <p className="mt-2 text-sm text-gray-500 flex items-center gap-1">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading validation rules...
              </p>
            )}
            
            {/* APY and Reward Estimation Display */}
            {activeTab === 'delegate' && amount && !validationError && (
              <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <h4 className="text-sm font-semibold text-gray-800">Estimated Rewards</h4>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-700">
                      {rewardEstimation.apy.toFixed(10)}%
                    </div>
                    <div className="text-xs text-gray-600">APY</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-700">
                      {parseFloat(rewardEstimation.yearly).toFixed(15)} HII
                    </div>
                    <div className="text-xs text-gray-600">Yearly Rewards</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                  <div className="text-center p-2 bg-white rounded">
                    <div className="font-semibold text-gray-700">{parseFloat(rewardEstimation.daily).toFixed(10)}</div>
                    <div className="text-gray-500">Daily</div>
                  </div>
                  <div className="text-center p-2 bg-white rounded">
                    <div className="font-semibold text-gray-700">{parseFloat(rewardEstimation.weekly).toFixed(8)}</div>
                    <div className="text-gray-500">Weekly</div>
                  </div>
                  <div className="text-center p-2 bg-white rounded">
                    <div className="font-semibold text-gray-700">{parseFloat(rewardEstimation.monthly).toFixed(8)}</div>
                    <div className="text-gray-500">Monthly</div>
                  </div>
                </div>
                
                {rewardEstimation.error && (
                  <div className="mt-2 text-xs text-orange-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {rewardEstimation.error}
                  </div>
                )}
              </div>
            )}
          </div>
        )}



        {/* Unbonding Requests Section - Only show for claim tab */}
        {activeTab === 'claim' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-orange-500" />
              <h3 className="text-lg font-semibold text-gray-800">Unbonding Requests</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                <div className="text-sm font-medium text-orange-700 mb-1">Pending</div>
                <div className="text-2xl font-bold text-orange-800">
                  {stakingInfo?.pendingUnbondRequest || 0}
                </div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <div className="text-sm font-medium text-green-700 mb-1">Claimable</div>
                <div className="text-2xl font-bold text-green-800">
                  {stakingInfo?.claimableUnbondRequest || 0}
                </div>
              </div>
            </div>
            
            {/* Detailed Unbond Requests List */}
            {(stakingInfo?.pendingUnbondRequest !== '0' || stakingInfo?.claimableUnbondRequest !== '0') ? (
              <UnbondRequestsDetail
                creditContractAddress={stakingInfo?.creditContractAddress || ''}
                pendingCount={parseInt(stakingInfo?.pendingUnbondRequest || '0')}
                claimableCount={parseInt(stakingInfo?.claimableUnbondRequest || '0')}
              />
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No unbond requests found</p>
              </div>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || (activeTab !== 'claim' && (!amount || !!validationError)) || (validationRules && validationRules.isLoading) || (activeTab === 'claim' && (!stakingInfo?.claimableUnbondRequest || stakingInfo.claimableUnbondRequest === '0'))}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 ${
            activeTab === 'delegate'
              ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white'
              : activeTab === 'undelegate'
              ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white'
              : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
          } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {activeTab === 'delegate' ? 'Staking...' : activeTab === 'undelegate' ? 'Unstaking...' : 'Claiming...'}
            </>
          ) : (
            <>
              {activeTab === 'delegate' ? (
                <>
                  <ArrowUpCircle className="w-4 h-4" />
                  Stake HII
                </>
              ) : activeTab === 'undelegate' ? (
                <>
                  <ArrowDownCircle className="w-4 h-4" />
                  Unstake HII
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Claim Rewards
                </>
              )}
            </>
          )}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error.message}</p>
        </div>
      )}

      {isSuccess && txHash && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 text-sm mb-2">Transaction successful!</p>
          <a
              href={`${process.env.NEXT_PUBLIC_EXPLORER_URL || 'http://103.161.174.30:8067'}/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 underline"
            >
              View on Hii Explorer
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
    </div>
  );
}

