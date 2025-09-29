export interface ChainConfig {
  name: string;
  chainId: number;
  rpc: string;
  symbol: string;
  blockExplorer: string;
}

export interface TokenTransfer {
  to: string;
  amount: string;
}

export interface TransferResult {
  success: boolean;
  txHash?: string;
  error?: string;
  to: string;
  amount: string;
}

export interface BulkTransferOptions {
  tokenAddress: string;
  transfers: TokenTransfer[];
  gasLimit?: number;
  gasPrice?: string;
  dryRun?: boolean;
}