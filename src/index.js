#!/usr/bin/env node

const { ethers } = require('ethers');
const { program } = require('commander');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
require('dotenv').config();

// Contract ABI for TokenBulkSender
const BULK_SENDER_ABI = [
    "function bulkSendToken(address token, address[] calldata recipients, uint256[] calldata amounts) external payable",
    "function bulkSendEqualAmount(address token, address[] calldata recipients, uint256 amount) external payable",
    "function getFee() external view returns (uint256)",
    "function owner() external view returns (address)",
    "event BulkTransfer(address indexed token, address indexed sender, uint256 recipientCount, uint256 totalAmount)"
];

// ERC-20 ABI (minimal)
const ERC20_ABI = [
    "function symbol() external view returns (string)",
    "function name() external view returns (string)",
    "function decimals() external view returns (uint8)",
    "function balanceOf(address account) external view returns (uint256)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function approve(address spender, uint256 amount) external returns (bool)"
];

class BulkSender {
    constructor() {
        this.provider = null;
        this.wallet = null;
        this.bulkSenderContract = null;
        this.tokenContract = null;
    }

    async initialize() {
        try {
            // Validate environment variables
            this.validateEnvironment();

            // Initialize provider and wallet
            this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
            this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
            
            console.log('🔗 Connected to network');
            console.log('📍 Wallet address:', this.wallet.address);
            
            // Initialize bulk sender contract
            if (process.env.BULK_SENDER_CONTRACT_ADDRESS) {
                this.bulkSenderContract = new ethers.Contract(
                    process.env.BULK_SENDER_CONTRACT_ADDRESS,
                    BULK_SENDER_ABI,
                    this.wallet
                );
                console.log('📄 Bulk sender contract loaded:', process.env.BULK_SENDER_CONTRACT_ADDRESS);
            }

            return true;
        } catch (error) {
            console.error('❌ Initialization failed:', error.message);
            return false;
        }
    }

    validateEnvironment() {
        const required = ['RPC_URL', 'PRIVATE_KEY'];
        const missing = required.filter(key => !process.env[key]);
        
        if (missing.length > 0) {
            throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
        }
    }

    async loadTokenContract(tokenAddress) {
        try {
            this.tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.wallet);
            
            // Get token info
            const [symbol, name, decimals] = await Promise.all([
                this.tokenContract.symbol(),
                this.tokenContract.name(),
                this.tokenContract.decimals()
            ]);

            console.log(`🪙 Token: ${name} (${symbol})`);
            console.log(`📊 Decimals: ${decimals}`);
            
            return { symbol, name, decimals };
        } catch (error) {
            throw new Error(`Failed to load token contract: ${error.message}`);
        }
    }

    async checkBalance(tokenAddress) {
        try {
            await this.loadTokenContract(tokenAddress);
            
            const balance = await this.tokenContract.balanceOf(this.wallet.address);
            const decimals = await this.tokenContract.decimals();
            const symbol = await this.tokenContract.symbol();
            
            const formattedBalance = ethers.formatUnits(balance, decimals);
            console.log(`💰 Your ${symbol} balance: ${formattedBalance}`);
            
            return balance;
        } catch (error) {
            console.error('❌ Failed to check balance:', error.message);
            throw error;
        }
    }

    async checkAllowance(tokenAddress) {
        try {
            if (!this.bulkSenderContract) {
                throw new Error('Bulk sender contract not initialized. Please set BULK_SENDER_CONTRACT_ADDRESS in .env');
            }

            await this.loadTokenContract(tokenAddress);
            
            const allowance = await this.tokenContract.allowance(
                this.wallet.address,
                await this.bulkSenderContract.getAddress()
            );
            
            const decimals = await this.tokenContract.decimals();
            const symbol = await this.tokenContract.symbol();
            
            const formattedAllowance = ethers.formatUnits(allowance, decimals);
            console.log(`✅ Current allowance: ${formattedAllowance} ${symbol}`);
            
            return allowance;
        } catch (error) {
            console.error('❌ Failed to check allowance:', error.message);
            throw error;
        }
    }

    async approveToken(tokenAddress, amount) {
        try {
            if (!this.bulkSenderContract) {
                throw new Error('Bulk sender contract not initialized. Please set BULK_SENDER_CONTRACT_ADDRESS in .env');
            }

            await this.loadTokenContract(tokenAddress);
            
            const decimals = await this.tokenContract.decimals();
            const symbol = await this.tokenContract.symbol();
            const parsedAmount = ethers.parseUnits(amount, decimals);
            
            console.log(`📝 Approving ${amount} ${symbol} for bulk sender...`);
            
            const tx = await this.tokenContract.approve(
                await this.bulkSenderContract.getAddress(),
                parsedAmount
            );
            
            console.log('⏳ Transaction hash:', tx.hash);
            console.log('Waiting for confirmation...');
            
            await tx.wait();
            console.log('✅ Approval successful!');
            
            return tx.hash;
        } catch (error) {
            console.error('❌ Approval failed:', error.message);
            throw error;
        }
    }

    async parseCSV(filePath) {
        return new Promise((resolve, reject) => {
            const recipients = [];
            const amounts = [];
            
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (row) => {
                    // Expected CSV format: address,amount
                    if (row.address && row.amount) {
                        recipients.push(row.address.trim());
                        amounts.push(row.amount.trim());
                    }
                })
                .on('end', () => {
                    console.log(`📊 Parsed ${recipients.length} recipients from CSV`);
                    resolve({ recipients, amounts });
                })
                .on('error', reject);
        });
    }

    async bulkSend(tokenAddress, recipients, amounts, options = {}) {
        try {
            if (!this.bulkSenderContract) {
                throw new Error('Bulk sender contract not initialized. Please set BULK_SENDER_CONTRACT_ADDRESS in .env');
            }

            // Validate inputs
            if (recipients.length === 0) {
                throw new Error('No recipients provided');
            }
            
            if (recipients.length > 1000) {
                throw new Error('Too many recipients. Maximum is 1000 per transaction');
            }
            
            if (recipients.length !== amounts.length) {
                throw new Error('Recipients and amounts arrays must have the same length');
            }

            // Load token contract
            const tokenInfo = await this.loadTokenContract(tokenAddress);
            
            // Convert amounts to proper format
            const parsedAmounts = amounts.map(amount => 
                ethers.parseUnits(amount.toString(), tokenInfo.decimals)
            );

            // Calculate total amount
            const totalAmount = parsedAmounts.reduce((sum, amount) => sum + amount, BigInt(0));
            const formattedTotal = ethers.formatUnits(totalAmount, tokenInfo.decimals);
            
            console.log(`🎯 Sending to ${recipients.length} recipients`);
            console.log(`💰 Total amount: ${formattedTotal} ${tokenInfo.symbol}`);

            // Check balance
            const balance = await this.tokenContract.balanceOf(this.wallet.address);
            if (balance < totalAmount) {
                throw new Error(`Insufficient balance. Need ${formattedTotal} ${tokenInfo.symbol}, have ${ethers.formatUnits(balance, tokenInfo.decimals)}`);
            }

            // Check allowance
            const allowance = await this.tokenContract.allowance(
                this.wallet.address,
                await this.bulkSenderContract.getAddress()
            );
            if (allowance < totalAmount) {
                throw new Error(`Insufficient allowance. Need ${formattedTotal} ${tokenInfo.symbol}, approved ${ethers.formatUnits(allowance, tokenInfo.decimals)}`);
            }

            // Get fee
            const fee = await this.bulkSenderContract.getFee();
            console.log(`💳 Transaction fee: ${ethers.formatEther(fee)} ETH`);

            // Check ETH balance for fee
            const ethBalance = await this.provider.getBalance(this.wallet.address);
            if (ethBalance < fee) {
                throw new Error(`Insufficient ETH for fee. Need ${ethers.formatEther(fee)} ETH`);
            }

            // Send transaction
            console.log('📤 Sending bulk transaction...');
            const tx = await this.bulkSenderContract.bulkSendToken(
                tokenAddress,
                recipients,
                parsedAmounts,
                { value: fee, ...options }
            );

            console.log('⏳ Transaction hash:', tx.hash);
            console.log('Waiting for confirmation...');

            const receipt = await tx.wait();
            console.log(`✅ Bulk send successful! Block: ${receipt.blockNumber}`);
            console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}`);

            return { tx, receipt };
        } catch (error) {
            console.error('❌ Bulk send failed:', error.message);
            throw error;
        }
    }

    async bulkSendEqual(tokenAddress, recipients, amount, options = {}) {
        try {
            if (!this.bulkSenderContract) {
                throw new Error('Bulk sender contract not initialized. Please set BULK_SENDER_CONTRACT_ADDRESS in .env');
            }

            // Load token contract
            const tokenInfo = await this.loadTokenContract(tokenAddress);
            
            // Convert amount to proper format
            const parsedAmount = ethers.parseUnits(amount.toString(), tokenInfo.decimals);
            const totalAmount = parsedAmount * BigInt(recipients.length);
            
            console.log(`🎯 Sending ${amount} ${tokenInfo.symbol} to ${recipients.length} recipients`);
            console.log(`💰 Total amount: ${ethers.formatUnits(totalAmount, tokenInfo.decimals)} ${tokenInfo.symbol}`);

            // Get fee and send transaction
            const fee = await this.bulkSenderContract.getFee();
            console.log(`💳 Transaction fee: ${ethers.formatEther(fee)} ETH`);

            console.log('📤 Sending bulk transaction...');
            const tx = await this.bulkSenderContract.bulkSendEqualAmount(
                tokenAddress,
                recipients,
                parsedAmount,
                { value: fee, ...options }
            );

            console.log('⏳ Transaction hash:', tx.hash);
            const receipt = await tx.wait();
            console.log(`✅ Bulk send successful! Block: ${receipt.blockNumber}`);

            return { tx, receipt };
        } catch (error) {
            console.error('❌ Bulk send failed:', error.message);
            throw error;
        }
    }
}

// CLI Commands
program
    .name('bult-sender')
    .description('EVM Token Bulk Sender - Send tokens to up to 1000 addresses')
    .version('1.0.0');

// Balance command
program
    .command('balance')
    .description('Check token balance')
    .requiredOption('-t, --token <address>', 'Token contract address')
    .action(async (options) => {
        const sender = new BulkSender();
        if (await sender.initialize()) {
            await sender.checkBalance(options.token);
        }
    });

// Allowance command
program
    .command('allowance')
    .description('Check token allowance')
    .requiredOption('-t, --token <address>', 'Token contract address')
    .action(async (options) => {
        const sender = new BulkSender();
        if (await sender.initialize()) {
            await sender.checkAllowance(options.token);
        }
    });

// Approve command
program
    .command('approve')
    .description('Approve tokens for bulk sending')
    .requiredOption('-t, --token <address>', 'Token contract address')
    .requiredOption('-a, --amount <amount>', 'Amount to approve')
    .action(async (options) => {
        const sender = new BulkSender();
        if (await sender.initialize()) {
            await sender.approveToken(options.token, options.amount);
        }
    });

// Send command (from CSV)
program
    .command('send-csv')
    .description('Send tokens from CSV file')
    .requiredOption('-t, --token <address>', 'Token contract address')
    .requiredOption('-f, --file <path>', 'CSV file path (format: address,amount)')
    .option('--gas-price <price>', 'Gas price in gwei')
    .option('--gas-limit <limit>', 'Gas limit')
    .action(async (options) => {
        const sender = new BulkSender();
        if (await sender.initialize()) {
            const { recipients, amounts } = await sender.parseCSV(options.file);
            
            const txOptions = {};
            if (options.gasPrice) {
                txOptions.gasPrice = ethers.parseUnits(options.gasPrice, 'gwei');
            }
            if (options.gasLimit) {
                txOptions.gasLimit = options.gasLimit;
            }
            
            await sender.bulkSend(options.token, recipients, amounts, txOptions);
        }
    });

// Send equal amounts command
program
    .command('send-equal')
    .description('Send equal amounts to multiple addresses')
    .requiredOption('-t, --token <address>', 'Token contract address')
    .requiredOption('-a, --amount <amount>', 'Amount to send to each recipient')
    .requiredOption('-r, --recipients <addresses>', 'Comma-separated recipient addresses')
    .option('--gas-price <price>', 'Gas price in gwei')
    .option('--gas-limit <limit>', 'Gas limit')
    .action(async (options) => {
        const sender = new BulkSender();
        if (await sender.initialize()) {
            const recipients = options.recipients.split(',').map(addr => addr.trim());
            
            const txOptions = {};
            if (options.gasPrice) {
                txOptions.gasPrice = ethers.parseUnits(options.gasPrice, 'gwei');
            }
            if (options.gasLimit) {
                txOptions.gasLimit = options.gasLimit;
            }
            
            await sender.bulkSendEqual(options.token, recipients, options.amount, txOptions);
        }
    });

// Fee command
program
    .command('fee')
    .description('Check current fee')
    .action(async () => {
        const sender = new BulkSender();
        if (await sender.initialize()) {
            if (!sender.bulkSenderContract) {
                console.error('❌ Bulk sender contract not initialized');
                return;
            }
            const fee = await sender.bulkSenderContract.getFee();
            console.log(`💳 Current fee: ${ethers.formatEther(fee)} ETH`);
        }
    });

// Parse command line arguments
program.parse();

module.exports = BulkSender;