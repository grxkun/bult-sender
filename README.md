# 🚀 Bult Sender - EVM Token Bulk Sender

A powerful and efficient tool for sending ERC-20 tokens to up to 1000 addresses in a single transaction. Built for Ethereum and EVM-compatible networks.

## ✨ Features

- 📤 **Bulk Token Transfers**: Send tokens to up to 1000 addresses in one transaction
- 💰 **Cost Efficient**: Optimized gas usage with batch processing
- 🔒 **Secure**: Built with OpenZeppelin contracts and security best practices
- 📊 **CSV Support**: Import recipient data from CSV files
- ⚡ **Fast Setup**: Easy deployment and configuration
- 🌐 **Multi-Network**: Compatible with Ethereum, Polygon, BSC, and other EVM chains
- 🛡️ **Safety Checks**: Built-in balance and allowance verification

## 🏗️ Architecture

The project consists of:
1. **Smart Contract** (`TokenBulkSender.sol`) - Handles bulk token transfers
2. **CLI Tool** (`src/index.js`) - Command-line interface for easy interaction
3. **Deployment Script** (`scripts/deploy.js`) - Automated contract deployment

## 📋 Prerequisites

- Node.js (v16 or higher)
- NPM or Yarn
- Private key with ETH for gas fees
- RPC endpoint (Infura, Alchemy, or custom node)

## 🚀 Quick Start

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/grxkun/bult-sender.git
cd bult-sender

# Install dependencies
npm install
```

### 2. Environment Setup

```bash
# Copy the environment template
cp .env.example .env

# Edit .env with your configuration
nano .env
```

Required environment variables:
```env
RPC_URL=https://eth-mainnet.alchemyapi.io/v2/YOUR_API_KEY
PRIVATE_KEY=your_private_key_without_0x_prefix
TOKEN_CONTRACT_ADDRESS=0x...  # ERC-20 token to send
BULK_SENDER_CONTRACT_ADDRESS=0x...  # Will be set after deployment
```

### 3. Deploy the Contract

```bash
npm run deploy
```

This will:
- Deploy the `TokenBulkSender` contract
- Display the contract address
- Show next steps

### 4. Start Bulk Sending

Check your token balance:
```bash
npm start balance -t 0xYOUR_TOKEN_ADDRESS
```

Approve tokens for bulk sending:
```bash
npm start approve -t 0xYOUR_TOKEN_ADDRESS -a 1000
```

Send tokens using CSV:
```bash
npm start send-csv -t 0xYOUR_TOKEN_ADDRESS -f examples/recipients.csv
```

## 📖 Usage Guide

### CSV Format

Create a CSV file with recipient addresses and amounts:

```csv
address,amount
0x742d35Cc6734C0532925a3b8D8f40d1b6a6C9D7A,100
0x8ba1f109551bD432803012645Hac136c9b7C75f,50
0x90F79bf6EB2c4f870365E785982E1f101E93b906,25.5
```

### CLI Commands

#### Check Token Balance
```bash
npm start balance -t <TOKEN_ADDRESS>
```

#### Check Allowance
```bash
npm start allowance -t <TOKEN_ADDRESS>
```

#### Approve Tokens
```bash
npm start approve -t <TOKEN_ADDRESS> -a <AMOUNT>
```

#### Send from CSV
```bash
npm start send-csv -t <TOKEN_ADDRESS> -f <CSV_FILE>
```

#### Send Equal Amounts
```bash
npm start send-equal -t <TOKEN_ADDRESS> -a <AMOUNT> -r <RECIPIENT1>,<RECIPIENT2>
```

#### Check Current Fee
```bash
npm start fee
```

### Advanced Options

Add custom gas settings:
```bash
npm start send-csv -t <TOKEN_ADDRESS> -f <CSV_FILE> --gas-price 20 --gas-limit 500000
```

## 🏗️ Smart Contract

### TokenBulkSender Contract Features

- **Maximum Recipients**: Up to 1000 addresses per transaction
- **Fee System**: Small ETH fee per transaction (configurable by owner)
- **Gas Optimized**: Efficient batch processing
- **Security Features**: ReentrancyGuard, Ownable, input validation
- **Two Send Methods**:
  - `bulkSendToken()` - Different amounts per recipient
  - `bulkSendEqualAmount()` - Same amount to all recipients

### Contract Functions

```solidity
// Send different amounts to different recipients
function bulkSendToken(
    address token,
    address[] calldata recipients,
    uint256[] calldata amounts
) external payable

// Send equal amounts to all recipients
function bulkSendEqualAmount(
    address token,
    address[] calldata recipients,
    uint256 amount
) external payable

// Owner functions
function updateFee(uint256 newFee) external onlyOwner
function withdrawFees() external onlyOwner
```

## ⛽ Gas Optimization

The contract is optimized for gas efficiency:

- **Batch Processing**: Single transaction for multiple transfers
- **Minimal Storage**: Stateless design reduces gas costs
- **Optimized Loops**: Efficient iteration through recipients
- **Early Validation**: Fail fast on invalid inputs

Estimated gas usage:
- ~50,000 gas base cost
- ~21,000 gas per transfer
- Total: ~50,000 + (21,000 × recipients)

## 🛡️ Security Features

- **Input Validation**: Validates addresses, amounts, and array lengths
- **Balance Checks**: Ensures sufficient token balance before transfer
- **Allowance Verification**: Checks token approval before proceeding
- **Reentrancy Protection**: Guards against reentrancy attacks
- **Access Control**: Owner-only functions for fee management
- **Fail-Safe**: Transactions fail completely if any transfer fails

## 🌐 Supported Networks

Compatible with any EVM network:

- **Ethereum Mainnet**
- **Polygon (Matic)**
- **Binance Smart Chain**
- **Arbitrum**
- **Optimism**
- **Avalanche C-Chain**
- **Fantom**

## 💸 Fee Structure

- **Transaction Fee**: Small ETH fee per bulk transaction
- **Default Fee**: 0.001 ETH
- **Purpose**: Covers contract maintenance and prevents spam
- **Refundable**: Excess ETH is automatically refunded

## 🔧 Development

### Project Structure

```
bult-sender/
├── contracts/
│   └── TokenBulkSender.sol    # Smart contract
├── scripts/
│   └── deploy.js              # Deployment script
├── src/
│   └── index.js               # CLI application
├── examples/
│   └── recipients.csv         # Sample CSV file
├── package.json
├── .env.example
└── README.md
```

### Building from Source

```bash
# Install dependencies
npm install

# Deploy contract
npm run deploy

# Run CLI
npm start <command>
```

## 📝 Examples

### Example 1: Send Tokens from CSV

```bash
# 1. Prepare CSV file
echo "address,amount" > recipients.csv
echo "0x742d35Cc6734C0532925a3b8D8f40d1b6a6C9D7A,100" >> recipients.csv
echo "0x8ba1f109551bD432803012645Hac136c9b7C75f,50" >> recipients.csv

# 2. Approve tokens
npm start approve -t 0xA0b86a33E6441827C9e1Ba7F99fC6f7c42ED9bC6 -a 1000

# 3. Send tokens
npm start send-csv -t 0xA0b86a33E6441827C9e1Ba7F99fC6f7c42ED9bC6 -f recipients.csv
```

### Example 2: Send Equal Amounts

```bash
# Send 50 tokens to 3 addresses
npm start send-equal \
  -t 0xA0b86a33E6441827C9e1Ba7F99fC6f7c42ED9bC6 \
  -a 50 \
  -r 0x742d35Cc6734C0532925a3b8D8f40d1b6a6C9D7A,0x8ba1f109551bD432803012645Hac136c9b7C75f,0x90F79bf6EB2c4f870365E785982E1f101E93b906
```

## ⚠️ Important Notes

1. **Test First**: Always test on testnets before mainnet deployment
2. **Double-Check**: Verify recipient addresses and amounts before sending
3. **Gas Fees**: Ensure sufficient ETH for transaction fees
4. **Approvals**: Token approval is required before bulk sending
5. **Limits**: Maximum 1000 recipients per transaction
6. **Irreversible**: Token transfers cannot be reversed

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter issues:

1. Check the [Issues](https://github.com/grxkun/bult-sender/issues) page
2. Ensure your `.env` file is correctly configured
3. Verify you have sufficient token balance and allowance
4. Make sure you have enough ETH for gas fees

## 🚨 Disclaimer

This software is provided "as is" without warranty. Users are responsible for:
- Testing thoroughly before mainnet use
- Verifying recipient addresses
- Understanding transaction costs
- Complying with local regulations

Use at your own risk.