import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { formatEther } from 'viem';
import { ENV } from '../config/env';

interface Transaction {
  hash: string;
  type: 'delegate' | 'undelegate' | 'claim' | 'unknown';
  amount?: string;
  timestamp: number;
  blockNumber: number;
}

interface TransactionHistoryProps {
  address?: string;
  creditContractAddress?: string;
  showHeader?: boolean;
}

export interface TransactionHistoryRef {
  refresh: () => void;
}

const TransactionHistory = forwardRef<TransactionHistoryRef, TransactionHistoryProps>(({ 
  address, 
  creditContractAddress, 
  showHeader = true 
}, ref) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    hasMore: false
  });

  const fetchTransactions = async (page: number = 1) => {
    if (!address) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/transaction-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          address,
          page,
          limit: 20
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();
      setTransactions(data.transactions || []);
      setPagination(data.pagination || {
        page: 1,
        limit: 20,
        total: 0,
        hasMore: false
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(currentPage);
  }, [address, currentPage]);

  // Expose refresh function to parent component
  useImperativeHandle(ref, () => ({
    refresh: () => fetchTransactions(currentPage)
  }));

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const formatAmount = (amount: string | undefined) => {
    if (!amount) return 'N/A';
    try {
      // Amount is already in Ether format from the API, just format it
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount)) return 'N/A';
      return `${numAmount.toFixed(2)} HII`;
    } catch {
      return 'N/A';
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'delegate':
        return 'text-green-600 bg-green-100';
      case 'undelegate':
        return 'text-red-600 bg-red-100';
      case 'claim':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getExplorerUrl = (hash: string) => {
    return `${ENV.EXPLORER_URL}/tx/${hash}`;
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Transaction History</h3>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading transactions...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Transaction History</h3>
        <button
          onClick={() => fetchTransactions(currentPage)}
          disabled={loading}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {transactions.length === 0 && !loading ? (
        <div className="text-center py-8 text-gray-500">
          No transactions found for this address.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Block
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((tx, index) => (
                  <tr key={`${tx.hash}-${index}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTransactionTypeColor(tx.type)}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatAmount(tx.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTimestamp(tx.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {tx.blockNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                      <a
                        href={getExplorerUrl(tx.hash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.total > pagination.limit && (
            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-gray-700">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} transactions
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1 || loading}
                  className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded">
                  Page {pagination.page}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!pagination.hasMore || loading}
                  className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <div className="mt-4 text-xs text-gray-500 text-center">
        Powered by{' '}
        <a
          href={ENV.EXPLORER_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          Hii Network Explorer
        </a>
      </div>
    </div>
  );
});

export default TransactionHistory;