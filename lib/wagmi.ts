import { createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { CHAIN_CONFIG } from '@/config/contracts';
import { ENV } from '../config/env';

const rpcUrl = ENV.RPC_URL;

// Use only injected connector to avoid dependency conflicts
const connectors = [
  injected(),
];

export const config = createConfig({
  chains: [CHAIN_CONFIG],
  connectors,
  transports: {
    [CHAIN_CONFIG.id]: http(rpcUrl, {
      // Add retry and timeout configuration to handle RPC failures
      retryCount: 2,
      retryDelay: 1000,
      timeout: 10000, // 10 second timeout
    }),
  },
  // Disable global polling to prevent excessive RPC calls
  pollingInterval: 0, // Disable automatic polling globally
});

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
