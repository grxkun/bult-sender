import { ethers } from 'ethers';
import { BulkTransferOptions, TransferResult, TokenTransfer } from '../types';
import { WalletService } from './WalletService';
import { ERC20_ABI, MAX_ADDRESSES_PER_BATCH } from '../config/chains';
import { chunkArray, delay, parseAmount } from '../utils/validation';

export class BulkSenderService {
  private walletService: WalletService;

  constructor(walletService: WalletService) {
    this.walletService = walletService;
  }

  async validateTokenAndBalances(options: BulkTransferOptions): Promise<{
    tokenInfo: { symbol: string; decimals: number; balance: string };
    totalRequired: string;
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    if (options.transfers.length === 0) {
      errors.push('No transfers provided');
    }

    if (options.transfers.length > MAX_ADDRESSES_PER_BATCH) {
      errors.push(`Maximum ${MAX_ADDRESSES_PER_BATCH} addresses allowed`);
    }

    if (!ethers.isAddress(options.tokenAddress)) {
      errors.push('Invalid token address');
    }

    let tokenInfo: { symbol: string; decimals: number; balance: string } = {
      symbol: 'UNKNOWN',
      decimals: 18,
      balance: '0'
    };

    try {
      tokenInfo = await this.walletService.getTokenBalance(options.tokenAddress);
    } catch (error) {
      errors.push(`Failed to get token info: ${error}`);
      return { tokenInfo, totalRequired: '0', isValid: false, errors };
    }

    let totalRequired = '0';
    try {
      totalRequired = options.transfers
        .reduce((sum, transfer) => {
          const amount = parseAmount(transfer.amount, tokenInfo.decimals);
          return sum + BigInt(amount);
        }, BigInt(0))
        .toString();

      const totalRequiredFormatted = ethers.formatUnits(totalRequired, tokenInfo.decimals);
      const balanceNum = parseFloat(tokenInfo.balance);
      const requiredNum = parseFloat(totalRequiredFormatted);

      if (balanceNum < requiredNum) {
        errors.push(`Insufficient balance. Required: ${totalRequiredFormatted} ${tokenInfo.symbol}, Available: ${tokenInfo.balance} ${tokenInfo.symbol}`);
      }
    } catch (error) {
      errors.push(`Failed to calculate total required amount: ${error}`);
    }

    return {
      tokenInfo,
      totalRequired,
      isValid: errors.length === 0,
      errors
    };
  }

  async executeBulkTransfer(options: BulkTransferOptions): Promise<TransferResult[]> {
    if (!this.walletService.isConnected()) {
      throw new Error('Wallet not connected');
    }

    const validation = await this.validateTokenAndBalances(options);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const wallet = this.walletService.getWallet();
    const tokenContract = new ethers.Contract(options.tokenAddress, ERC20_ABI, wallet);
    
    const results: TransferResult[] = [];

    // Process transfers in chunks to avoid overwhelming the network
    const chunks = chunkArray(options.transfers, 10); // Process 10 at a time
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`Processing batch ${i + 1}/${chunks.length} (${chunk.length} transfers)`);

      const chunkResults = await Promise.allSettled(
        chunk.map(async (transfer) => {
          if (options.dryRun) {
            return {
              success: true,
              txHash: 'DRY_RUN',
              to: transfer.to,
              amount: transfer.amount
            };
          }

          try {
            const amount = parseAmount(transfer.amount, validation.tokenInfo.decimals);
            
            const tx = await tokenContract.transfer(transfer.to, amount, {
              gasLimit: options.gasLimit || 100000,
              gasPrice: options.gasPrice ? ethers.parseUnits(options.gasPrice, 'gwei') : undefined
            });

            const receipt = await tx.wait();
            
            return {
              success: true,
              txHash: receipt.hash,
              to: transfer.to,
              amount: transfer.amount
            };
          } catch (error) {
            return {
              success: false,
              error: error instanceof Error ? error.message : String(error),
              to: transfer.to,
              amount: transfer.amount
            };
          }
        })
      );

      // Process results
      chunkResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            success: false,
            error: result.reason,
            to: chunk[index].to,
            amount: chunk[index].amount
          });
        }
      });

      // Add delay between batches to avoid rate limiting
      if (i < chunks.length - 1 && !options.dryRun) {
        await delay(2000); // 2 second delay between batches
      }
    }

    return results;
  }

  async estimateGasCosts(options: BulkTransferOptions): Promise<{
    totalGasEstimate: string;
    estimatedCostETH: string;
    gasPerTransaction: number;
  }> {
    if (!this.walletService.isConnected()) {
      throw new Error('Wallet not connected');
    }

    const wallet = this.walletService.getWallet();
    const tokenContract = new ethers.Contract(options.tokenAddress, ERC20_ABI, wallet);
    
    // Estimate gas for a single transfer
    const sampleTransfer = options.transfers[0];
    const validation = await this.validateTokenAndBalances(options);
    const amount = parseAmount(sampleTransfer.amount, validation.tokenInfo.decimals);
    
    const gasEstimate = await tokenContract.transfer.estimateGas(sampleTransfer.to, amount);
    const provider = wallet.provider;
    if (!provider) {
      throw new Error('Wallet provider not available');
    }
    const gasPrice = await provider.getFeeData();
    
    const gasPerTransaction = Number(gasEstimate);
    const totalGasEstimate = (gasPerTransaction * options.transfers.length).toString();
    const totalCostWei = BigInt(totalGasEstimate) * (gasPrice.gasPrice || BigInt(0));
    const estimatedCostETH = ethers.formatEther(totalCostWei);

    return {
      totalGasEstimate,
      estimatedCostETH,
      gasPerTransaction
    };
  }
}