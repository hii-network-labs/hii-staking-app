import { NextRequest, NextResponse } from 'next/server';
import { decodeFunctionData, parseAbi, formatEther, decodeEventLog } from 'viem';
import { ENV } from '../../../config/env';

// Contract addresses and API configuration
const STAKEHUB_ADDRESS = ENV.STAKEHUB_ADDRESS as `0x${string}`;

// External API base URL
const EXTERNAL_API_BASE = ENV.EXTERNAL_API_BASE;

// In-memory cache for transaction logs (simple cache, could be replaced with Redis in production)
const logCache = new Map<string, { data: any[], timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const STAKEHUB_ABI = parseAbi([
  'function delegate(address arg0, bool arg1) payable returns (uint256 shares)',
  'function undelegate(address delegator, uint256 shares) returns (uint256 bnbAmount)',
  'function claim(address payable delegator, uint256 number) returns (uint256)',
  'event Claimed(address indexed user, address indexed token, uint256 amount)',
]);

// Function to convert Wei to BNB
function formatAmount(weiValue: string): string {
  try {
    if (!weiValue || weiValue === '0') return '0';
    return formatEther(BigInt(weiValue));
  } catch (error) {
    return '0';
  }
}

// Function to fetch transaction logs from the custom chain explorer with caching
async function fetchTransactionLogs(txHash: string): Promise<any[]> {
  try {
    // Check cache first
    const cached = logCache.get(txHash);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    const response = await fetch(`${EXTERNAL_API_BASE}/transactions/${txHash}/logs`);
    if (!response.ok) {
      throw new Error(`Failed to fetch logs: ${response.status}`);
    }
    const data = await response.json();
    const logs = data.items || [];
    
    // Cache the result
    logCache.set(txHash, { data: logs, timestamp: Date.now() });
    
    return logs;
  } catch (error) {
    console.error('Error fetching transaction logs:', error);
    return [];
  }
}

// Function to extract claim amount from Claimed event logs
async function extractClaimAmountFromLogs(txHash: string): Promise<string> {
  try {
    const logs = await fetchTransactionLogs(txHash);
    
    // Find the Claimed event log (method_id: f7a40077)
    const claimedLog = logs.find(log => 
      log.decoded && 
      log.decoded.method_id === 'f7a40077' && 
      log.decoded.method_call.includes('Claimed')
    );
    
    if (claimedLog && claimedLog.decoded && claimedLog.decoded.parameters) {
      // Find the amount parameter
      const amountParam = claimedLog.decoded.parameters.find((param: any) => 
        param.name === 'amount' && param.type === 'uint256'
      );
      
      if (amountParam && amountParam.value) {
        return formatAmount(amountParam.value);
      }
    }
    
    return '0';
  } catch (error) {
    console.error('Error extracting claim amount from logs:', error);
    return '0';
  }
}

// Function to determine transaction type and extract amount from input data
async function getTransactionType(rawInput: string, txValue: string, txHash?: string): Promise<{ type: string; amount: string }> {
  try {
    console.log('getTransactionType called with:', { rawInput, txValue, txHash });
    
    if (!rawInput || rawInput === '0x' || rawInput.length < 10) {
      console.log('Invalid raw input, returning unknown');
      return { type: 'unknown', amount: '0' };
    }

    console.log('Attempting to decode function data...');
    const { functionName, args } = decodeFunctionData({
      abi: STAKEHUB_ABI,
      data: rawInput as `0x${string}`,
    });
    
    console.log('Decoded function:', functionName, 'args:', args);

    switch (functionName) {
      case 'delegate':
        // For delegate, the amount is the BNB value sent with the transaction
        return { type: 'delegate', amount: formatAmount(txValue || '0') };
      case 'undelegate':
        // For undelegate, the amount is in the shares parameter (arg1)
        const shares = args && args[1] ? args[1].toString() : '0';
        return { type: 'undelegate', amount: formatAmount(shares) };
      case 'claim':
        // For claim, extract amount from the transaction logs
        const claimAmount = await extractClaimAmountFromLogs(txHash || '');
        return { type: 'claim', amount: claimAmount };
      default:
        console.log('Unknown function name:', functionName);
        return { type: 'unknown', amount: '0' };
    }
  } catch (error) {
    console.log('Error in getTransactionType:', error);
    return { type: 'unknown', amount: '0' };
  }
}

// Function to convert timestamp to unix timestamp
function parseTimestamp(timestamp: string): number {
  return Math.floor(new Date(timestamp).getTime() / 1000);
}

export async function POST(request: NextRequest) {
  try {
    const { address, page = 1, limit = 50 } = await request.json();

    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      );
    }

    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // Max 100 transactions per page
    const offset = (pageNum - 1) * limitNum;

    // Fetch real transaction data from external API
    console.log(`Fetching transactions for address: ${address}`);
    const apiUrl = `${EXTERNAL_API_BASE}/addresses/${address}/transactions?filter=to%20%7C%20from`;
    
    let data;
    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`External API error: ${response.status} ${response.statusText}`);
      }
      data = await response.json();
      console.log(`Fetched ${data.items?.length || 0} transactions from external API`);
    } catch (error) {
      console.error('Failed to fetch from external API:', error);
      return NextResponse.json(
        { error: 'Failed to fetch transaction data from external API' },
        { status: 500 }
      );
    }
    const transactions = [];

    // Process transactions from external API with parallel processing for claim transactions
    if (data.items && Array.isArray(data.items)) {
      // First, collect all claim transactions that need log fetching
      const claimTransactions: any[] = [];
      const nonClaimTransactions: any[] = [];

      for (const tx of data.items) {
        console.log('Processing transaction:', tx.hash);
        console.log('From:', tx.from?.hash, 'To:', tx.to?.hash);
        console.log('Address:', address, 'StakeHub:', STAKEHUB_ADDRESS);
        
        // Check if transaction is to/from StakeHub contract
        const isToStakeHub = tx.to?.hash?.toLowerCase() === STAKEHUB_ADDRESS.toLowerCase();
        const isFromUser = tx.from?.hash?.toLowerCase() === address.toLowerCase();
        
        console.log('isToStakeHub:', isToStakeHub, 'isFromUser:', isFromUser, 'has raw_input:', !!tx.raw_input);
        
        if (isToStakeHub && isFromUser && tx.raw_input && tx.status === 'ok') {
          console.log('Transaction matches criteria, processing...');
          // Quick check if it's a claim transaction (method ID: aad3ec96)
          if (tx.raw_input.startsWith('0xaad3ec96')) {
            claimTransactions.push(tx);
          } else {
            nonClaimTransactions.push(tx);
          }
        }
      }

      // Process non-claim transactions synchronously (fast)
      for (const tx of nonClaimTransactions) {
        console.log('Processing non-claim transaction:', tx.hash, 'raw_input:', tx.raw_input);
        const txType = await getTransactionType(tx.raw_input, tx.value || '0', tx.hash);
        console.log('Transaction type result:', txType);
        
        if (txType.type !== 'unknown') {
          console.log('Adding transaction to results');
          transactions.push({
            hash: tx.hash,
            type: txType.type,
            amount: txType.amount,
            timestamp: parseTimestamp(tx.timestamp),
            blockNumber: tx.block_number || tx.block,
            status: tx.status === 'ok' ? 'success' : 'failed',
            gasUsed: tx.gas_used?.toString() || '0',
            gasPrice: tx.gas_price?.toString() || '0',
            nonce: tx.nonce,
          });
        } else {
          console.log('Transaction type is unknown, skipping');
        }
      }

      // Process claim transactions in parallel (slower due to log fetching)
      const claimPromises = claimTransactions.map(async (tx) => {
        const txType = await getTransactionType(tx.raw_input, tx.value || '0', tx.hash);
        
        if (txType.type !== 'unknown') {
          return {
            hash: tx.hash,
            type: txType.type,
            amount: txType.amount,
            timestamp: parseTimestamp(tx.timestamp),
            blockNumber: tx.block_number || tx.block,
            status: tx.status === 'ok' ? 'success' : 'failed',
            gasUsed: tx.gas_used?.toString() || '0',
            gasPrice: tx.gas_price?.toString() || '0',
            nonce: tx.nonce,
          };
        }
        return null;
      });

      // Wait for all claim transactions to be processed
      const claimResults = await Promise.all(claimPromises);
      
      // Add successful claim transactions to the main array
      for (const result of claimResults) {
        if (result) {
          transactions.push(result);
        }
      }
    }

    // Sort by timestamp (newest first)
    transactions.sort((a, b) => b.timestamp - a.timestamp);
    console.log('Total transactions before filtering:', transactions.length);

    // Filter to show only successful transactions
    const successfulTransactions = transactions.filter(tx => tx.status === 'success');
    console.log('Successful transactions after filtering:', successfulTransactions.length);

    // Apply pagination to successful transactions
    const paginatedTransactions = successfulTransactions.slice(offset, offset + limitNum);
    console.log('Paginated transactions:', paginatedTransactions.length);

    // Return paginated response with metadata
    return NextResponse.json({
      transactions: paginatedTransactions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: successfulTransactions.length,
        hasMore: offset + limitNum < successfulTransactions.length
      }
    });
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transaction history' },
      { status: 500 }
    );
  }
}