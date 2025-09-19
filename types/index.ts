export interface TransactionState {
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  txHash: string | null;
}

export interface UnbondRequest {
  shares: bigint;
  hncAmount: bigint;
  unlockTime: bigint;
}

export interface StakingInfo {
  balance: string;
  pooledHNC: string;
  pooledHIIRaw: bigint; // Raw BigInt value to avoid precision loss
  shares: string;
  sharesRaw: bigint; // Raw BigInt shares value
  pendingUnbondRequests: number;
  unbondRequests: UnbondRequest[];
  claimableUnbondRequests: number;
  creditContractAddress: string;
}

