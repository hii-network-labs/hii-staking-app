import { ENV } from './env';

// Contract addresses for Hii Network Devnet
export const CONTRACT_ADDRESSES = {
  STAKEHUB: ENV.STAKEHUB_ADDRESS,
  OPERATOR: ENV.OPERATOR_ADDRESS,
} as const;

// RPC URLs
export const RPC_URLS = {
  HII_DEVNET: ENV.RPC_URL,
  BNB_TESTNET: 'https://data-seed-prebsc-1-s1.binance.org:8545',
} as const;

// Chain configuration
export const CHAIN_CONFIG = {
  id: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '15984'),
  name: process.env.NEXT_PUBLIC_CHAIN_NAME || 'Hii Network devnet',
  network: 'hii-devnet',
  nativeCurrency: {
    decimals: parseInt(process.env.NEXT_PUBLIC_NATIVE_CURRENCY_DECIMALS || '18'),
    name: process.env.NEXT_PUBLIC_NATIVE_CURRENCY_NAME || 'HII',
    symbol: process.env.NEXT_PUBLIC_NATIVE_CURRENCY_SYMBOL || 'HII',
  },
  rpcUrls: {
    default: {
      http: [RPC_URLS.HII_DEVNET],
    },
    public: {
      http: [RPC_URLS.HII_DEVNET],
    },
  },
  blockExplorers: {
    default: {
      name: 'Hii Network Explorer',
      url: ENV.EXPLORER_URL,
    },
  },
  testnet: true,
} as const;

