const { Web3 } = require('web3');
const { depositToWallet, withdrawFromWallet, refundDepositor, getWalletStats } = require('./walletPaymentScript');

// Configuration
const RPC_URL = 'http://localhost:8545';

async function runAllPaymentDemos() {
    console.log('🚀 COMPREHENSIVE PAYMENT SYSTEM DEMO');
    console.log('=====================================');
    
    const web3 = new Web3(RPC_URL);
    
    try {
        // Check network connection
        const networkId = await web3.eth.net.getId();
        console.log(`📡 Connected to network ID: ${networkId}`);
        
        // Demo 1: Wallet Contract Payments
        console.log('\n1️⃣ WALLET CONTRACT DEMO');
        console.log('========================');
        
        // Get initial wallet stats
        await getWalletStats();
        
        // Test deposits from different accounts
        const depositor1 = '0x59c6995e998f97a5a0044966f0945389dc9e86dae6e35b59e6b5b2c7d30181';
        const depositor2 = '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365';
        
        console.log('\n💰 Testing wallet deposits...');
        await depositToWallet(depositor1, '0.1');
        await depositToWallet(depositor2, '0.05');
        
        // Test withdrawal
        console.log('\n💸 Testing wallet withdrawal...');
        await withdrawFromWallet('0.03');
        
        // Test refund
        console.log('\n🔄 Testing wallet refund...');
        const depositor1Address = web3.eth.accounts.privateKeyToAccount(depositor1).address;
        await refundDepositor(depositor1Address, '0.02');
        
        // Final wallet stats
        await getWalletStats();
        
        console.log('\n🎉 All payment demos completed successfully!');
        
    } catch (error) {
        console.error('❌ Payment demo failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    runAllPaymentDemos().catch(console.error);
}

module.exports = { runAllPaymentDemos };