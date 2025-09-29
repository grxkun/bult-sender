# Bulk Token Sender (Bult-Sender)

A powerful CLI tool for sending ERC-20 tokens to multiple addresses on EVM-compatible blockchains. Send tokens to up to 1000 addresses in a single batch operation.

## Features

- **Multi-Chain Support**: Ethereum, Polygon, BSC, and their testnets
- **Bulk Transfer**: Send tokens to up to 1000 addresses at once
- **Wallet Integration**: Connect using private key
- **Gas Optimization**: Batched processing with configurable gas settings
- **Validation**: Address validation and balance checking
- **CSV Support**: Load recipient addresses from CSV files
- **Dry Run**: Test transactions without actual execution
- **Real-time Progress**: Live transaction status updates

## Supported Chains

- Ethereum Mainnet & Sepolia Testnet
- Polygon Mainnet & Mumbai Testnet
- Binance Smart Chain & BSC Testnet

## Installation

1. Clone the repository:
```bash
git clone https://github.com/grxkun/bult-sender.git
cd bult-sender
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

## Usage

### Interactive Mode (Recommended)

Run the tool without any parameters for an interactive setup:

```bash
npm start
```

The tool will prompt you for:
- Blockchain network selection
- Token contract address
- Private key (secure input)
- Recipient addresses and amounts

### Command Line Mode

```bash
npm start -- --chain ethereum --token 0x... --private-key 0x... --addresses 0x...,0x... --amount 10.5
```

### CSV Mode

Create a CSV file with addresses and amounts:

```csv
address,amount
0x742d35Cc6aBfC0532435A8a8f4a9b7D8a6d8bb3c,10.5
0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045,25.0
0x8ba1f109551bD432803012645Bd19D56aBf9e6C3,15.25
```

Then use:
```bash
npm start -- --chain polygon --token 0x... --private-key 0x... --csv addresses.csv
```

### Command Line Options

- `-c, --chain <chain>`: Blockchain network (ethereum, polygon, bsc, sepolia, mumbai, bsc_testnet)
- `-t, --token <address>`: Token contract address
- `-k, --private-key <key>`: Private key of sender wallet
- `-a, --addresses <addresses>`: Comma-separated recipient addresses
- `--amount <amount>`: Amount to send to each address
- `--csv <path>`: Path to CSV file with addresses and amounts
- `--dry-run`: Perform validation without sending transactions
- `--gas-limit <limit>`: Custom gas limit per transaction
- `--gas-price <price>`: Custom gas price in gwei

## Examples

### Send 10 USDC to 3 addresses on Ethereum:
```bash
npm start -- \
  --chain ethereum \
  --token 0xA0b86a33E6441d7d8e9E64b40A72f5B6C76eA5bD \
  --private-key 0xYOUR_PRIVATE_KEY \
  --addresses 0xAddr1,0xAddr2,0xAddr3 \
  --amount 10
```

### Dry run with CSV file on Polygon:
```bash
npm start -- \
  --chain polygon \
  --token 0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174 \
  --private-key 0xYOUR_PRIVATE_KEY \
  --csv addresses.csv \
  --dry-run
```

## Security Considerations

⚠️ **Important Security Notes:**

1. **Private Key Safety**: Never share your private key or commit it to version control
2. **Testnet First**: Always test on testnets before using on mainnet
3. **Double Check**: Verify all addresses and amounts before executing
4. **Start Small**: Begin with small amounts to ensure everything works correctly

## CSV Format

The CSV file should have the following format:

```csv
address,amount
0x742d35Cc6aBfC0532435A8a8f4a9b7D8a6d8bb3c,10.5
0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045,25.0
```

Headers can be: `address`/`Address`/`ADDRESS` and `amount`/`Amount`/`AMOUNT`

## Gas Optimization

The tool automatically:
- Processes transfers in batches of 10 to prevent network congestion
- Adds delays between batches to avoid rate limiting
- Estimates gas costs before execution
- Uses reasonable default gas limits

## Error Handling

The tool provides detailed error messages for:
- Invalid addresses
- Insufficient token balance
- Network connectivity issues
- Transaction failures
- Gas estimation problems

## Development

### Build from source:
```bash
npm run build
```

### Run in development mode:
```bash
npm run dev
```

### Lint code:
```bash
npm run lint
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

If you encounter any issues or have questions:

1. Check the [troubleshooting section](#troubleshooting)
2. Open an issue on GitHub
3. Provide detailed error messages and steps to reproduce

## Troubleshooting

### Common Issues

**"Insufficient balance" error:**
- Ensure your wallet has enough tokens for the transfer
- Account for gas fees in your native token (ETH, MATIC, BNB)

**"Invalid address" error:**
- Verify all recipient addresses are valid Ethereum addresses
- Check for extra spaces or characters

**Network errors:**
- Try a different RPC endpoint
- Check your internet connection
- Some free RPC endpoints have rate limits

**Transaction stuck/pending:**
- Check the transaction on a block explorer
- Consider increasing gas price for faster confirmation

### Getting Help

For technical support, please provide:
- Command used
- Error message
- Network/chain being used
- Token contract address (if not sensitive)