#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import Table from 'cli-table3';
import fs from 'fs';
import csv from 'csv-parser';
import { SUPPORTED_CHAINS } from './config/chains';
import { WalletService } from './services/WalletService';
import { BulkSenderService } from './services/BulkSenderService';
import { validateAddresses, isValidAddress } from './utils/validation';
import { TokenTransfer, ChainConfig } from './types';

const program = new Command();

program
  .name('bult-sender')
  .description('Bulk token sender for EVM chains')
  .version('1.0.0');

interface CliOptions {
  chain?: string;
  token?: string;
  privateKey?: string;
  addresses?: string;
  amount?: string;
  csv?: string;
  dryRun?: boolean;
  gasLimit?: number;
  gasPrice?: string;
}

async function loadAddressesFromCSV(csvPath: string): Promise<TokenTransfer[]> {
  const transfers: TokenTransfer[] = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        // Expected CSV format: address,amount
        const address = row.address || row.Address || row.ADDRESS;
        const amount = row.amount || row.Amount || row.AMOUNT;
        
        if (address && amount) {
          transfers.push({ to: address.trim(), amount: amount.trim() });
        }
      })
      .on('end', () => {
        resolve(transfers);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

async function promptForMissingOptions(options: CliOptions): Promise<{
  chainConfig: ChainConfig;
  tokenAddress: string;
  privateKey: string;
  transfers: TokenTransfer[];
}> {
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'chain',
      message: 'Select blockchain:',
      choices: Object.entries(SUPPORTED_CHAINS).map(([key, config]) => ({
        name: `${config.name} (${config.symbol})`,
        value: key
      })),
      when: !options.chain
    },
    {
      type: 'input',
      name: 'tokenAddress',
      message: 'Enter token contract address:',
      validate: (input) => isValidAddress(input) || 'Please enter a valid address',
      when: !options.token
    },
    {
      type: 'password',
      name: 'privateKey',
      message: 'Enter private key:',
      mask: '*',
      validate: (input) => input.length > 0 || 'Private key is required',
      when: !options.privateKey
    }
  ]);

  const chainKey = options.chain || answers.chain;
  const chainConfig = SUPPORTED_CHAINS[chainKey];
  if (!chainConfig) {
    throw new Error(`Unsupported chain: ${chainKey}`);
  }

  const tokenAddress = options.token || answers.tokenAddress;
  const privateKey = options.privateKey || answers.privateKey;

  let transfers: TokenTransfer[] = [];

  if (options.csv) {
    console.log(chalk.blue('Loading addresses from CSV...'));
    transfers = await loadAddressesFromCSV(options.csv);
  } else if (options.addresses && options.amount) {
    const addresses = options.addresses.split(',').map(addr => addr.trim());
    transfers = addresses.map(address => ({ to: address, amount: options.amount! }));
  } else {
    // Interactive address input
    const addressAnswers = await inquirer.prompt([
      {
        type: 'editor',
        name: 'addresses',
        message: 'Enter recipient addresses (one per line):',
      },
      {
        type: 'input',
        name: 'amount',
        message: 'Enter amount to send to each address:',
        validate: (input) => !isNaN(parseFloat(input)) || 'Please enter a valid number'
      }
    ]);

    const addresses = addressAnswers.addresses
      .split('\n')
      .map((addr: string) => addr.trim())
      .filter((addr: string) => addr.length > 0);
    
    transfers = addresses.map((address: string) => ({ 
      to: address, 
      amount: addressAnswers.amount 
    }));
  }

  return { chainConfig, tokenAddress, privateKey, transfers };
}

async function displaySummary(
  chainConfig: ChainConfig,
  tokenAddress: string,
  transfers: TokenTransfer[],
  walletService: WalletService,
  bulkSender: BulkSenderService
) {
  console.log(chalk.green('\n📊 Transfer Summary:'));
  console.log(chalk.blue(`Chain: ${chainConfig.name}`));
  console.log(chalk.blue(`Token: ${tokenAddress}`));
  console.log(chalk.blue(`From: ${walletService.getAddress()}`));
  console.log(chalk.blue(`Recipients: ${transfers.length}`));

  try {
    const validation = await bulkSender.validateTokenAndBalances({
      tokenAddress,
      transfers
    });

    if (!validation.isValid) {
      console.log(chalk.red('\n❌ Validation Errors:'));
      validation.errors.forEach(error => console.log(chalk.red(`  - ${error}`)));
      return false;
    }

    console.log(chalk.green(`\n✅ Token: ${validation.tokenInfo.symbol}`));
    console.log(chalk.green(`Balance: ${validation.tokenInfo.balance} ${validation.tokenInfo.symbol}`));
    
    const totalRequired = ethers.formatUnits(validation.totalRequired, validation.tokenInfo.decimals);
    console.log(chalk.green(`Total Required: ${totalRequired} ${validation.tokenInfo.symbol}`));

    // Show gas estimation
    const gasEstimate = await bulkSender.estimateGasCosts({ tokenAddress, transfers });
    console.log(chalk.yellow(`\n⛽ Estimated Gas Cost: ${gasEstimate.estimatedCostETH} ${chainConfig.symbol}`));
    console.log(chalk.yellow(`Gas per transaction: ${gasEstimate.gasPerTransaction}`));

    return true;
  } catch (error) {
    console.log(chalk.red(`\n❌ Error validating transfers: ${error}`));
    return false;
  }
}

async function executeTransfers(
  tokenAddress: string,
  transfers: TokenTransfer[],
  bulkSender: BulkSenderService,
  dryRun: boolean = false,
  gasLimit?: number,
  gasPrice?: string
) {
  if (dryRun) {
    console.log(chalk.yellow('\n🧪 DRY RUN MODE - No actual transactions will be sent\n'));
  } else {
    console.log(chalk.green('\n🚀 Starting bulk transfer...\n'));
  }

  const results = await bulkSender.executeBulkTransfer({
    tokenAddress,
    transfers,
    dryRun,
    gasLimit,
    gasPrice
  });

  // Display results
  const table = new Table({
    head: ['Recipient', 'Amount', 'Status', 'Tx Hash / Error'],
    colWidths: [45, 20, 12, 50]
  });

  let successCount = 0;
  let failureCount = 0;

  results.forEach(result => {
    if (result.success) {
      successCount++;
      table.push([
        result.to,
        result.amount,
        chalk.green('✅ Success'),
        result.txHash ? result.txHash.substring(0, 20) + '...' : 'N/A'
      ]);
    } else {
      failureCount++;
      table.push([
        result.to,
        result.amount,
        chalk.red('❌ Failed'),
        result.error ? result.error.substring(0, 47) + '...' : 'Unknown error'
      ]);
    }
  });

  console.log(table.toString());
  
  console.log(chalk.green(`\n📈 Summary: ${successCount} successful, ${failureCount} failed`));
}

program
  .option('-c, --chain <chain>', 'blockchain to use')
  .option('-t, --token <address>', 'token contract address')
  .option('-k, --private-key <key>', 'private key for sender wallet')
  .option('-a, --addresses <addresses>', 'comma-separated list of recipient addresses')
  .option('--amount <amount>', 'amount to send to each address')
  .option('--csv <path>', 'path to CSV file with addresses and amounts')
  .option('--dry-run', 'perform a dry run without sending transactions')
  .option('--gas-limit <limit>', 'gas limit per transaction')
  .option('--gas-price <price>', 'gas price in gwei')
  .action(async (options: CliOptions) => {
    try {
      console.log(chalk.blue('🚀 Welcome to Bulk Token Sender\n'));

      const { chainConfig, tokenAddress, privateKey, transfers } = await promptForMissingOptions(options);

      // Validate addresses
      const addresses = transfers.map(t => t.to);
      const { valid, invalid } = validateAddresses(addresses);
      
      if (invalid.length > 0) {
        console.log(chalk.red(`❌ Invalid addresses found:`));
        invalid.forEach(addr => console.log(chalk.red(`  - ${addr}`)));
        process.exit(1);
      }

      console.log(chalk.green(`✅ All ${valid.length} addresses are valid`));

      // Initialize services
      const walletService = new WalletService(chainConfig);
      await walletService.connectWithPrivateKey(privateKey);
      
      const bulkSender = new BulkSenderService(walletService);

      // Display summary and validate
      const isValid = await displaySummary(chainConfig, tokenAddress, transfers, walletService, bulkSender);
      
      if (!isValid) {
        process.exit(1);
      }

      // Confirm execution
      if (!options.dryRun) {
        const confirmation = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'proceed',
            message: 'Do you want to proceed with the bulk transfer?',
            default: false
          }
        ]);

        if (!confirmation.proceed) {
          console.log(chalk.yellow('Transfer cancelled by user'));
          process.exit(0);
        }
      }

      // Execute transfers
      await executeTransfers(
        tokenAddress,
        transfers,
        bulkSender,
        options.dryRun,
        options.gasLimit,
        options.gasPrice
      );

    } catch (error) {
      console.error(chalk.red(`❌ Error: ${error}`));
      process.exit(1);
    }
  });

// Add import for ethers (needed for formatUnits)
import { ethers } from 'ethers';

program.parse();