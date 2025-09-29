import { ChainConfig } from '../types';

export const SUPPORTED_CHAINS: Record<string, ChainConfig> = {
  ethereum: {
    name: 'Ethereum Mainnet',
    chainId: 1,
    rpc: 'https://eth-mainnet.g.alchemy.com/v2/demo',
    symbol: 'ETH',
    blockExplorer: 'https://etherscan.io'
  },
  sepolia: {
    name: 'Ethereum Sepolia',
    chainId: 11155111,
    rpc: 'https://eth-sepolia.g.alchemy.com/v2/demo',
    symbol: 'ETH',
    blockExplorer: 'https://sepolia.etherscan.io'
  },
  polygon: {
    name: 'Polygon Mainnet',
    chainId: 137,
    rpc: 'https://polygon-rpc.com',
    symbol: 'MATIC',
    blockExplorer: 'https://polygonscan.com'
  },
  mumbai: {
    name: 'Polygon Mumbai',
    chainId: 80001,
    rpc: 'https://rpc-mumbai.maticvigil.com',
    symbol: 'MATIC',
    blockExplorer: 'https://mumbai.polygonscan.com'
  },
  bsc: {
    name: 'BSC Mainnet',
    chainId: 56,
    rpc: 'https://bsc-dataseed1.binance.org',
    symbol: 'BNB',
    blockExplorer: 'https://bscscan.com'
  },
  bsc_testnet: {
    name: 'BSC Testnet',
    chainId: 97,
    rpc: 'https://data-seed-prebsc-1-s1.binance.org:8545',
    symbol: 'BNB',
    blockExplorer: 'https://testnet.bscscan.com'
  }
};

export const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)'
];

export const MAX_ADDRESSES_PER_BATCH = 1000;