import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, parseAbiItem } from 'viem';
import { CHAIN_CONFIG, CONTRACT_ADDRESSES } from '../../../config/contracts';
import { STAKE_CREDIT_ABI } from '../../../config/abi';
import { ENV } from '../../../config/env';

const client = createPublicClient({
  chain: CHAIN_CONFIG,
  transport: http(ENV.RPC_URL),
});

// Event signature for undelegate events to find request time
const UNDELEGATE_EVENT = parseAbiItem('event Undelegated(address indexed delegator, address indexed operatorAddress, uint256 shares, uint256 bnbAmount)');

export async function POST(request: NextRequest) {
  try {
    const { contractAddress, account, index } = await request.json();

    if (!contractAddress || !account || index === undefined) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const unbondRequest = await client.readContract({
      address: contractAddress as `0x${string}`,
      abi: STAKE_CREDIT_ABI,
      functionName: 'unbondRequest',
      args: [account as `0x${string}`, BigInt(index)],
    });

    // Check if unbondRequest is valid and has the expected structure
    if (!unbondRequest || !Array.isArray(unbondRequest) || unbondRequest.length < 3) {
      return NextResponse.json(
        { error: 'Invalid unbond request data' },
        { status: 404 }
      );
    }

    // Try to find the request time by looking for undelegate events
    let requestTime = 0;
    try {
      const currentBlock = await client.getBlockNumber();
      const fromBlock = currentBlock - 10000n; // Look back 10000 blocks
      
      const undelegateEvents = await client.getLogs({
        address: CONTRACT_ADDRESSES.STAKEHUB as `0x${string}`,
        event: UNDELEGATE_EVENT,
        args: {
          delegator: account as `0x${string}`,
          operatorAddress: CONTRACT_ADDRESSES.OPERATOR as `0x${string}`,
        },
        fromBlock,
        toBlock: currentBlock,
      });

      // Find the event that corresponds to this unbond request
      // We'll use the shares amount to match the event to the request
      const requestShares = unbondRequest[0];
      for (const event of undelegateEvents.reverse()) { // Start from most recent
        if (event.args.shares === requestShares) {
          const block = await client.getBlock({ blockNumber: event.blockNumber });
          requestTime = Number(block.timestamp);
          break;
        }
      }
    } catch (error) {
      console.warn('Could not fetch request time:', error);
    }

    return NextResponse.json({
      shares: unbondRequest[0]?.toString() || '0',
      hncAmount: unbondRequest[1]?.toString() || '0',
      unlockTime: unbondRequest[2]?.toString() || '0',
      requestTime: requestTime.toString(),
    });
  } catch (error) {
    console.error('Error fetching unbond request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch unbond request' },
      { status: 500 }
    );
  }
}

