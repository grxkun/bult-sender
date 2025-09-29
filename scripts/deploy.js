const { ethers } = require('ethers');
require('dotenv').config();

console.log('🚨 DEPLOYMENT INSTRUCTIONS FOR TOKENBULKSENDER CONTRACT');
console.log('═══════════════════════════════════════════════════════');

console.log('\n📋 Steps to deploy the TokenBulkSender contract:');
console.log('\n1️⃣  COMPILE THE CONTRACT:');
console.log('   • Go to Remix IDE: https://remix.ethereum.org/');
console.log('   • Create new file: TokenBulkSender.sol');
console.log('   • Copy the contract from contracts/TokenBulkSender.sol');
console.log('   • Add OpenZeppelin imports in the imports tab');
console.log('   • Compile using Solidity 0.8.19+');

console.log('\n2️⃣  SETUP ENVIRONMENT:');
console.log('   • Copy .env.example to .env');
console.log('   • Add your RPC_URL (Infura/Alchemy)');
console.log('   • Add your PRIVATE_KEY (without 0x prefix)');
console.log('   • Ensure wallet has ETH for gas fees');

console.log('\n3️⃣  DEPLOY OPTIONS:');
console.log('\n   Option A - Using Remix IDE (Recommended):');
console.log('   • Connect to Injected Web3 (MetaMask)');
console.log('   • Deploy the contract');
console.log('   • Copy the deployed contract address');
console.log('   • Add BULK_SENDER_CONTRACT_ADDRESS to .env');

console.log('\n   Option B - Using this script (Advanced):');
console.log('   • Get compiled bytecode from Remix');
console.log('   • Update the contractBytecode variable in this file');
console.log('   • Run: npm run deploy');

// Placeholder ABI - should match your compiled contract
const contractABI = [
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "inputs": [
            { "internalType": "address", "name": "token", "type": "address" },
            { "internalType": "address[]", "name": "recipients", "type": "address[]" },
            { "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" }
        ],
        "name": "bulkSendToken",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "address", "name": "token", "type": "address" },
            { "internalType": "address[]", "name": "recipients", "type": "address[]" },
            { "internalType": "uint256", "name": "amount", "type": "uint256" }
        ],
        "name": "bulkSendEqualAmount",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getFee",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "owner",
        "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "uint256", "name": "newFee", "type": "uint256" }],
        "name": "updateFee",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "withdrawFees",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

async function deployContract() {
    try {
        // Check if environment variables are set
        if (!process.env.RPC_URL || !process.env.PRIVATE_KEY) {
            console.error('Error: Please set RPC_URL and PRIVATE_KEY in your .env file');
            process.exit(1);
        }

        // Connect to the network
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        
        console.log('Deploying TokenBulkSender contract...');
        console.log('Deployer address:', wallet.address);
        
        // Get the deployer's balance
        const balance = await provider.getBalance(wallet.address);
        console.log('Deployer balance:', ethers.formatEther(balance), 'ETH');
        
        if (balance < ethers.parseEther('0.01')) {
            console.warn('Warning: Low balance. Make sure you have enough ETH for deployment.');
        }
        
        // Create contract factory
        const contractFactory = new ethers.ContractFactory(contractABI, contractBytecode, wallet);
        
        // Deploy the contract
        console.log('Deploying contract...');
        const contract = await contractFactory.deploy();
        
        console.log('Deployment transaction hash:', contract.deploymentTransaction().hash);
        console.log('Waiting for deployment confirmation...');
        
        // Wait for the contract to be deployed
        await contract.waitForDeployment();
        const contractAddress = await contract.getAddress();
        
        console.log('✅ Contract deployed successfully!');
        console.log('Contract address:', contractAddress);
        
        // Verify the deployment
        const fee = await contract.getFee();
        console.log('Current fee:', ethers.formatEther(fee), 'ETH');
        
        console.log('\n📝 Next steps:');
        console.log('1. Add the contract address to your .env file:');
        console.log(`   BULK_SENDER_CONTRACT_ADDRESS=${contractAddress}`);
        console.log('2. Verify the contract on Etherscan (optional)');
        console.log('3. Start using the bulk sender CLI tool');
        
        return contractAddress;
    } catch (error) {
        console.error('❌ Deployment failed:', error.message);
        process.exit(1);
    }
}

// Run the deployment
if (require.main === module) {
    deployContract();
}

module.exports = { deployContract };