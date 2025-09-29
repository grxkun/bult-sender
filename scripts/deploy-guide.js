const { ethers } = require('ethers');
const fs = require('fs');
require('dotenv').config();

console.log('🚀 TOKENBULKSENDER DEPLOYMENT GUIDE');
console.log('═══════════════════════════════════');

console.log('\n📋 Quick Start Deployment Steps:');
console.log('\n1️⃣  COMPILE THE CONTRACT:');
console.log('   • Go to Remix IDE: https://remix.ethereum.org/');
console.log('   • Create TokenBulkSender.sol');
console.log('   • Copy contract code from contracts/TokenBulkSender.sol');
console.log('   • Install @openzeppelin/contracts in the file manager');
console.log('   • Compile with Solidity 0.8.19+');

console.log('\n2️⃣  SETUP ENVIRONMENT:');
console.log('   • Copy .env.example to .env');
console.log('   • Add your RPC_URL (Infura/Alchemy/etc.)');
console.log('   • Add your PRIVATE_KEY (without 0x prefix)');
console.log('   • Ensure wallet has sufficient ETH for gas');

console.log('\n3️⃣  DEPLOY (Recommended - Remix):');
console.log('   • Connect MetaMask to Remix');
console.log('   • Deploy TokenBulkSender contract');
console.log('   • Copy deployed address');
console.log('   • Add to .env: BULK_SENDER_CONTRACT_ADDRESS=0x...');

console.log('\n4️⃣  START BULK SENDING:');
console.log('   • npm start balance -t <TOKEN_ADDRESS>');
console.log('   • npm start approve -t <TOKEN_ADDRESS> -a <AMOUNT>');
console.log('   • npm start send-csv -t <TOKEN_ADDRESS> -f recipients.csv');

// Environment check
console.log('\n🔍 ENVIRONMENT CHECK:');
console.log('═══════════════════════');

const hasEnvFile = fs.existsSync('.env');
console.log(`📄 .env file: ${hasEnvFile ? '✅' : '❌'}`);

if (hasEnvFile) {
    const checks = {
        'RPC_URL': process.env.RPC_URL,
        'PRIVATE_KEY': process.env.PRIVATE_KEY,
        'BULK_SENDER_CONTRACT_ADDRESS': process.env.BULK_SENDER_CONTRACT_ADDRESS
    };
    
    Object.entries(checks).forEach(([key, value]) => {
        console.log(`${key}: ${value ? '✅' : '❌'}`);
    });
    
    if (checks.RPC_URL && checks.PRIVATE_KEY && checks.BULK_SENDER_CONTRACT_ADDRESS) {
        console.log('\n🎉 Environment ready! Start using the CLI tools.');
    } else {
        console.log('\n⚠️  Complete .env setup to use the bulk sender.');
    }
} else {
    console.log('\n➡️  Next: cp .env.example .env && nano .env');
}

console.log('\n📚 Full documentation: README.md');
console.log('💡 Example CSV: examples/recipients.csv');
console.log('🆘 Issues: https://github.com/grxkun/bult-sender/issues');

console.log('\n✨ Happy bulk sending! 🚀');

module.exports = {};