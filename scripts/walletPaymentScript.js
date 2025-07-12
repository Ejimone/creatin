const { ethers } = require("hardhat");
const fs = require("fs");

// Configuration
const WALLET_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Default deployment address

async function main() {
    console.log('🚀 WALLET CONTRACT PAYMENT DEMO');
    console.log('================================');

    try {
        const [owner, depositor1, depositor2] = await ethers.getSigners();
        const wallet = await ethers.getContractAt("Wallet", WALLET_ADDRESS);

        await getWalletStats(wallet);

        console.log('\n💰 Testing deposits...');
        await depositToWallet(wallet, depositor1, "0.1");
        await depositToWallet(wallet, depositor2, "0.05");
        await depositToWallet(wallet, depositor1, "0.02"); // Second deposit from same user

        await getWalletStats(wallet);

        console.log('\n💸 Testing withdrawal...');
        await withdrawFromWallet(wallet, owner, "0.05");

        console.log('\n🔄 Testing refund...');
        await refundDepositor(wallet, owner, depositor1.address, "0.03");

        await getWalletStats(wallet);

        console.log('\n🎉 All wallet operations completed successfully!');

    } catch (error) {
        console.error('❌ Demo failed:', error.message);
        process.exit(1);
    }
}

async function getWalletStats(wallet) {
    try {
        console.log('\n📊 WALLET STATISTICS');
        console.log('═══════════════════════');

        const balance = await wallet.balance();
        const totalDeposits = await wallet.totalDeposits();
        const depositorsCount = await wallet.getDepositorsCount();
        const allDepositors = await wallet.getAllDepositors();

        console.log(`💰 Total Balance: ${ethers.formatEther(balance)} ETH`);
        console.log(`📈 Total Deposits: ${totalDeposits}`);
        console.log(`👥 Unique Depositors: ${depositorsCount}`);
        console.log(`📋 Depositor Addresses: ${allDepositors.length > 0 ? allDepositors.join(', ') : 'None'}`);

        if (allDepositors.length > 0) {
            console.log('\n📊 Individual Depositor Balances:');
            for (let i = 0; i < allDepositors.length; i++) {
                const depositorBalance = await wallet.getDepositorBalance(allDepositors[i]);
                console.log(`   ${allDepositors[i]}: ${ethers.formatEther(depositorBalance)} ETH`);
            }
        }

    } catch (error) {
        console.error('❌ Failed to get wallet stats:', error.message);
    }
}

async function depositToWallet(wallet, depositor, amountEther) {
    try {
        console.log(`\n💰 Starting deposit of ${amountEther} ETH from ${depositor.address}...`);

        const tx = await wallet.connect(depositor).deposit({ value: ethers.parseEther(amountEther) });
        await tx.wait();

        console.log(`✅ Deposit successful! Transaction hash: ${tx.hash}`);

    } catch (error) {
        console.error('❌ Deposit failed:', error.message);
        throw error;
    }
}

async function withdrawFromWallet(wallet, owner, amountEther) {
    try {
        console.log(`\n💸 Starting withdrawal of ${amountEther} ETH...`);

        const tx = await wallet.connect(owner).withdraw(ethers.parseEther(amountEther));
        await tx.wait();

        console.log(`✅ Withdrawal successful! Transaction hash: ${tx.hash}`);

    } catch (error) {
        console.error('❌ Withdrawal failed:', error.message);
        throw error;
    }
}

async function refundDepositor(wallet, owner, depositorAddress, amountEther) {
    try {
        console.log(`\n🔄 Starting refund of ${amountEther} ETH to ${depositorAddress}...`);

        const tx = await wallet.connect(owner).refundDepositor(depositorAddress, ethers.parseEther(amountEther));
        await tx.wait();

        console.log(`✅ Refund successful! Transaction hash: ${tx.hash}`);

    } catch (error) {
        console.error('❌ Refund failed:', error.message);
        throw error;
    }
}

main().catch(console.error);
