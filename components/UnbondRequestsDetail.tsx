import React from 'react';
import { Clock, CheckCircle, Loader2 } from 'lucide-react';
import { formatHII } from '@/utils/formatters';
import { useUnbondRequests } from '@/hooks/useUnbondRequests';
import { formatEther } from 'viem';

// Helper function to format datetime in DD/MM/YYYY HH:MM:SS format
const formatDateTime = (timestamp: number) => {
  const date = new Date(timestamp * 1000);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};

interface UnbondRequestsDetailProps {
  pendingCount: number;
  claimableCount: number;
  creditContractAddress: string;
}

export function UnbondRequestsDetail({ 
  pendingCount, 
  claimableCount, 
  creditContractAddress 
}: UnbondRequestsDetailProps) {
  const { unbondRequests, isLoading } = useUnbondRequests(
    pendingCount,
    claimableCount,
    creditContractAddress
  );

  const formatTimeRemaining = (unlockTime: bigint) => {
    const now = Math.floor(Date.now() / 1000);
    const unlock = Number(unlockTime);
    
    if (unlock <= now) {
      return 'Ready to claim';
    }
    
    const remaining = unlock - now;
    const days = Math.floor(remaining / (24 * 60 * 60));
    const hours = Math.floor((remaining % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((remaining % (60 * 60)) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h remaining`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else {
      return `${minutes}m remaining`;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading unbond requests...</span>
      </div>
    );
  }

  if (unbondRequests.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No unbond requests found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {unbondRequests.map((request, index) => {
        const isClaimable = Number(request.unlockTime) <= Math.floor(Date.now() / 1000);
        const totalAmount = formatEther(request.bnbAmount);
        const principleAmount = request.principle ? formatEther(request.principle) : totalAmount;
        const rewardAmount = request.reward ? formatEther(request.reward) : '0';
        
        return (
          <div
            key={index}
            className="border border-orange-200 bg-orange-50 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900">
                Request #{index + 1}
              </h4>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                isClaimable 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-orange-100 text-orange-800'
              }`}>
                {isClaimable ? (
                  <>
                    <CheckCircle className="w-3 h-3" />
                    Ready to claim
                  </>
                ) : (
                  <>
                    <Clock className="w-3 h-3" />
                    Pending
                  </>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Amount:</span>
                <span className="font-medium text-gray-900">
                  {formatHII(totalAmount)} HII
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Principal:</span>
                <span className="font-medium text-gray-900">
                  {formatHII(principleAmount)} HII
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Reward:</span>
                <span className="font-medium text-green-600">
                  {formatHII(rewardAmount)} HII
                </span>
              </div>
              
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-sm text-gray-600">Unlock Time:</span>
                <span className="text-sm text-gray-900">
                  {formatDateTime(Number(request.unlockTime))}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Status:</span>
                <span className={`text-sm font-medium ${
                  isClaimable ? 'text-green-600' : 'text-orange-600'
                }`}>
                  {formatTimeRemaining(request.unlockTime)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}