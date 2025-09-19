'use client';

import React, { useRef } from 'react';
import { useAccount } from 'wagmi';
import { ConnectWalletButton } from '@/components/ConnectWalletButton';
import { DelegateForm } from '@/components/DelegateForm';
import { StakingInfo } from '@/components/StakingInfo';
import TransactionHistory, { TransactionHistoryRef } from '@/components/TransactionHistory';
import { TrendingUp, Wallet, BarChart3, History, Zap } from 'lucide-react';

export default function Home() {
  const { address } = useAccount();
  const transactionHistoryRef = useRef<TransactionHistoryRef>(null);

  const handleTransactionSuccess = () => {
    // Refresh transaction history after successful transaction
    setTimeout(() => {
      transactionHistoryRef.current?.refresh();
    }, 1000);
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8 lg:mb-10">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3 lg:mb-4">
            HII Staking Platform
          </h1>
          <p className="text-base lg:text-lg text-gray-600 max-w-2xl mx-auto px-4">
            Stake your HII tokens to earn rewards and participate in the network consensus
          </p>
          <div className="mt-5 lg:mt-6 flex justify-center">
          <ConnectWalletButton />
        </div>
        </div>

      {/* Main Content Grid */}
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Staking Operations and Transaction History */}
            <div className="lg:col-span-2 space-y-6">
              {/* Staking Operations */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Zap className="w-6 h-6 text-blue-600" />
                  </div>
                  Staking Operations
                </h2>
                <DelegateForm onTransactionSuccess={handleTransactionSuccess} />
              </div>

              {/* Transaction History */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <TransactionHistory ref={transactionHistoryRef} address={address} showHeader={false} />
              </div>
            </div>

            {/* Right Column - Staking Information */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sticky top-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-green-600" />
                  </div>
                  Staking Information
                </h2>
                <StakingInfo />
              </div>
            </div>
          </div>
        </div>
      </div>

        {/* Key Features */}
        <div className="mt-12 lg:mt-16 mb-10 lg:mb-12">
          <h2 className="text-xl lg:text-2xl font-bold text-center text-gray-900 mb-6 lg:mb-8">Key Features</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 max-w-4xl mx-auto px-4">
            <div className="bg-white rounded-xl p-4 lg:p-5 shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-8 h-8 lg:w-10 lg:h-10 bg-green-100 rounded-lg flex items-center justify-center mb-2 lg:mb-3">
                <TrendingUp className="w-5 h-5 lg:w-6 lg:h-6 text-green-600" />
              </div>
              <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-1 lg:mb-2">Delegate HII</h3>
                <p className="text-xs lg:text-sm text-gray-600">Stake your HII tokens to earn rewards and support network security</p>
            </div>
            
            <div className="bg-white rounded-xl p-4 lg:p-5 shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-8 h-8 lg:w-10 lg:h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-2 lg:mb-3">
                <BarChart3 className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600" />
              </div>
              <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-1 lg:mb-2">Track Staking</h3>
              <p className="text-xs lg:text-sm text-gray-600">Monitor your staking rewards and unbonding requests in real-time</p>
            </div>
            
            <div className="bg-white rounded-xl p-4 lg:p-5 shadow-md border border-gray-200 hover:shadow-lg transition-shadow sm:col-span-2 lg:col-span-1">
              <div className="w-8 h-8 lg:w-10 lg:h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-2 lg:mb-3">
                <Wallet className="w-5 h-5 lg:w-6 lg:h-6 text-purple-600" />
              </div>
              <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-1 lg:mb-2">Wallet Integration</h3>
              <p className="text-xs lg:text-sm text-gray-600">Seamlessly connect with popular wallets for secure transactions</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-gray-600">
          <p className="mb-2">
            Built with Next.js, wagmi, ethers.js and TailwindCSS
          </p>
          <p className="text-sm">
            Running on Hii Network Devnet
          </p>
        </footer>
      </div>
    </div>
  );
}

