import { ethers } from 'ethers';

export function isValidAddress(address: string): boolean {
  return ethers.isAddress(address);
}

export function isValidPrivateKey(privateKey: string): boolean {
  try {
    new ethers.Wallet(privateKey);
    return true;
  } catch {
    return false;
  }
}

export function parseAmount(amount: string, decimals: number): string {
  return ethers.parseUnits(amount, decimals).toString();
}

export function formatAmount(amount: string, decimals: number): string {
  return ethers.formatUnits(amount, decimals);
}

export function validateAddresses(addresses: string[]): { valid: string[]; invalid: string[] } {
  const valid: string[] = [];
  const invalid: string[] = [];
  
  addresses.forEach(address => {
    if (isValidAddress(address)) {
      valid.push(address);
    } else {
      invalid.push(address);
    }
  });
  
  return { valid, invalid };
}

export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}