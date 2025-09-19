'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Wallet, LogOut, Loader2 } from 'lucide-react';

export function ConnectWalletButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleConnect = (connector: any) => {
    connect({ connector });
  };

  if (isConnected) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg">
          <Wallet className="w-4 h-4" />
          <span className="text-sm font-medium">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </span>
        </div>
        <button
          onClick={() => disconnect()}
          className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-medium">Disconnect</span>
        </button>
      </div>
    );
  }

  // Show a consistent loading state during hydration
  if (!isClient) {
    return (
      <div className="flex gap-2">
        <button
          disabled
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg opacity-50 cursor-not-allowed"
        >
          <Wallet className="w-4 h-4" />
          <span className="text-sm font-medium">
            Connect Wallet
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      {connectors.map((connector) => (
        <button
          key={connector.id}
          onClick={() => handleConnect(connector)}
          disabled={isPending}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Wallet className="w-4 h-4" />
          )}
          <span className="text-sm font-medium">
            {connector.name}
          </span>
        </button>
      ))}
    </div>
  );
}
