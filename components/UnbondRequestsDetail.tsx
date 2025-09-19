import React, { useState, useEffect } from 'react';
import { useAccount, useContractRead } from 'wagmi';
import { formatEther } from 'viem';
import { Clock, CheckCircle, Loader2 } from 'lucide-react';
import { STAKEHUB_ABI, STAKE_CREDIT_ABI } from '@/config/abi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { formatHII } from '@/utils/formatters';

// Helper function to format datetime in DD/MM/YYYY HH:MM:SS format
const formatDateTime = (timestamp: number) => {
  const date = new Date(timestamp);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};

interface UnbondRequest {
  shares: bigint;
  bnbAmount: bigint;
  unlockTime: bigint;
  requestTime: bigint;
  index: number;
}

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
  const { address } = useAccount();
  const [unbondRequests, setUnbondRequests] = useState<UnbondRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Read unbond period from StakeHub contract
  const { data: unbondPeriod } = useContractRead({
    address: CONTRACT_ADDRESSES.STAKEHUB as `0x${string}`,
    abi: STAKEHUB_ABI,
    functionName: 'unbondPeriod',
  });

  // Format unbond period to human-readable format
  const formatUnbondPeriod = (periodInSeconds: bigint | undefined) => {
    if (!periodInSeconds) return '7 days'; // fallback
    
    const seconds = Number(periodInSeconds);
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    
    if (days > 0) {
      return hours > 0 ? `${days} days ${hours} hours` : `${days} days`;
    } else if (hours > 0) {
      return `${hours} hours`;
    } else {
      return `${Math.floor(seconds / 60)} minutes`;
    }
  };

  // Fetch individual unbond requests from the API
  const fetchUnbondRequests = async () => {
    if (!creditContractAddress || !address || (pendingCount === 0 && claimableCount === 0)) {
      setUnbondRequests([]);
      return;
    }

    setIsLoading(true);
    const requests: UnbondRequest[] = [];

    try {
      // Fetch all unbond requests (both pending and claimable)
      const totalRequests = pendingCount + claimableCount;
      
      for (let i = 0; i < totalRequests; i++) {
        try {
          const response = await fetch('/api/unbond-request', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contractAddress: creditContractAddress,
              account: address,
              index: i,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            requests.push({
              shares: BigInt(data.shares || '0'),
              bnbAmount: BigInt(data.hncAmount || '0'), // Note: API returns hncAmount but we use bnbAmount
              unlockTime: BigInt(data.unlockTime || '0'),
              requestTime: BigInt(data.requestTime || '0'),
              index: i
            });
          } else {
            console.warn(`Failed to fetch unbond request ${i}:`, response.statusText);
          }
        } catch (error) {
          console.warn(`Error fetching unbond request ${i}:`, error);
        }
      }
      
      setUnbondRequests(requests);
    } catch (error) {
      console.error('Error fetching unbond requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUnbondRequests();
  }, [pendingCount, claimableCount, creditContractAddress, address]);

  const formatTimeRemaining = (unlockTime: bigint) => {
    const now = Math.floor(Date.now() / 1000);
    const unlock = Number(unlockTime);
    const remaining = unlock - now;

    if (remaining <= 0) {
      return { text: 'Ready to claim', isReady: true };
    }

    const days = Math.floor(remaining / (24 * 60 * 60));
    const hours = Math.floor((remaining % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((remaining % (60 * 60)) / 60);

    if (days > 0) {
      return { text: `${days}d ${hours}h remaining`, isReady: false };
    } else if (hours > 0) {
      return { text: `${hours}h ${minutes}m remaining`, isReady: false };
    } else {
      return { text: `${minutes}m remaining`, isReady: false };
    }
  };

  if (pendingCount === 0 && claimableCount === 0) {
    return (
      <div className="bg-gray-50 rounded-xl p-6 text-center">
        <p className="text-gray-600">No unbond requests found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-gray-600">Loading unbond requests...</span>
          </div>
        </div>
      ) : (
        <>
          {/* Pending Requests */}
          {pendingCount > 0 && (
            <div className="bg-white rounded-xl p-6 border border-blue-200">
              <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Pending Unbond Requests ({pendingCount})
              </h4>
              <div className="space-y-3">
                {unbondRequests.slice(0, pendingCount).map((request, index) => {
                  const timeInfo = formatTimeRemaining(request.unlockTime);
                  const bnbAmount = formatEther(request.bnbAmount);
                  
                  return (
                    <div key={index} className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            Request #{index + 1}
                          </p>
                          <p className="text-sm text-gray-600">
                            Amount: {formatHII(bnbAmount)} HII
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-medium ${timeInfo.isReady ? 'text-green-600' : 'text-blue-600'}`}>
                            {timeInfo.text}
                          </p>
                          {request.requestTime > 0n && (
                            <p className="text-xs text-gray-500">
                              Requested: {formatDateTime(Number(request.requestTime) * 1000)}
                            </p>
                          )}
                          <p className="text-xs text-gray-400">
                            Unlock: {formatDateTime(Number(request.unlockTime) * 1000)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Claimable Requests */}
          {claimableCount > 0 && (
            <div className="bg-white rounded-xl p-6 border border-green-200">
              <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Ready to Claim ({claimableCount})
              </h4>
              <div className="space-y-3">
                {unbondRequests.slice(pendingCount).map((request, index) => {
                  const bnbAmount = formatEther(request.bnbAmount);
                  
                  return (
                    <div key={index} className="bg-green-50 rounded-lg p-4 border border-green-100">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            Claimable Request #{index + 1}
                          </p>
                          <p className="text-sm text-gray-600">
                            Amount: {formatHII(bnbAmount)} HII
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-green-600">
                            Ready to claim
                          </p>
                          {request.requestTime > 0n && (
                            <p className="text-xs text-gray-500">
                              Requested: {formatDateTime(Number(request.requestTime) * 1000)}
                            </p>
                          )}
                          <p className="text-xs text-gray-400">
                            Unlocked: {formatDateTime(Number(request.unlockTime) * 1000)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Information Note */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Unbond requests have a {formatUnbondPeriod(unbondPeriod)} waiting period before they can be claimed. 
              The amounts shown are the actual HII values from your unbond requests.
            </p>
          </div>
        </>
      )}
    </div>
  );
}