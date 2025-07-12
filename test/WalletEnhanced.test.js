const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('Wallet Contract - Enhanced with Duplicate Prevention', function () {
    let wallet;
    let owner;
    let depositor1;
    let depositor2;
    let depositor3;

    beforeEach(async function () {
        [owner, depositor1, depositor2, depositor3] = await ethers.getSigners();
        
        const Wallet = await ethers.getContractFactory('Wallet');
        wallet = await Wallet.deploy();
        await wallet.waitForDeployment();
    });

    describe('Deployment', function () {
        it('Should set the right owner', async function () {
            expect(await wallet.owner()).to.equal(owner.address);
        });

        it('Should start with zero balance', async function () {
            expect(await wallet.balance()).to.equal(0);
        });

        it('Should start with zero depositors', async function () {
            expect(await wallet.getDepositorsCount()).to.equal(0);
        });
    });

    describe('Deposit Function', function () {
        it('Should allow valid deposits', async function () {
            const depositAmount = ethers.parseEther('1.0');
            
            await expect(wallet.connect(depositor1).deposit({ value: depositAmount }))
                .to.emit(wallet, 'Deposited')
                .withArgs(depositor1.address, depositAmount, depositAmount);
            
            expect(await wallet.balance()).to.equal(depositAmount);
            expect(await wallet.getDepositorsCount()).to.equal(1);
            expect(await wallet.getDepositorBalance(depositor1.address)).to.equal(depositAmount);
        });

        it('Should prevent duplicate depositor addresses in array', async function () {
            const depositAmount1 = ethers.parseEther('1.0');
            const depositAmount2 = ethers.parseEther('0.5');
            
            // First deposit
            await wallet.connect(depositor1).deposit({ value: depositAmount1 });
            expect(await wallet.getDepositorsCount()).to.equal(1);
            
            // Second deposit from same user
            await wallet.connect(depositor1).deposit({ value: depositAmount2 });
            expect(await wallet.getDepositorsCount()).to.equal(1); // Should still be 1
            
            // Check total balance is correct
            const totalDeposited = BigInt(depositAmount1) + BigInt(depositAmount2);
            expect(await wallet.getDepositorBalance(depositor1.address)).to.equal(totalDeposited);
        });

        it('Should track total deposits correctly', async function () {
            const depositAmount = ethers.parseEther('1.0');
            
            await wallet.connect(depositor1).deposit({ value: depositAmount });
            await wallet.connect(depositor1).deposit({ value: depositAmount }); // Same user
            await wallet.connect(depositor2).deposit({ value: depositAmount }); // Different user
            
            expect(await wallet.totalDeposits()).to.equal(3);
            expect(await wallet.getDepositorsCount()).to.equal(2); // Only 2 unique depositors
        });

        it('Should prevent owner from depositing', async function () {
            const depositAmount = ethers.parseEther('1.0');
            
            await expect(wallet.connect(owner).deposit({ value: depositAmount }))
                .to.be.revertedWith('Owner cannot deposit to their own wallet');
        });

        it('Should prevent zero deposits', async function () {
            await expect(wallet.connect(depositor1).deposit({ value: 0 }))
                .to.be.revertedWith('Deposit amount must be greater than zero');
        });
    });

    describe('Withdrawal Function', function () {
        beforeEach(async function () {
            const depositAmount = ethers.parseEther('2.0');
            await wallet.connect(depositor1).deposit({ value: depositAmount });
        });

        it('Should allow owner to withdraw', async function () {
            const withdrawAmount = ethers.parseEther('1.0');
            
            await expect(wallet.connect(owner).withdraw(withdrawAmount))
                .to.emit(wallet, 'Withdrawn')
                .withArgs(owner.address, withdrawAmount, ethers.parseEther('1.0'));
        });

        it('Should prevent non-owner from withdrawing', async function () {
            const withdrawAmount = ethers.parseEther('1.0');
            
            await expect(wallet.connect(depositor1).withdraw(withdrawAmount))
                .to.be.revertedWith('Only owner can withdraw');
        });

        it('Should prevent withdrawal of more than balance', async function () {
            const withdrawAmount = ethers.parseEther('3.0');
            
            await expect(wallet.connect(owner).withdraw(withdrawAmount))
                .to.be.revertedWith('Insufficient balance');
        });
    });

    describe('Refund Function', function () {
        beforeEach(async function () {
            const depositAmount = ethers.parseEther('2.0');
            await wallet.connect(depositor1).deposit({ value: depositAmount });
        });

        it('Should allow owner to refund depositor', async function () {
            const refundAmount = ethers.parseEther('1.0');
            
            await expect(wallet.connect(owner).refundDepositor(depositor1.address, refundAmount))
                .to.emit(wallet, 'DepositRefunded')
                .withArgs(depositor1.address, refundAmount);
                
            expect(await wallet.getDepositorBalance(depositor1.address))
                .to.equal(ethers.parseEther('1.0'));
        });

        it('Should prevent refund more than depositor balance', async function () {
            const refundAmount = ethers.parseEther('3.0');
            
            await expect(wallet.connect(owner).refundDepositor(depositor1.address, refundAmount))
                .to.be.revertedWith("Depositor doesn't have enough balance");
        });

        it('Should prevent non-owner from issuing refunds', async function () {
            const refundAmount = ethers.parseEther('1.0');
            
            await expect(wallet.connect(depositor1).refundDepositor(depositor2.address, refundAmount))
                .to.be.revertedWith('Only owner can issue refunds');
        });
    });

    describe('Receive Function', function () {
        it('Should handle direct Ether transfers', async function () {
            const sendAmount = ethers.parseEther('1.0');
            
            await expect(depositor1.sendTransaction({
                to: wallet.target,
                value: sendAmount
            }))
                .to.emit(wallet, 'Deposited')
                .withArgs(depositor1.address, sendAmount, sendAmount);
        });

        it('Should prevent owner from sending Ether directly', async function () {
            const sendAmount = ethers.parseEther('1.0');
            
            await expect(owner.sendTransaction({
                to: wallet.target,
                value: sendAmount
            }))
                .to.be.revertedWith('Owner cannot send Ether directly');
        });
    });

    describe('Utility Functions', function () {
        beforeEach(async function () {
            const depositAmount = ethers.parseEther('1.0');
            await wallet.connect(depositor1).deposit({ value: depositAmount });
            await wallet.connect(depositor2).deposit({ value: depositAmount });
        });

        it('Should return correct depositors count', async function () {
            expect(await wallet.getDepositorsCount()).to.equal(2);
        });

        it('Should return all depositors', async function () {
            const depositors = await wallet.getAllDepositors();
            expect(depositors.length).to.equal(2);
            expect(depositors).to.include(depositor1.address);
            expect(depositors).to.include(depositor2.address);
        });

        it('Should track if address has deposited', async function () {
            expect(await wallet.hasDepositorDeposited(depositor1.address)).to.be.true;
            expect(await wallet.hasDepositorDeposited(depositor3.address)).to.be.false;
        });
    });

    describe('Gas Efficiency', function () {
        it('Should not increase gas costs significantly with multiple deposits from same user', async function () {
            const depositAmount = ethers.parseEther('0.1');
            
            // First deposit
            const tx1 = await wallet.connect(depositor1).deposit({ value: depositAmount });
            const receipt1 = await tx1.wait();
            
            // Second deposit from same user
            const tx2 = await wallet.connect(depositor1).deposit({ value: depositAmount });
            const receipt2 = await tx2.wait();
            
            // Gas usage should be similar or less for second deposit
            // (since we skip adding to depositors array)
            expect(receipt2.gasUsed).to.be.lte(receipt1.gasUsed);
        });
    });
});