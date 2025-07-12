# Payment Scripts for Smart Contracts

This directory contains comprehensive payment scripts for interacting with smart contracts that require Ether payments.

## Overview

The scripts are designed to work with:
- **Exam Contract**: Handles exam fee payments for students
- **HostelSnacks Contract**: Manages snack purchases with Ether payments
- **CollegeBreakfast Contract**: Food ordering system (non-payment)

## Scripts Description

### 1. `deployContracts.js`
- Deploys all smart contracts to the Hardhat network
- Manages contract addresses and deployment info
- Saves deployment details to JSON file

### 2. `examPaymentScript.js`
- Handles all exam-related payment operations
- Features:
  - Deploy exam contracts
  - Register students and set exam details
  - Process exam fee payments
  - Track payment status

### 3. `hostelSnacksPaymentScript.js`
- Manages all snack purchasing operations
- Features:
  - Register sellers and buyers
  - Add snacks to inventory
  - Process snack purchases with payment validation
  - Handle refunds
  - Update pricing

### 4. `masterPaymentScript.js`
- Orchestrates all payment workflows
- Runs complete demonstrations
- Generates payment reports
- Utility functions for quick operations

## Prerequisites

1. **Install Dependencies**:
   ```bash
   npm install web3
   ```

2. **Compile Contracts**:
   ```bash
   npx hardhat compile
   ```

3. **Start Hardhat Network**:
   ```bash
   npx hardhat node
   ```

## Usage Examples

### Quick Start - Run Complete Demo
```bash
node scripts/payment/masterPaymentScript.js
```

### Deploy All Contracts
```bash
node scripts/payment/deployContracts.js
```

### Exam Payment Demo
```bash
node scripts/payment/examPaymentScript.js
```

### Snacks Payment Demo
```bash
node scripts/payment/hostelSnacksPaymentScript.js
```

## Individual Operations

### Exam Payments
```javascript
const { ExamPaymentManager } = require('./examPaymentScript');

const examManager = new ExamPaymentManager();
await examManager.initialize();
// Deploy, setup, and process payments...
```

### Snack Purchases
```javascript
const { HostelSnacksPaymentManager } = require('./hostelSnacksPaymentScript');

const snacksManager = new HostelSnacksPaymentManager();
await snacksManager.initialize();
// Register users, add snacks, process purchases...
```

## Payment Workflow Features

### Exam Contract Payments
- ✅ Exam fee validation
- ✅ Student registration
- ✅ Payment processing
- ✅ Balance verification
- ✅ Transaction tracking

### HostelSnacks Contract Payments
- ✅ Multi-item inventory management
- ✅ Dynamic pricing
- ✅ Quantity validation
- ✅ Payment calculation
- ✅ Refund processing
- ✅ Seller earnings tracking

## Error Handling

All scripts include comprehensive error handling for:
- Insufficient balance
- Invalid payment amounts
- Contract interaction failures
- Network connectivity issues
- Gas estimation errors

## Security Features

- Payment amount validation
- Balance verification before transactions
- Gas estimation with safety buffers
- Transaction confirmation
- Error recovery mechanisms

## Monitoring & Reporting

The scripts provide detailed logging for:
- Transaction hashes
- Account balances before/after operations
- Gas usage
- Payment amounts and recipients
- Error messages and stack traces

## Configuration

Default configuration uses Hardhat local network:
- Network URL: `http://127.0.0.1:8545`
- Uses Hardhat's pre-funded test accounts
- Automatic gas price estimation

## Testing Integration

The scripts are compatible with the existing test suite and can be used for:
- Integration testing
- Payment flow validation
- Performance testing
- Gas optimization

## Troubleshooting

Common issues and solutions:
1. **"Contract not deployed"**: Run deployment script first
2. **"Insufficient funds"**: Check account balances
3. **"Transaction failed"**: Verify contract state and parameters
4. **"Network error"**: Ensure Hardhat node is running

## Contract Addresses

After deployment, contract addresses are saved in `deployment.json` and can be loaded for subsequent operations.
