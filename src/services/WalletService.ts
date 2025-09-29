import { ethers } from 'ethers';
import { ChainConfig } from '../types';
import { ERC20_ABI } from '../config/chains';

export class WalletService {
  private provider: ethers.Provider;
  private wallet: ethers.Wallet | null = null;

  constructor(chainConfig: ChainConfig) {
    this.provider = new ethers.JsonRpcProvider(chainConfig.rpc);
  }

  async connectWithPrivateKey(privateKey: string): Promise<void> {
    try {
      this.wallet = new ethers.Wallet(privateKey, this.provider);
    } catch (error) {
      throw new Error(`Failed to connect wallet: ${error}`);
    }
  }

  getAddress(): string {
    if (!this.wallet) {
      throw new Error('Wallet not connected');
    }
    return this.wallet.address;
  }

  async getBalance(): Promise<string> {
    if (!this.wallet) {
      throw new Error('Wallet not connected');
    }
    const balance = await this.provider.getBalance(this.wallet.address);
    return ethers.formatEther(balance);
  }

  async getTokenBalance(tokenAddress: string): Promise<{ balance: string; symbol: string; decimals: number }> {
    if (!this.wallet) {
      throw new Error('Wallet not connected');
    }

    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
    
    const [balance, symbol, decimals] = await Promise.all([
      tokenContract.balanceOf(this.wallet.address),
      tokenContract.symbol(),
      tokenContract.decimals()
    ]);

    return {
      balance: ethers.formatUnits(balance, decimals),
      symbol,
      decimals
    };
  }

  getWallet(): ethers.Wallet {
    if (!this.wallet) {
      throw new Error('Wallet not connected');
    }
    return this.wallet;
  }

  isConnected(): boolean {
    return this.wallet !== null;
  }
}